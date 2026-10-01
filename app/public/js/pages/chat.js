// Ask Proof AI: a real multi-turn chat over the user's own results.
// The numbers come from the engine. The words stream from AI.chatStream (a language model, or the built-in writer),
// and every answer says who wrote it. Nothing is sent while "Let Proof AI use my data" is off.
// Conversations are saved in state.chats, inside the encrypted store.
import { boot, $, $$, esc, toast, closeSheet, AI, Store } from '../shell.js';
import { fmtTime, fmtDate } from '../engine.js';
import { openSheet, switchHTML, copyText } from './ui-sheet.js';

const { facts, ai: status } = await boot({ need: 'plan' });
const S = () => Store.get();
const aiOn = () => !(S().settings && S().settings.aiAnalyze === false);
let catalog = null;
try { catalog = await (await fetch('data/plans.json')).json(); } catch { catalog = null; }

const IC = {
  spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 5.6a3 3 0 0 0 1.9 1.9L21.4 11.4l-5.6 1.9a3 3 0 0 0-1.9 1.9L12 20.8l-1.9-5.6a3 3 0 0 0-1.9-1.9L2.600 11.4l5.6-1.9a3 3 0 0 0 1.9-1.9z"/></svg>',
  bars: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 20V10M12 20V4M19 20v-7"/></svg>',
  wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2.5 9a14 14 0 0 1 19 0M6 12.5a9 9 0 0 1 12 0M9.2 16a4.5 4.5 0 0 1 5.6 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3" fill="currentColor"/></svg>',
  money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 6.5C16 5 14.3 4.5 12 4.5c-2.800 0-4.500 1.300-4.500 3.400 0 4.800 10 2.400 10 7.600 0 2.200-2 3.500-5.500 3.500-2.500 0-4.500-.8-5.500-2.500"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11v9H4v-9zM7 11l4-8c1.500 0 2.500 1 2.500 2.500V9h5a2 2 0 0 1 2 2.300l-1.200 7a2 2 0 0 1-2 1.700H7"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 13V4H4v9zM7 13l4 8c1.500 0 2.500-1 2.500-2.500V15h5a2 2 0 0 0 2-2.300l-1.200-7a2 2 0 0 0-2-1.700H7"/></svg>',
  regen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 0 0-14.3-4.500L4 8M4 4v4h4M4 13a8 8 0 0 0 14.300 4.500L20 16M20 20v-4h-4"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="6.5" width="11" height="11" rx="2.5"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2.500 20h19z"/><path d="M12 10v4.500M12 17.500v.5"/></svg>',
};

const main = $('.chatmain'), msgs = $('#msgs'), thread = $('#thread'), form = $('#composer'), input = $('#q'), sendBtn = $('#send'), jump = $('#jump');
const iso = () => new Date().toISOString();
const newId = () => 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
const fresh = () => ({ id: newId(), title: '', createdAt: iso(), updatedAt: iso(), messages: [] });
const titleOf = (t) => { const one = String(t).replace(/\s+/g, ' ').trim(); return one.length > 40 ? one.slice(0, 39).trimEnd() + '...' : one; };
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const WAIT_MS = 90000; // no text for this long means the answer failed

let cur = fresh();        // the conversation on screen. Not saved until its first message.
let busy = null;          // while a reply streams: { conv, ctrl, text, timedOut }
let pending = null;       // the promise of the running reply
let failed = null;        // id of the conversation whose last question got no answer
let confirmId = null;     // chat waiting for a delete confirmation
let stick = true;         // keep the newest text in view unless the user scrolled up

/* ---------- storage ---------- */
// One-time move of the old single chat (state.chat) into a saved conversation.
async function migrate() {
  const old = S().chat;
  if (!Array.isArray(old) || !old.length) return;
  const messages = old.filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.text).map((m) => ({
    role: m.role, text: String(m.text), t: m.t || iso(),
    ...(m.role === 'assistant' ? { mode: m.detail && m.detail.mode === 'live' ? 'live' : 'offline', provider: null, model: null, ungrounded: [], stopped: false, rating: m.vote || null } : {}),
  }));
  await Store.update((s) => {
    s.chats = Array.isArray(s.chats) ? s.chats : [];
    if (messages.length) {
      const first = messages.find((m) => m.role === 'user');
      s.chats.push({ id: newId(), title: titleOf(first ? first.text : 'Earlier chat'), createdAt: messages[0].t, updatedAt: messages[messages.length - 1].t, messages });
    }
    s.chat = [];
  });
}
const saved = () => (Array.isArray(S().chats) ? S().chats : []).slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
async function persist(conv) {
  conv.updatedAt = iso();
  const copy = JSON.parse(JSON.stringify(conv));
  await Store.update((s) => {
    s.chats = Array.isArray(s.chats) ? s.chats : [];
    const i = s.chats.findIndex((c) => c.id === conv.id);
    if (i >= 0) s.chats[i] = copy; else s.chats.push(copy);
  });
}
const setUrl = (id) => history.replaceState(null, '', id ? `${location.pathname}?c=${encodeURIComponent(id)}` : location.pathname);

/* ---------- words built from the user's real situation ---------- */
const H = facts.headline || null;
function starters() {
  if (!H) return ['How does the two-week check work?', 'What is the fair line?', 'What does response time mean?', 'How do I check if it is my Wi-Fi?'];
  if (H.status === 'below') return ['Why is my internet slow at night?', `Is ${H.pct}% bad enough to complain about?`, 'What should I say to my provider?', 'Would a different plan fix this?', 'What is the fair line?', 'How do I check if it is my Wi-Fi?'];
  return ['Am I getting what I pay for?', 'Which day was my worst?', 'Is my upload speed good enough for video calls?', 'Could a cheaper plan work for me?', 'What is the fair line?', 'How do I check if it is my Wi-Fi?'];
}
const TOPICS = [
  [/complain|bad enough|worth/, () => ['What should I say to my provider?', 'How much am I overpaying?', 'What if they do not fix it?']],
  [/\bsay\b|tell|message|email|letter|draft/, () => ['Can you make that shorter?', 'What if they say it is my Wi-Fi?', 'Would a different plan fix this?']],
  [/night|evening|slow|why/, () => [H && `Is ${H.pct}% bad enough to complain about?`, 'How do I check if it is my Wi-Fi?', 'What should I say to my provider?']],
  [/wi-?fi|router|modem/, () => ['Where should I put my router?', 'Why is my internet slow at night?', 'What should I say to my provider?']],
  [/plan|switch|cheaper|deal/, () => ['How much am I overpaying?', 'What should I check before I switch?', 'Why is my internet slow at night?']],
  [/overpay|money|cost|bill|credit|refund|much/, () => ['Can I ask for a credit?', 'What should I say to my provider?', 'Would a different plan fix this?']],
  [/fair line|80/, () => ['Am I above or below the fair line?', 'Which day was my worst?', 'How many days were below it?']],
  [/response time|ping|upload/, () => ['Is my upload speed good enough for video calls?', 'Am I getting what I pay for?', 'What is the fair line?']],
];
/** Two or three next questions: the writer's own when it gave some, otherwise chosen by topic and by the facts. */
function followupsFor(conv) {
  const ms = conv.messages, last = ms[ms.length - 1];
  if (!last || last.role !== 'assistant') return [];
  const asked = new Set(ms.filter((m) => m.role === 'user').map((m) => m.text.trim().toLowerCase()));
  let list = Array.isArray(last.followups) && last.followups.length ? last.followups.slice() : null;
  if (!list) {
    const lastUser = ms.slice().reverse().find((m) => m.role === 'user');
    const q = lastUser ? lastUser.text.toLowerCase() : '';
    const hit = TOPICS.find(([re]) => re.test(q));
    list = [...(hit ? hit[1]() : []), ...starters()];
  } else list = [...list, ...starters()];
  const out = [];
  list.forEach((x) => { if (x && !asked.has(x.toLowerCase()) && !out.includes(x)) out.push(x); });
  return out.slice(0, 3);
}
// Who wrote the words, by provider: 'claude', 'groq', 'local', none (the built-in writer), or any other service.
const SENT = 'Your first name, your question, and your numbers were sent to that service.';
function writer(m) {
  const model = m.model || status.model || 'model not named';
  if (m.mode !== 'live' || !m.provider) return 'Built-in writer, offline mode.';
  if (m.provider === 'local') return `Written by a language model on this computer (${model}). Nothing left this device.`;
  if (m.provider === 'groq') return `Written by AI on Groq (${model}). ${SENT}`;
  if (m.provider === 'claude') return `Written by Claude. ${SENT}`;
  return `Written by AI (${model}).`;
}
function relDate(t) {
  const d = new Date(t), mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (!Number.isFinite(mins)) return '';
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 24 * 60) return `${Math.floor(mins / 60)} hr ago`;
  if (mins < 48 * 60) return 'Yesterday';
  return fmtDate(d);
}

/* ---------- what Proof AI can see ---------- */
function scopeHTML() {
  const st = S(), on = aiOn(), r = facts.router || { pairs: 0 };
  const row = (icon, t, s) => `<div class="lrow"><div class="itile">${icon}</div><div><div class="t">${esc(t)}</div><div class="s">${esc(s)}</div></div></div>`;
  const goes = 'Your first name, your questions, and the numbers above go to that service.';
  const name = status.model || 'model not named';
  const model = !status.live || !status.provider ? 'Offline mode: answers come from the built-in writer.'
    : status.provider === 'local' ? `Running on this computer: ${name}. Your questions stay on this device.`
    : status.provider === 'groq' ? `Running on Groq: ${name}. ${goes}`
    : status.provider === 'claude' ? `Running on Claude. ${goes}`
    : `Running on an AI service: ${name}. ${goes}`;
  return `<div class="scopehead"><div class="col gap4"><div class="h3">What Proof AI can see</div><div class="small">Only this data is used to answer you.</div></div><button type="button" class="hidepanel" data-hidepanel aria-label="Hide this panel">Hide</button></div>
    <div data-scope-rows>
      ${row(IC.bars, `${plural(facts.testsCount, 'speed test')}, ${plural(facts.daysDone || 0, 'day')}`, 'Download, upload, response time')}
      ${row(IC.tag, 'Your plan label', `${facts.plan.name}: ${facts.plan.down} Mbps, $${facts.plan.price} a month`)}
      ${row(IC.wifi, `${r.pairs || 0} near and far router check${r.pairs === 1 ? '' : 's'}`, r.pairs ? `${r.near} Mbps near, ${r.far} Mbps far` : 'None yet. Run one from the Diagnosis page.')}
      ${row(IC.money, st.bill ? 'Your bill details' : 'No bill stored', st.bill ? 'Price, fees, promo end date. No photo is kept.' : 'Add one on the Plans page if you want it used.')}
    </div>
    <div class="cant">${IC.lock}<span>It cannot see the sites you visit.</span></div>
    <div class="modelline" data-model><span class="avatar">${IC.spark}</span><span>${esc(model)}</span></div>
    <div class="divider"></div>
    <div class="consent">
      <div><div style="font:600 14px/1.3 var(--body)">Let Proof AI use my data</div><div class="small" data-ai-word style="color:${on ? 'var(--good)' : 'var(--ink-3)'};font-weight:700;margin-top:3px">${on ? 'On' : 'Off'}</div></div>
      ${switchHTML('aiAnalyze', on, 'Let Proof AI use my data')}
    </div>
    <div class="small">${on ? 'Turn this off any time, here or in <a href="privacy.html" style="color:var(--cobalt);font-weight:600">Privacy &amp; data</a>.' : 'Off. Proof AI reads nothing and your questions are not sent. Turn it on here to ask again.'}</div>`;
}

/* ---------- saved chats ---------- */
function listHTML() {
  const list = saved();
  if (!list.length) return '<div class="nochats">No saved chats yet. Your first question starts one.</div>';
  return list.map((c) => {
    const id = esc(c.id), title = esc(c.title || 'Untitled chat');
    if (c.id === confirmId) return `<div class="crow ask" data-id="${id}"><div class="q">Delete "${title}"?</div><div class="row"><button type="button" class="mini danger" data-del-yes="${id}">Delete</button><button type="button" class="mini" data-del-no>Keep</button></div></div>`;
    return `<div class="crow${c.id === cur.id ? ' on' : ''}" data-id="${id}"><button type="button" class="copen" data-open="${id}"${c.id === cur.id ? ' aria-current="true"' : ''}><span class="ct">${title}</span><span class="cd">${esc(relDate(c.updatedAt))}</span></button><button type="button" class="cdel" data-del="${id}" aria-label="Delete chat: ${title}">${IC.trash}</button></div>`;
  }).join('');
}
function paintList() { $$('[data-chatlist]').forEach((el) => { el.innerHTML = listHTML(); }); }

/* ---------- messages ---------- */
const whoHTML = `<div class="who"><span class="avatar" aria-hidden="true">${IC.spark}</span><span class="ai-tag">PROOF AI</span></div>`;
function aiHTML(m, i, isLast) {
  const act = (name, label, icon, on) => `<button class="act${on ? ' on' : ''}" type="button" data-act="${name}" aria-label="${label}" title="${label}"${name === 'up' || name === 'down' ? ` aria-pressed="${on ? 'true' : 'false'}"` : ''}>${icon}</button>`;
  const bad = Array.isArray(m.ungrounded) ? m.ungrounded.filter((x) => x != null && x !== '') : [];
  return `<article class="turn ai" data-i="${i}">${whoHTML}
    ${m.text ? `<div class="mbody">${AI.chatHtml(m.text)}</div>` : '<div class="mmeta">You stopped this answer before any text arrived.</div>'}
    ${m.stopped ? '<span class="stopmark"><i></i>Stopped</span>' : ''}
    ${m.cut ? '<div class="mmeta">The answer was cut off before it finished.</div>' : ''}
    ${bad.length ? `<div class="ground" role="note">${IC.warn}<span><b>Check this answer:</b> it mentions numbers that are not in your data (${esc(bad.slice(0, 6).join(', '))}).</span></div>` : ''}
    <div class="mfoot"><div class="mmeta">${esc(writer(m))} ${esc(fmtTime(m.t))}</div>
    <div class="acts">${act('copy', 'Copy answer', IC.copy)}${act('up', 'Good answer', IC.up, m.rating === 'up')}${act('down', 'Bad answer', IC.down, m.rating === 'down')}${isLast ? act('regen', 'Write this answer again', IC.regen) : ''}</div></div>
  </article>`;
}
const liveHTML = (text) => `<article class="turn ai streaming" id="live">${whoHTML}
  <div class="thinking" role="status"${text ? ' hidden' : ''}><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span><span>${H ? 'Reading your results...' : 'Thinking...'}</span></div>
  <div class="mbody"${text ? '' : ' hidden'}>${text ? AI.chatHtml(text) : ''}</div></article>`;

function emptyHTML() {
  const on = aiOn();
  const line = H
    ? `Proof AI reads your ${plural(facts.testsCount, 'test')} and your plan, explains what the numbers mean, and helps you decide what to do next.`
    : 'Proof AI has no results from you yet. It can still answer general questions about internet service. Run a test and it will answer from your own numbers.';
  return `<div class="hello" id="hello">
    <span class="avatar" aria-hidden="true">${IC.spark}</span>
    <h2>What do you want to know about your internet?</h2>
    <p>${esc(line)}</p>
    ${H ? '' : '<div class="row gap8" style="flex-wrap:wrap;justify-content:center;margin-top:4px"><button type="button" class="btn primary sm" data-href="test.html">Run a test</button><button type="button" class="btn ghost sm" data-demo>Load sample data</button></div>'}
    <div class="sgrid">${starters().map((q) => `<button type="button" class="sgcard" data-ask="${esc(q)}"${on ? '' : ' disabled'}>${esc(q)}</button>`).join('')}</div>
  </div>`;
}

function render() {
  const ms = cur.messages, streaming = busy && busy.conv === cur, on = aiOn();
  let html;
  if (!ms.length && !streaming) html = emptyHTML();
  else {
    const lastI = ms.length - 1;
    html = ms.map((m, i) => (m.role === 'user' ? `<div class="turn me" data-i="${i}"><div class="bubble me">${esc(m.text)}</div></div>` : aiHTML(m, i, i === lastI && !streaming))).join('');
    if (streaming) html += liveHTML(busy.text);
    else if (ms[lastI].role === 'user') {
      html += `<div class="errbox" id="retry" role="alert"><span>${failed === cur.id ? 'Proof AI could not answer just now.' : 'This question does not have an answer yet.'}</span><button type="button" class="btn sm" data-retry${on ? '' : ' disabled'}>Try again</button></div>`;
    } else {
      const ups = followupsFor(cur);
      if (ups.length) html += `<div class="follow" id="follow" aria-label="Suggested next questions">${ups.map((u) => `<button type="button" class="chip" data-ask="${esc(u)}"${on ? '' : ' disabled'}>${esc(u)}</button>`).join('')}</div>`;
    }
  }
  thread.innerHTML = html;
  $('#ctitle').textContent = cur.title || 'New chat';
  document.title = `Wi-Fight · ${cur.title || 'Ask Proof AI'}`;
  paintList(); paintComposer(); paintScope();
  if (stick) toBottom();
  paintJump();
}

function paintScope() {
  const on = aiOn();
  $('#scope').innerHTML = scopeHTML();
  const open = $('.sheet [data-scope]'); if (open) open.innerHTML = scopeHTML();
  $('#scopechip-text').innerHTML = on ? `Using: ${plural(facts.testsCount, 'test')}, your plan · <b>Change</b>` : 'Proof AI is off · <b>Change</b>';
}

/* ---------- composer ---------- */
function grow() {
  input.style.height = 'auto';
  const max = 22 * 6 + 18;
  input.style.height = Math.min(input.scrollHeight, max) + 'px';
  input.style.overflowY = input.scrollHeight > max ? 'auto' : 'hidden';
}
function paintComposer() {
  const on = aiOn(), streaming = !!busy;
  input.disabled = !on;
  input.placeholder = on ? 'Ask about your internet' : 'Proof AI is off';
  form.classList.toggle('off', !on);
  $('#offnote').hidden = on;
  sendBtn.classList.toggle('stop', streaming);
  sendBtn.innerHTML = streaming ? IC.stop : IC.send;
  sendBtn.setAttribute('aria-label', streaming ? 'Stop' : 'Send question');
  sendBtn.title = streaming ? 'Stop' : 'Send';
  sendBtn.disabled = streaming ? false : (!on || !input.value.trim());
}
input.addEventListener('input', () => { grow(); paintComposer(); });
input.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
  e.preventDefault();
  if (!busy) send(input.value);
});
form.addEventListener('submit', (e) => e.preventDefault());
sendBtn.addEventListener('click', () => { if (busy) stop(); else send(input.value); });

/* ---------- scrolling ---------- */
const nearBottom = () => msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 48;
function toBottom() { msgs.scrollTop = msgs.scrollHeight; }
function paintJump() { jump.hidden = stick || msgs.scrollHeight <= msgs.clientHeight + 4; }
msgs.addEventListener('scroll', () => { stick = nearBottom(); paintJump(); });
jump.addEventListener('click', () => { stick = true; msgs.scrollTo({ top: msgs.scrollHeight, behavior: 'smooth' }); paintJump(); });

/* ---------- asking ---------- */
function stop() { if (busy) busy.ctrl.abort(); }

/** Send a question in the current conversation. again: answer the last question once more (regenerate or retry). */
async function send(text, { again = false } = {}) {
  if (busy) return;
  if (!aiOn()) { toast('Proof AI is off. Turn it on to ask.'); return; } // enforced here, not only by the disabled box
  const conv = cur;
  if (again) {
    const last = conv.messages[conv.messages.length - 1];
    if (last && last.role === 'assistant') conv.messages.pop();
    if (!conv.messages.length) return;
  } else {
    text = String(text || '').trim().slice(0, 2000);
    if (!text) return;
    conv.messages.push({ role: 'user', text, t: iso() });
    if (!conv.title) conv.title = titleOf(text);
    input.value = ''; grow();
  }
  failed = null;
  const job = busy = { conv, ctrl: new AbortController(), text: '', timedOut: false };
  stick = true;
  setUrl(conv.id);
  render();
  let done;
  pending = new Promise((res) => { done = res; });
  await persist(conv);
  paintList();

  // The model gets the whole conversation, so "what would I say?" can refer back to earlier turns.
  const messages = conv.messages.filter((m) => m.text && m.text.trim()).map((m) => ({ role: m.role, content: m.text }));
  let watchdog, painter = 0;
  const arm = () => { clearTimeout(watchdog); watchdog = setTimeout(() => { job.timedOut = true; job.ctrl.abort(); }, WAIT_MS); };
  const paint = () => {
    painter = 0;
    const el = $('#live'); if (!el || cur !== conv) return;
    $('.thinking', el).hidden = true;
    const body = $('.mbody', el); body.hidden = false; body.innerHTML = AI.chatHtml(job.text);
    if (stick) toBottom();
    paintJump();
  };
  arm();
  let result = null, error = null;
  try {
    result = await AI.chatStream(messages, facts, S(), catalog, {
      signal: job.ctrl.signal, partial: () => job.text,
      onDelta: (soFar) => { job.text = soFar; arm(); if (!painter) painter = setTimeout(paint, 40); },
    });
  } catch (e) { error = e || new Error('failed'); }
  clearTimeout(watchdog); clearTimeout(painter);

  const out = result ? (result.text || job.text || '') : '';
  if (!error && !out.trim() && (job.timedOut || !result.stopped)) error = new Error('empty');
  if (error) failed = conv.id;
  else {
    conv.messages.push({
      role: 'assistant', text: out, t: iso(), mode: result.mode === 'live' ? 'live' : 'offline', provider: result.provider || null, model: result.model || null,
      ungrounded: Array.isArray(result.ungrounded) ? result.ungrounded.map(String) : [], stopped: !!result.stopped, rating: null,
      ...(Array.isArray(result.followups) && result.followups.length ? { followups: result.followups.map(String).slice(0, 3) } : {}),
      ...(result.warning ? { cut: true } : {}),
    });
    await persist(conv);
  }
  busy = null; pending = null;
  if (cur === conv) { render(); if (window.matchMedia('(min-width:721px)').matches && aiOn()) input.focus({ preventScroll: true }); }
  else { paintList(); paintComposer(); }
  done();
}

/** Stop a running reply and wait until its partial text is saved. */
async function settle() { if (busy) { stop(); if (pending) await pending; } }

async function newChat() {
  await settle();
  cur = fresh(); failed = null; confirmId = null; stick = true;
  setUrl(null); closeSheet(); render();
  if (window.matchMedia('(min-width:721px)').matches && aiOn()) input.focus({ preventScroll: true });
}
async function openChat(id) {
  if (id === cur.id) { closeSheet(); return; }
  await settle();
  const c = saved().find((x) => x.id === id); if (!c) return;
  cur = JSON.parse(JSON.stringify(c)); failed = null; confirmId = null; stick = true;
  setUrl(cur.id); closeSheet(); render();
}
async function deleteChat(id) {
  if (busy && busy.conv.id === id) await settle();
  await Store.update((s) => { s.chats = (s.chats || []).filter((c) => c.id !== id); });
  confirmId = null;
  if (cur.id === id) { cur = fresh(); failed = null; stick = true; setUrl(null); render(); }
  else paintList();
  toast('Chat deleted');
}
async function setAi(next) {
  if (!next) await settle();
  await Store.update((s) => { s.settings = { ...(s.settings || {}), aiAnalyze: next }; });
  render();
  toast(next ? 'Proof AI can use your data again' : 'Proof AI is off. Nothing is sent.');
}

/* ---------- clicks ---------- */
document.addEventListener('click', async (e) => {
  const t = e.target;
  const sw = t.closest('[data-switch="aiAnalyze"], [data-ai-on]');
  if (sw) { await setAi(sw.hasAttribute('data-ai-on') ? true : !aiOn()); return; }
  const a = t.closest('[data-ask]');
  if (a) { if (!a.disabled) send(a.dataset.ask); return; }
  if (t.closest('[data-retry]')) { send('', { again: true }); return; }
  if (t.closest('[data-newchat]')) { newChat(); return; }
  const op = t.closest('[data-open]'); if (op) { openChat(op.dataset.open); return; }
  const del = t.closest('[data-del]'); if (del) { confirmId = del.dataset.del; paintList(); const y = $('[data-del-yes]', del.closest('[data-chatlist]') || document); if (y) y.focus(); return; }
  if (t.closest('[data-del-no]')) { confirmId = null; paintList(); return; }
  const yes = t.closest('[data-del-yes]'); if (yes) { deleteChat(yes.dataset.delYes); return; }
  if (t.closest('[data-hidepanel]')) { main.classList.add('nopanel'); return; }
});
$('#showpanel').onclick = () => main.classList.remove('nopanel');
$('#scopechip').onclick = () => {
  openSheet(`<div class="scope-sheet col gap16" data-scope>${scopeHTML()}</div><div class="row gap8" style="margin-top:16px"><button type="button" class="btn sm grow" data-close>Done</button></div>`);
};
$('#openlist').onclick = () => {
  confirmId = null;
  openSheet(`<div class="row between gap8"><div class="h3">Your chats</div><button type="button" class="btn primary sm" data-newchat>${IC.plus}New chat</button></div><div class="chatlist" data-chatlist>${listHTML()}</div><button type="button" class="btn ghost sm" data-close style="width:100%;margin-top:14px">Close</button>`);
};

thread.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const card = b.closest('article'), i = Number(card.dataset.i), m = cur.messages[i]; if (!m) return;
  const kind = b.dataset.act;
  if (kind === 'copy') toast((await copyText(m.text.replace(/\*\*(.+?)\*\*/g, '$1'))) ? 'Answer copied' : 'Could not copy');
  else if (kind === 'up' || kind === 'down') {
    m.rating = m.rating === kind ? null : kind;
    $$('[data-act="up"], [data-act="down"]', card).forEach((x) => { const on = x.dataset.act === m.rating; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    await persist(cur); paintList();
    if (m.rating) toast('Thanks for the feedback');
  } else if (kind === 'regen') send('', { again: true });
});

/* ---------- start ---------- */
$('#eyebrow').textContent = H ? `Ask Proof AI · Day ${facts.dayNumber} of ${facts.totalDays}` : 'Ask Proof AI · No tests yet';
await migrate();
const params = new URLSearchParams(location.search);
const q0 = params.get('q'), c0 = params.get('c');
const found = !q0 && c0 ? saved().find((c) => c.id === c0) : null;
if (found) cur = JSON.parse(JSON.stringify(found)); else setUrl(null); // also removes ?q so a reload does not ask twice
grow(); render();
window.addEventListener('resize', () => { if (stick) toBottom(); paintJump(); });
if (q0 && aiOn()) send(q0);
document.documentElement.dataset.chat = '1';
