// Wi-Fight local server. Two jobs:
//  1. Serve the app from ./public.
//  2. Run Proof AI's language model away from the browser. The page calls /api/ai and /api/chat,
//     and only this server talks to a model. Three backends, chosen in this order:
//       claude  : Anthropic's Claude, when ANTHROPIC_API_KEY is set.
//       groq    : a hosted model on Groq, when GROQ_API_KEY is set.
//       local   : a model running on this computer through Ollama. No key, no cost, nothing leaves the machine.
//       none    : the app falls back to its built-in writer and says so.
//     Keys are read from the environment or from a .env file next to this file. They never reach the browser.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// Load settings from .env (KEY=value per line). Real environment variables win. The file is ignored by git.
try {
  for (const line of fs.readFileSync(path.join(here, '.env'), 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m || line.trim().startsWith('#')) continue;
    const value = m[2].replace(/^["'](.*)["']$/, '$1');
    if (value && process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
} catch { /* no .env file, which is fine */ }
const PUBLIC = path.join(here, 'public');
const PORT = Number(process.env.PORT || 4810);
const MODEL = 'claude-opus-5-5';
const OLLAMA = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
// Local models, best first. The first one that is installed is used. Override with WIFIGHT_LOCAL_MODEL.
const LOCAL_PREFS = process.env.WIFIGHT_LOCAL_MODEL ? [process.env.WIFIGHT_LOCAL_MODEL] : ['gemma3:12b', 'gemma3:4b'];
let LOCAL_MODEL = LOCAL_PREFS[0];
const hasKey = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
// Groq (OpenAI-compatible API). Model names can be changed in .env without touching code.
const GROQ_KEY = process.env.GROQ_API_KEY || '';
const GROQ_URL = (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '');
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const GROQ_VISION_MODEL = process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';
// Force one backend with WIFIGHT_PROVIDER=claude|groq|local|none. Default: the first one available.
const FORCE = (process.env.WIFIGHT_PROVIDER || '').toLowerCase();

let client = null, z = null, zodOutputFormat = null, Anthropic = null;
if (hasKey) {
  try {
    Anthropic = (await import('@anthropic-ai/sdk')).default;
    ({ z } = await import('zod'));
    ({ zodOutputFormat } = await import('@anthropic-ai/sdk/helpers/zod'));
    client = new Anthropic();
  } catch (e) { console.warn('Claude disabled: could not load the Anthropic SDK.', e.message); }
}

// Is a local model available? Checked at most every 8 seconds.
let localSeen = { at: 0, ok: false };
async function localReady() {
  if (Date.now() - localSeen.at < 8000) return localSeen.ok;
  let ok = false;
  try {
    const r = await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(1200) });
    if (r.ok) { const names = ((await r.json()).models || []).map((m) => m.name); const pick = LOCAL_PREFS.find((want) => names.includes(want)); if (pick) { LOCAL_MODEL = pick; ok = true; } }
  } catch { ok = false; }
  localSeen = { at: Date.now(), ok };
  return ok;
}
async function provider() {
  if (FORCE === 'none') return null;
  if (FORCE === 'claude') return client ? 'claude' : null;
  if (FORCE === 'groq') return GROQ_KEY ? 'groq' : null;
  if (FORCE === 'local') return (await localReady()) ? 'local' : null;
  if (client) return 'claude';
  if (GROQ_KEY) return 'groq';
  if (await localReady()) return 'local';
  return null;
}
const describe = (p) => (p === 'claude' ? { live: true, provider: 'claude', model: MODEL, label: 'Claude' } : p === 'groq' ? { live: true, provider: 'groq', model: GROQ_MODEL, label: `Groq (${GROQ_MODEL})` } : p === 'local' ? { live: true, provider: 'local', model: LOCAL_MODEL, label: `a model on this computer (${LOCAL_MODEL})` } : { live: false, provider: null, model: null, label: 'offline mode' });

// Grounding check. Every number the model writes must exist in the facts it was given.
// A model that invents a number about the user's connection is caught here.
const SAFE = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 20, 24, 30, 50, 60, 80, 100, 2024, 2025, 2026, 2027]);
function numbersIn(v, out = new Set()) {
  if (typeof v === 'number') { out.add(Math.round(v)); out.add(Math.round(v * 12)); }
  else if (typeof v === 'string') (v.match(/\d+(?:\.\d+)?/g) || []).forEach((n) => out.add(Math.round(Number(n))));
  else if (Array.isArray(v)) v.forEach((x) => numbersIn(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => numbersIn(x, out));
  return out;
}
function ungrounded(text, facts) {
  const ok = numbersIn(facts);
  const bad = new Set();
  (String(text).replace(/,(?=\d{3})/g, '').match(/\d+(?:\.\d+)?/g) || []).forEach((n) => { const r = Math.round(Number(n)); if (!SAFE.has(r) && !ok.has(r)) bad.add(n); });
  return [...bad];
}

const SYSTEM = `You are Proof AI, the assistant inside Wi-Fight, an app that checks whether a household gets the internet speed it pays for.
Rules you always follow:
- Use only the numbers in the FACTS JSON the app gives you. Never invent a number, a date, a provider, or a cause. If the facts do not answer the question, say what is missing.
- Write for a general reader. Short sentences. Plain words. Say "provider" not ISP, "response time" not latency, "fair line" for the 80 percent threshold.
- Never use an em dash or an en dash. Do not use emoji.
- You suggest. The user decides. Nothing is ever sent without the user's approval, so never claim that something was sent or changed.
- Wrap the one or two most important phrases in **double asterisks**. No other formatting.`;

const TASKS = {
  insight: (b) => ({
    schema: () => z.object({ sentence: z.string(), reasons: z.array(z.object({ title: z.string(), detail: z.string() })).max(3) }),
    prompt: `Write the dashboard insight. "sentence": one or two sentences (max 32 words) saying what the results mean and the most likely cause. "reasons": up to 3 reasons, each a short bold-worthy title (max 8 words, ends with a period) and one detail sentence that cites a number from FACTS.\n\nFACTS:\n${JSON.stringify(b.facts)}`,
  }),
  verdict: (b) => ({
    schema: () => z.object({ sentence: z.string(), reasons: z.array(z.object({ title: z.string(), detail: z.string() })).max(3) }),
    prompt: `The two-week check is complete. "sentence": explain the verdict in three plain sentences. "reasons": 3 reasons, each a short title (ends with a period) and one detail sentence citing numbers from FACTS.\n\nFACTS:\n${JSON.stringify(b.facts)}`,
  }),
  chat: (b) => ({
    schema: () => z.object({ headline: z.string(), paragraphs: z.array(z.object({ text: z.string(), source: z.enum(['speed tests', 'evening tests', 'router check', 'plan label', 'your bill', 'plans near you', 'none']) })).max(4), followups: z.array(z.string()).max(3) }),
    prompt: `Answer the user's question from FACTS only. "headline": the direct answer in one or two sentences. "paragraphs": up to 3 short supporting paragraphs, each starting with a short lead phrase wrapped in ** and each naming the data source it used. "followups": 3 short questions the user might ask next.\n\nQUESTION: ${String(b.question || '').slice(0, 500)}\n\nRECENT CONVERSATION:\n${JSON.stringify((b.history || []).slice(-6))}\n\nFACTS:\n${JSON.stringify(b.facts)}`,
  }),
  draft: (b) => ({
    schema: () => z.object({ subject: z.string(), body: z.string() }),
    prompt: `Draft a message from the user to their internet provider's support team. Tone: ${['polite', 'firm', 'short'].includes(b.tone) ? b.tone : 'polite'}. 4 to 6 sentences (2 to 3 if the tone is short). State the plan and price, the measured median speed and percent of plan, how many days fell below the fair line, and that tests next to the router were low too if FACTS says so. Ask for a fix or a bill credit. Sign with the user's first name from FACTS. Plain text with line breaks. No ** markers in this task.\n\nFACTS:\n${JSON.stringify(b.facts)}`,
  }),
  bill: () => ({
    schema: () => z.object({ planPrice: z.number().nullable(), equipment: z.number().nullable(), fees: z.array(z.object({ name: z.string(), amount: z.number(), junk: z.boolean(), why: z.string() })), total: z.number().nullable(), promoEnds: z.string().nullable(), provider: z.string().nullable(), plan: z.string().nullable(), confidence: z.enum(['high', 'medium', 'low']) }),
    prompt: `Read this internet bill photo. Extract the monthly plan price, any equipment rental, each extra fee (mark "junk": true for company-imposed fees that are not government taxes, such as network enhancement, infrastructure, or administrative fees, and say why in one short sentence), the total, and when any promotional price ends. Use null for anything you cannot read. Set confidence to how legible the bill was.`,
  }),
};

// The facts as plain sentences. Small models answer far better from sentences than from JSON keys.
function factSheet(f) {
  if (!f || !f.headline) return 'The user has no speed test results yet. Tell them to open "Run a test".';
  const L = [];
  L.push(`User's first name: ${f.userFirstName || 'unknown'}.`);
  L.push(`Plan: ${f.plan.name}. The provider's label promises a typical DOWNLOAD speed of ${f.plan.typicalDownloadMbps} Mbps. Price: $${f.plan.pricePerMonth} a month.`);
  L.push(`Fair line: ${f.fairLineMbps} Mbps (80% of the promised download speed). At or above it is fine. Below it is a shortfall.`);
  L.push(`Two-week check: day ${f.dayNumber} of ${f.totalDays}, ${f.checkComplete ? 'finished' : 'still running'}. ${f.testsCount} tests so far.`);
  L.push(`DOWNLOAD speed (the main result): median ${f.headline.medianMbps} Mbps over ${f.headline.basedOn}. That is ${f.headline.percentOfPlan}% of the plan. Status: ${f.headline.status}.`);
  L.push(`Days below the fair line: ${f.daysBelowFairLine} of ${f.daysMeasured} measured days. Longest run in a row: ${f.longestRunBelowFairLine} days. (3 days in a row counts as a real shortfall.)`);
  if (f.eveningAverageMbps != null && f.daytimeAverageMbps != null) L.push(`Time of day: evening tests (7 to 11 PM) average ${f.eveningAverageMbps} Mbps download. Daytime tests average ${f.daytimeAverageMbps} Mbps download.`);
  if (f.upload) L.push(`UPLOAD speed: median ${f.upload.medianMbps} Mbps (plan lists ${f.upload.planMbps} Mbps). Status: ${f.upload.status}.`);
  if (f.responseTime) L.push(`RESPONSE TIME (also called latency or ping, measured in milliseconds, lower is better): median ${f.responseTime.medianMs} ms. Status: ${f.responseTime.status}. This is a different thing from speed.`);
  if (f.routerCheck) L.push(`Router check: next to the router ${f.routerCheck.nearRouterMbps} Mbps, in a far room ${f.routerCheck.farRoomMbps} Mbps. A small gap means home Wi-Fi is not the cause.`);
  else L.push('Router check: not done yet. Without it, Wi-Fi cannot be ruled out. The user can run one from "Run a test".');
  L.push(`Most likely cause: ${f.diagnosis.likelyCause}. Confidence: ${f.diagnosis.confidenceLevel}${f.diagnosis.confidencePercent ? ', ' + f.diagnosis.confidencePercent + '%' : ''}.`);
  if (f.oneOffDipsIgnored && f.oneOffDipsIgnored.length) L.push(`One-off dips that were ignored (not counted): ${f.oneOffDipsIgnored.map((d) => `${d.when} at ${d.mbps} Mbps`).join('; ')}.`);
  if (f.bestDay && f.worstDay) L.push(`Best day: day ${f.bestDay.day} at ${f.bestDay.mbps} Mbps. Worst day: day ${f.worstDay.day} at ${f.worstDay.mbps} Mbps.`);
  if (f.money) L.push(`Money: about $${f.money.paidForNotReceivedPerMonth} a month (${f.money.percentOfBill}% of the bill) pays for speed that was not received. This is an estimate.`);
  if (f.bill) L.push(`Bill: plan price $${f.bill.planPrice}, equipment rental $${f.bill.equipment}${(f.bill.fees || []).map((x) => `, "${x.name}" $${x.amount}${x.junk ? ' (looks like a company fee, not a tax)' : ''}`).join('')}, total $${f.bill.total}${f.bill.promoEnds ? ', promo price ends ' + f.bill.promoEnds : ''}.`);
  if (f.nextTest) L.push(`Next scheduled test: ${f.nextTest}.`);
  if (f.sampleData) L.push('These results are SAMPLE data loaded for a demo.');
  return L.map((x) => '- ' + x).join('\n');
}

const CHAT_SYSTEM = (facts) => `You are Proof AI, the assistant inside Wi-Fight, an app that checks whether a household gets the internet speed it pays for. You are chatting with the user. Be warm, direct, and useful, like a knowledgeable friend. Remember the earlier turns.

HOW TO ANSWER
1. Start with the direct answer in one sentence.
2. Then give the reason, using the user's own numbers from the FACT SHEET. Say where a number comes from in natural words, for example "your evening tests", "the test next to your router", "your plan's label".
3. End with one practical next step when it helps. Name the page: Run a test, History, Diagnosis, Plans, Report, Privacy.

RULES
- Every number about this user must come from the FACT SHEET. Never invent or guess a number. If the fact sheet does not have it, say you do not have that yet.
- Download speed, upload speed, and response time are three different things. Never mix them up. Speed is in Mbps. Response time is in ms.
- For general questions (what a word means, how Wi-Fi works, how to restart a router, what a provider must do) answer from general knowledge, briefly.
- If the user asks about something that is not internet service, say in one friendly sentence that you only help with internet service, and suggest a question you can answer.
- You cannot run tests, change settings, or send messages. The Report page drafts a message to the provider, and the user approves it before anything is sent.
- Complaining is reasonable when download speed has been below the fair line for 3 or more days in a row.
- Plain words. Say "provider", not ISP. No jargon without explaining it. Never use an em dash. No emoji.
- Format: short paragraphs. Use **bold** for the one or two key phrases. Use lines starting with "- " for a short list when it helps. No headings.
- Keep it under 120 words unless the user asks for more detail.

FACT SHEET
${factSheet(facts)}`;

// JSON Schemas for the local model's structured answers (same shapes as the Claude path).
const reasonsSchema = { type: 'object', properties: { sentence: { type: 'string' }, reasons: { type: 'array', maxItems: 3, items: { type: 'object', properties: { title: { type: 'string' }, detail: { type: 'string' } }, required: ['title', 'detail'] } } }, required: ['sentence', 'reasons'] };
const LOCAL_SCHEMA = {
  insight: reasonsSchema, verdict: reasonsSchema,
  draft: { type: 'object', properties: { subject: { type: 'string' }, body: { type: 'string' } }, required: ['subject', 'body'] },
  bill: { type: 'object', properties: { planPrice: { type: ['number', 'null'] }, equipment: { type: ['number', 'null'] }, fees: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, amount: { type: 'number' }, junk: { type: 'boolean' }, why: { type: 'string' } }, required: ['name', 'amount', 'junk', 'why'] } }, total: { type: ['number', 'null'] }, promoEnds: { type: ['string', 'null'] }, provider: { type: ['string', 'null'] }, plan: { type: ['string', 'null'] }, confidence: { type: 'string', enum: ['high', 'medium', 'low'] } }, required: ['planPrice', 'equipment', 'fees', 'total', 'promoEnds', 'confidence'] },
};

async function runLocal(body, t) {
  if (!LOCAL_SCHEMA[body.task]) return { status: 400, json: { error: 'This task is not available on the local model.' } };
  // Short dashboard and verdict cards: with a local model the app's built-in writer is used instead.
  // It is instant and it cannot misstate a number. The local model is used for chat, drafts, and bill photos.
  if (body.task === 'insight' || body.task === 'verdict') return { status: 409, json: { error: 'use-writer' } };
  if (body.task === 'draft') return runLocalDraft(body);
  const msg = { role: 'user', content: t.prompt };
  if (body.task === 'bill') {
    const m = /^data:image\/(?:png|jpeg|webp|gif);base64,(.+)$/.exec(body.image || '');
    if (!m) return { status: 400, json: { error: 'A PNG, JPEG, WebP, or GIF photo is required.' } };
    msg.images = [m[1]];
  }
  try {
    const r = await fetch(`${OLLAMA}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(90000),
      body: JSON.stringify({ model: LOCAL_MODEL, stream: false, keep_alive: '30m', format: LOCAL_SCHEMA[body.task], options: { temperature: 0.2 }, messages: [{ role: 'system', content: SYSTEM }, msg] }) });
    if (!r.ok) { console.warn('Local model error', r.status, (await r.text()).slice(0, 300)); return { status: 502, json: { error: `Local model error ${r.status}` } }; }
    const j = await r.json();
    let result; try { result = JSON.parse(j.message.content); } catch { return { status: 502, json: { error: 'The local model returned an unreadable answer.' } }; }
    if (body.task !== 'bill') {
      const bad = ungrounded(JSON.stringify(result), body.facts);
      if (bad.length) return { status: 422, json: { error: 'grounding', detail: `The model wrote numbers that are not in your data (${bad.slice(0, 4).join(', ')}), so its answer was discarded.` } };
    }
    return { status: 200, json: { mode: 'live', provider: 'local', model: LOCAL_MODEL, result } };
  } catch { return { status: 502, json: { error: 'Could not reach the local model.' } }; }
}

// The report draft prompt, shared by the local and Groq backends. Plain text, first line is the subject.
function draftPrompt(body) {
  const tone = ['polite', 'firm', 'short'].includes(body.tone) ? body.tone : 'polite';
  const system = `You write short, factual messages from a customer to their internet provider's support team.
Use only the facts given. Never invent a number, a name, or an account detail. Never use placeholders in square brackets.
Plain text only. No bold, no lists. Never use an em dash. Say "provider" where a general word is needed.
Output format, exactly: the first line is "Subject: " followed by a short subject. Then a blank line. Then the message.`;
  const prompt = `Write the message. Tone: ${tone}. Length: ${tone === 'short' ? '2 to 3 sentences' : '4 to 6 sentences'}.
Start with "Hello ${String((body.facts && body.facts.plan && body.facts.plan.name) || 'provider').split(' ')[0]} support,".
Include: the plan name and price, the promised download speed, the measured median download speed and the percent of plan, how many days fell below the fair line, and, if the router check shows a small gap, that the test next to the router was low too so Wi-Fi is not the cause.
Ask them to fix it or credit the bill.${tone === 'firm' ? ' Say that the customer will file a complaint with the FCC if it is not resolved.' : ''}
End with "The full report is attached." and sign with the user's first name.

FACTS
${factSheet(body.facts)}`;
  return { system, prompt };
}
function parseDraft(raw, facts) {
  const text = String(raw || '').replace(/\s*[\u2014\u2013]\s*/g, ', ').replace(/\*\*/g, '').trim();
  const m = /^Subject:\s*(.+)\n+([\s\S]+)$/i.exec(text);
  if (!m || /\[[^\]]+\]/.test(text)) return { status: 502, json: { error: 'The model returned an unusable draft.' } };
  const result = { subject: m[1].trim(), body: m[2].trim() };
  const bad = ungrounded(result.subject + ' ' + result.body, facts);
  if (bad.length) return { status: 422, json: { error: 'grounding', detail: `The model wrote numbers that are not in your data (${bad.slice(0, 4).join(', ')}), so its draft was discarded.` } };
  return { status: 200, result };
}

async function runLocalDraft(body) {
  const { system, prompt } = draftPrompt(body);
  try {
    const r = await fetch(`${OLLAMA}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(120000),
      body: JSON.stringify({ model: LOCAL_MODEL, stream: false, keep_alive: '30m', options: { temperature: 0.3, num_ctx: 8192 }, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] }) });
    if (!r.ok) { console.warn('Local model error', r.status, (await r.text()).slice(0, 300)); return { status: 502, json: { error: `Local model error ${r.status}` } }; }
    const out = parseDraft((await r.json()).message.content, body.facts);
    return out.result ? { status: 200, json: { mode: 'live', provider: 'local', model: LOCAL_MODEL, result: out.result } } : out;
  } catch (e) { console.warn('Local draft failed', e.message); return { status: 502, json: { error: 'Could not reach the local model.' } }; }
}

// ---- Groq (OpenAI-compatible chat completions) ----
async function groqFetch(payload, signal) {
  return fetch(`${GROQ_URL}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` }, signal: signal || AbortSignal.timeout(60000), body: JSON.stringify(payload) });
}
const groqError = (status) => (status === 401 || status === 403 ? { status: 401, json: { error: 'The Groq key was rejected. Check GROQ_API_KEY in .env.' } } : status === 429 ? { status: 429, json: { error: 'Groq is busy or the free limit was reached. Try again in a moment.' } } : status === 404 || status === 400 ? { status: 502, json: { error: 'Groq rejected the request. The model name in .env may be out of date.' } } : { status: 502, json: { error: `Groq error ${status}` } });
const JSON_SHAPE = {
  insight: '{"sentence": string, "reasons": [{"title": string, "detail": string}]} with at most 3 reasons',
  verdict: '{"sentence": string, "reasons": [{"title": string, "detail": string}]} with exactly 3 reasons',
  bill: '{"planPrice": number|null, "equipment": number|null, "fees": [{"name": string, "amount": number, "junk": boolean, "why": string}], "total": number|null, "promoEnds": string|null, "provider": string|null, "plan": string|null, "confidence": "high"|"medium"|"low"}',
};
async function runGroq(body, t) {
  try {
    if (body.task === 'draft') {
      const { system, prompt } = draftPrompt(body);
      const r = await groqFetch({ model: GROQ_MODEL, temperature: 0.3, max_tokens: 700, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] });
      if (!r.ok) { console.warn('Groq error', r.status, (await r.text()).slice(0, 300)); return groqError(r.status); }
      const out = parseDraft((await r.json()).choices[0].message.content, body.facts);
      return out.result ? { status: 200, json: { mode: 'live', provider: 'groq', model: GROQ_MODEL, result: out.result } } : out;
    }
    if (!JSON_SHAPE[body.task]) return { status: 400, json: { error: 'Unknown task' } };
    const system = `${SYSTEM}\nReply with one JSON object only, no other text. Shape: ${JSON_SHAPE[body.task]}.`;
    let model = GROQ_MODEL, user;
    if (body.task === 'bill') {
      if (!/^data:image\/(?:png|jpeg|webp|gif);base64,/.test(body.image || '')) return { status: 400, json: { error: 'A PNG, JPEG, WebP, or GIF photo is required.' } };
      model = GROQ_VISION_MODEL;
      user = [{ type: 'text', text: t.prompt }, { type: 'image_url', image_url: { url: body.image } }];
    } else {
      const ask = body.task === 'insight'
        ? 'Write the dashboard insight. "sentence": one or two sentences (max 32 words) saying what the results mean and the most likely cause. "reasons": up to 3, each with a short title that ends with a period and one detail sentence that cites a number from the facts.'
        : 'The two-week check is complete. "sentence": explain the verdict in three plain sentences. "reasons": 3, each with a short title that ends with a period and one detail sentence that cites numbers from the facts.';
      user = `${ask}\nDownload speed, upload speed, and response time are different things. Do not mix up Mbps with dollars.\n\nFACTS\n${factSheet(body.facts)}`;
    }
    const r = await groqFetch({ model, temperature: 0.2, max_tokens: 900, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] });
    if (!r.ok) { console.warn('Groq error', r.status, (await r.text()).slice(0, 300)); return groqError(r.status); }
    let result; try { result = JSON.parse((await r.json()).choices[0].message.content); } catch { return { status: 502, json: { error: 'Groq returned an unreadable answer.' } }; }
    if (body.task !== 'bill') {
      if (typeof result.sentence !== 'string' || !Array.isArray(result.reasons)) return { status: 502, json: { error: 'Groq returned an answer in the wrong shape.' } };
      result.reasons = result.reasons.filter((x) => x && typeof x.title === 'string' && typeof x.detail === 'string').slice(0, 3);
      const bad = ungrounded(JSON.stringify(result), body.facts);
      if (bad.length) return { status: 422, json: { error: 'grounding', detail: `The model wrote numbers that are not in your data (${bad.slice(0, 4).join(', ')}), so its answer was discarded.` } };
    } else if (!Array.isArray(result.fees)) result.fees = [];
    return { status: 200, json: { mode: 'live', provider: 'groq', model, result } };
  } catch (e) { console.warn('Groq request failed', e.message); return { status: 502, json: { error: 'Could not reach Groq.' } }; }
}

// Streaming chat. Sends Server-Sent Events: {delta}, then {done, ungrounded, provider, model}.
async function runChat(body, res) {
  const p = await provider();
  if (!p) { res.writeHead(503, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'offline' })); }
  const history = (Array.isArray(body.messages) ? body.messages : []).filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim()).slice(-20).map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  while (history.length && history[0].role !== 'user') history.shift();
  if (!history.length || history[history.length - 1].role !== 'user') { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'A user message is required.' })); }
  res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  const send = (o) => res.write(`data: ${JSON.stringify(o)}\n\n`);
  const system = CHAT_SYSTEM(body.facts || {});
  let full = '', closed = false;
  const ac = new AbortController();
  res.on('close', () => { closed = true; ac.abort(); });
  const noDash = (t) => t.replace(/\s*[\u2014\u2013]\s*/g, ', ');
  try {
    if (p === 'claude') {
      const stream = client.messages.stream({ model: MODEL, max_tokens: 64000, system, output_config: { effort: 'low' }, messages: history }, { signal: ac.signal });
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') { const d = noDash(event.delta.text); full += d; send({ delta: d }); }
      }
      const final = await stream.finalMessage();
      if (final.stop_reason === 'refusal') { send({ error: 'The model declined to answer that.' }); return res.end(); }
    } else if (p === 'groq') {
      const r = await groqFetch({ model: GROQ_MODEL, stream: true, temperature: 0.3, max_tokens: 900, messages: [{ role: 'system', content: system }, ...history] }, ac.signal);
      if (!r.ok || !r.body) { console.warn('Groq error', r.status, (await r.text()).slice(0, 300)); send({ error: groqError(r.status).json.error }); return res.end(); }
      const dec = new TextDecoder(); let buf = '';
      for await (const chunk of r.body) {
        buf += dec.decode(chunk, { stream: true });
        let i; while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') continue;
          let j; try { j = JSON.parse(data); } catch { continue; }
          const d = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content ? noDash(j.choices[0].delta.content) : '';
          if (d) { full += d; send({ delta: d }); }
        }
      }
    } else {
      const r = await fetch(`${OLLAMA}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ac.signal,
        body: JSON.stringify({ model: LOCAL_MODEL, stream: true, keep_alive: '30m', options: { temperature: 0.2, num_ctx: 8192 }, messages: [{ role: 'system', content: system }, ...history] }) });
      if (!r.ok || !r.body) { send({ error: `Local model error ${r.status}` }); return res.end(); }
      const dec = new TextDecoder(); let buf = '';
      for await (const chunk of r.body) {
        buf += dec.decode(chunk, { stream: true });
        let i; while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
          if (!line) continue;
          let j; try { j = JSON.parse(line); } catch { continue; }
          const d = j.message && j.message.content ? noDash(j.message.content) : '';
          if (d) { full += d; send({ delta: d }); }
        }
      }
    }
    send({ done: true, ...describe(p), ungrounded: ungrounded(full, body.facts || {}) });
  } catch (error) {
    if (!closed) {
      let msg = 'The AI service stopped unexpectedly.';
      if (Anthropic && error instanceof Anthropic.RateLimitError) msg = 'The AI service is busy. Try again in a moment.';
      else if (Anthropic && error instanceof Anthropic.AuthenticationError) msg = 'The AI key was rejected.';
      send({ error: msg });
    }
  }
  if (!closed) res.end();
}

async function runAI(body) {
  const make = TASKS[body.task];
  if (!make) return { status: 400, json: { error: 'Unknown task' } };
  const t = make(body);
  const p = await provider();
  if (p === 'local') return runLocal(body, t);
  if (p === 'groq') return runGroq(body, t);
  if (!p) return { status: 503, json: { error: 'offline' } };
  const content = [];
  if (body.task === 'bill') {
    const m = /^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/.exec(body.image || '');
    if (!m) return { status: 400, json: { error: 'A PNG, JPEG, WebP, or GIF photo is required.' } };
    content.push({ type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } });
  }
  content.push({ type: 'text', text: t.prompt });
  try {
    const response = await client.messages.parse({
      model: MODEL, max_tokens: 16000, system: SYSTEM,
      output_config: { effort: 'low', format: zodOutputFormat(t.schema()) },
      messages: [{ role: 'user', content }],
    });
    if (response.stop_reason === 'refusal') return { status: 422, json: { error: 'The model declined this request.' } };
    if (!response.parsed_output) return { status: 502, json: { error: 'The model returned an unreadable answer.' } };
    if (body.task !== 'bill') {
      const bad = ungrounded(JSON.stringify(response.parsed_output), body.facts);
      if (bad.length) return { status: 422, json: { error: 'grounding', detail: `The model wrote numbers that are not in your data (${bad.slice(0, 4).join(', ')}), so its answer was discarded.` } };
    }
    return { status: 200, json: { mode: 'live', provider: 'claude', model: MODEL, result: response.parsed_output } };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return { status: 401, json: { error: 'The AI key was rejected.' } };
    if (error instanceof Anthropic.RateLimitError) return { status: 429, json: { error: 'The AI service is busy. Try again in a moment.' } };
    if (error instanceof Anthropic.APIError) return { status: 502, json: { error: `AI service error ${error.status || ''}`.trim() } };
    return { status: 500, json: { error: 'Could not reach the AI service.' } };
  }
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
const send = (res, status, body, type = 'application/json; charset=utf-8') => { res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' }); res.end(body); };

// Simple per-process rate limit so a stuck page cannot run up a bill.
let windowStart = Date.now(), calls = 0;
const allow = () => { if (Date.now() - windowStart > 60000) { windowStart = Date.now(); calls = 0; } return ++calls <= 30; };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/status') return send(res, 200, JSON.stringify(describe(await provider())));
  if (url.pathname === '/api/ai') {
    if (req.method !== 'POST') return send(res, 405, JSON.stringify({ error: 'POST only' }));
    if (!(await provider())) return send(res, 503, JSON.stringify({ error: 'offline' }));
    if (!allow()) return send(res, 429, JSON.stringify({ error: 'Too many AI requests. Wait a minute.' }));
    let raw = ''; let tooBig = false;
    req.on('data', (c) => { raw += c; if (raw.length > 8e6) { tooBig = true; req.destroy(); } });
    req.on('end', async () => {
      if (tooBig) return;
      let body; try { body = JSON.parse(raw); } catch { return send(res, 400, JSON.stringify({ error: 'Bad JSON' })); }
      const out = await runAI(body);
      send(res, out.status, JSON.stringify(out.json));
    });
    return;
  }
  if (url.pathname === '/api/chat') {
    if (req.method !== 'POST') return send(res, 405, JSON.stringify({ error: 'POST only' }));
    if (!allow()) return send(res, 429, JSON.stringify({ error: 'Too many AI requests. Wait a minute.' }));
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 1e6) req.destroy(); });
    req.on('end', async () => { let body; try { body = JSON.parse(raw); } catch { return send(res, 400, JSON.stringify({ error: 'Bad JSON' })); } await runChat(body, res); });
    return;
  }
  // static files
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  if (rel === '/favicon.ico') rel = '/img/app-icon.svg';
  if (!path.extname(rel)) rel += '.html';
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC)) return send(res, 403, 'Forbidden', 'text/plain');
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'Not found', 'text/plain');
    send(res, 200, data, TYPES[path.extname(file)] || 'application/octet-stream');
  });
}).listen(PORT, () => {
  // Load the local model into memory now, so the first chat answer is not slow.
  provider().then((p) => { if (p === 'local') fetch(`${OLLAMA}/api/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: LOCAL_MODEL, prompt: '', keep_alive: '30m' }) }).catch(() => {}); });
  console.log(`Wi-Fight is running at http://localhost:${PORT}`);
  provider().then((p) => console.log(p === 'claude' ? `Proof AI: live, using Claude (${MODEL})` : p === 'groq' ? `Proof AI: live, using Groq (${GROQ_MODEL})` : p === 'local' ? `Proof AI: live, using a model on this computer (${LOCAL_MODEL})` : 'Proof AI: offline mode. Put GROQ_API_KEY or ANTHROPIC_API_KEY in .env, or run Ollama with one of these models: ' + LOCAL_PREFS.join(', ') + '.'));
});
