// Proof AI client. Two layers:
//  1. The numbers always come from the local engine (real statistics, computed on this device).
//  2. The words come from Claude through the local server when a key is set ("live"),
//     and from the built-in writer below when it is not ("offline"). The interface always says which.
// Text may contain **bold** markers. Use AI.html() to turn it into safe HTML.
import { recommend, fmtTime } from './engine.js';
import { Store } from './store.js';

let statusCache = null;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const noDash = (s) => String(s).replace(new RegExp('\\s*[' + String.fromCharCode(8212, 8211) + ']\\s*', 'g'), ', ');

// Send only what the model needs. No email, no raw test list, no device identifiers.
function slim(f, state) {
  if (!f || !f.headline) return { ready: false };
  return {
    userFirstName: state && state.user ? state.user.name : null,
    plan: f.plan && { name: f.plan.name, typicalDownloadMbps: f.plan.down, pricePerMonth: f.plan.price },
    fairLineMbps: f.fairLine, dayNumber: f.dayNumber, totalDays: f.totalDays, checkComplete: f.complete, testsCount: f.testsCount,
    headline: { medianMbps: f.headline.mbps, percentOfPlan: f.headline.pct, status: f.headline.statusWord, basedOn: f.headline.basis },
    daysBelowFairLine: f.daysBelow, daysMeasured: f.daysDone, longestRunBelowFairLine: f.streak.len,
    oneOffDipsIgnored: f.ignored.map((x) => ({ when: x.when, mbps: x.down })),
    eveningAverageMbps: f.evening.avg, daytimeAverageMbps: f.daytime.avg,
    upload: f.upload && { medianMbps: f.upload.mbps, status: f.upload.statusWord, planMbps: f.plan.up },
    responseTime: f.latency && { medianMs: f.latency.ms, status: f.latency.statusWord },
    bestDay: f.best && { day: f.best.day, mbps: f.best.median }, worstDay: f.worst && { day: f.worst.day, mbps: f.worst.median },
    nextTest: f.nextTest && f.nextTest.label,
    routerCheck: f.router.pairs ? { nearRouterMbps: f.router.near, farRoomMbps: f.router.far } : null,
    diagnosis: { likelyCause: f.diagnosis.title, confidencePercent: f.diagnosis.confidence, confidenceLevel: f.diagnosis.level },
    money: f.money && { paidForNotReceivedPerMonth: f.money.lostMonth, percentOfBill: f.money.pctLost },
    bill: state && state.bill ? state.bill : null,
    sampleData: !!f.sample,
  };
}

async function live(task, payload) {
  // The user's choice is enforced here: with Proof AI switched off, nothing is sent to the AI service.
  const set = (Store.get() && Store.get().settings) || {};
  if (task === 'bill' ? set.aiBill === false : set.aiAnalyze === false) return null;
  const s = await AI.status();
  if (!s.live) return null;
  // Some backends leave the short cards to the built-in writer (see server.js). Do not ask them.
  if (s.writerFor && s.writerFor.includes(task)) return null;
  try {
    const r = await fetch('api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task, ...payload }) });
    if (!r.ok) return null;
    const j = await r.json();
    return j.result ? { ...j.result, mode: 'live', model: j.model } : null;
  } catch { return null; }
}

const chips = (f) => [`${f.testsCount} tests`, `${f.daysDone} day${f.daysDone === 1 ? '' : 's'}`, `Confidence: ${f.diagnosis.level}${f.diagnosis.confidence ? ' ' + f.diagnosis.confidence + '%' : ''}`, 'Method: median + outlier check'];

function reasons(f) {
  const out = [];
  const dips = f.ignored.length;
  if (f.headline.status === 'below') {
    out.push({ title: 'It is a real shortfall, not a blip.', detail: `${dips} one-off dip${dips === 1 ? ' was' : 's were'} ignored. ${f.daysBelow} full day${f.daysBelow === 1 ? '' : 's'} still had a median under ${f.fairLine} Mbps.` });
  } else out.push({ title: 'Your speed holds up.', detail: `Your median is ${f.headline.mbps} Mbps, which is ${f.headline.pct}% of your plan. ${dips} one-off dip${dips === 1 ? ' was' : 's were'} ignored.` });
  if (f.router.pairs && f.diagnosis.cause === 'provider') out.push({ title: 'It is not your Wi-Fi.', detail: `Next to the router you got ${f.router.near} Mbps. In the far room, ${f.router.far} Mbps. That gap is small.` });
  else if (f.router.pairs && f.diagnosis.cause === 'wifi') out.push({ title: 'It looks like your Wi-Fi.', detail: `Next to the router you got ${f.router.near} Mbps, but only ${f.router.far} Mbps in the far room.` });
  if (f.evening.avg != null && f.daytime.avg != null && f.evening.avg < f.daytime.avg * 0.92) out.push({ title: 'It follows the clock.', detail: `Evening tests, 7 to 11 PM, averaged ${f.evening.avg} Mbps. Daytime tests averaged ${f.daytime.avg} Mbps.` });
  if (!f.router.pairs && f.headline.status === 'below') out.push({ title: 'One check is still missing.', detail: 'Run a test next to your router and one in a far room so Proof AI can tell Wi-Fi from your provider.' });
  return out.slice(0, 3);
}

export const AI = {
  esc,
  /** Safe HTML from model or writer text: escapes everything, then turns **x** into <b>x</b>. */
  html: (t) => esc(noDash(t || '')).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'),
  async status() { if (statusCache) return statusCache; try { statusCache = await (await fetch('api/status')).json(); } catch { statusCache = { live: false }; } return statusCache; },
  async modeLabel() { const s = await this.status(); return s.provider === 'local' ? 'Proof AI: live (on this computer)' : s.live ? `Proof AI: live (${s.label})` : 'Proof AI: offline mode'; },
  /** One honest line about who wrote the words. */
  note: (mode) => {
    const p = statusCache && statusCache.provider;
    if (mode !== 'live') return p ? 'Numbers computed on this device. Wording by the built-in writer, which cannot invent a number. Ask Proof AI for a fuller explanation.' : 'Numbers computed on this device. Wording by the built-in writer (offline mode). Check the evidence.';
    if (p === 'local') return `Written by a language model running on this computer (${statusCache.model}). Nothing left this device. It can make mistakes, so check the evidence.`;
    return `Written by AI (${(statusCache && statusCache.label) || 'Claude'}) from your own test results. It can make mistakes, so check the evidence.`;
  },
  /** Drop the cached status, for example after the user starts a local model. */
  resetStatus() { statusCache = null; },
  slim,

  /**
   * Chat, ChatGPT style: a multi-turn conversation that streams.
   * messages: [{ role: 'user' | 'assistant', content: string }] ending with a user message.
   * opts.onDelta(textSoFar, delta) is called as text arrives. opts.signal (AbortSignal) stops it.
   * Returns { text, mode: 'live' | 'offline', provider, model, ungrounded: string[], stopped: boolean }.
   * With a language model (Claude, or a model on this computer) the reply is generated by that model.
   * With none, the built-in writer answers from the same facts and the reply is marked offline.
   */
  async chatStream(messages, f, state, catalog, opts = {}) {
    const set = (state && state.settings) || {};
    if (set.aiAnalyze === false) throw new Error('Proof AI is switched off.');
    const onDelta = opts.onDelta || (() => {});
    const st = await this.status();
    if (st.live) {
      try {
        const r = await fetch('api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: opts.signal, body: JSON.stringify({ messages, facts: slim(f, state) }) });
        if (r.ok && r.body) {
          const reader = r.body.getReader(); const dec = new TextDecoder();
          let buf = '', text = '', meta = null, err = null;
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            let i;
            while ((i = buf.indexOf('\n\n')) >= 0) {
              const line = buf.slice(0, i).trim(); buf = buf.slice(i + 2);
              if (!line.startsWith('data:')) continue;
              let j; try { j = JSON.parse(line.slice(5)); } catch { continue; }
              if (j.delta) { text += j.delta; onDelta(text, j.delta); }
              else if (j.done) meta = j;
              else if (j.error) err = j.error;
            }
          }
          if (meta && meta.text) { text = meta.text; onDelta(text, ''); } // the server's tidied final text
          if (text && !err) return { text, mode: 'live', provider: (meta && meta.provider) || st.provider, model: (meta && meta.model) || st.model, ungrounded: (meta && meta.ungrounded) || [], stopped: false };
          if (err && !text) throw new Error(err);
          if (text) return { text, mode: 'live', provider: st.provider, model: st.model, ungrounded: [], stopped: false, warning: err };
        }
      } catch (e) {
        if (e && e.name === 'AbortError') return { text: opts.partial ? opts.partial() : '', mode: 'live', provider: st.provider, model: st.model, ungrounded: [], stopped: true };
        // fall through to the built-in writer
      }
    }
    // Offline: the built-in writer answers the latest question from the same facts, typed out word by word.
    const q = messages[messages.length - 1].content;
    const a = await this.answer(q, f, { ...state, settings: { ...set, aiAnalyze: false } }, catalog);
    const full = [a.headline, ...a.paragraphs.map((p) => p.text)].join('\n\n');
    let text = '';
    for (const w of full.split(/(\s+)/)) {
      if (opts.signal && opts.signal.aborted) return { text, mode: 'offline', provider: null, model: null, ungrounded: [], stopped: true, followups: a.followups };
      text += w; onDelta(text, w);
      if (w.trim()) await new Promise((res) => setTimeout(res, 14));
    }
    return { text, mode: 'offline', provider: null, model: null, ungrounded: [], stopped: false, followups: a.followups };
  },

  /** Chat formatting to safe HTML: escapes everything, then supports **bold**, "- " lists, and paragraphs. */
  chatHtml(t) {
    const blocks = String(noDash(t || '')).split(/\n{2,}/);
    return blocks.map((b) => {
      const lines = b.split('\n');
      const fmt = (x) => esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
      if (lines.every((l) => /^\s*[-*]\s+/.test(l))) return '<ul>' + lines.map((l) => '<li>' + fmt(l.replace(/^\s*[-*]\s+/, '')) + '</li>').join('') + '</ul>';
      return '<p>' + lines.map(fmt).join('<br>') + '</p>';
    }).join('');
  },
  chips, reasons,

  async insight(f, state) {
    if (!f.headline) return { sentence: 'Run your first test and Proof AI will start reading your results.', reasons: [], chips: [], mode: 'offline' };
    const l = await live('insight', { facts: slim(f, state) });
    if (l) return { ...l, chips: chips(f) };
    let s;
    if (f.headline.status === 'on' && !f.streak.flagged) s = `Your internet is **at or above the fair line**. You are getting about ${f.headline.pct}% of the speed you pay for.`;
    else if (f.streak.flagged) s = `Your internet has been **below the fair line for ${f.streak.len} days in a row**. ${f.diagnosis.cause === 'provider' ? 'The pattern points to **your provider, not your Wi-Fi**.' : f.diagnosis.cause === 'wifi' ? 'The pattern points to **your home Wi-Fi**.' : 'Proof AI needs a router check to find the cause.'}`;
    else s = `You are getting **${f.headline.pct}% of your plan speed**, which is under the fair line. It has not lasted ${3} days in a row yet, so Proof AI is still watching.`;
    return { sentence: s, reasons: reasons(f), chips: chips(f), mode: 'offline' };
  },

  async verdict(f, state) {
    if (!f.headline) return { sentence: '', reasons: [], chips: [], mode: 'offline' };
    const l = await live('verdict', { facts: slim(f, state) });
    if (l) return { ...l, chips: chips(f) };
    const frac = f.headline.pct >= 95 ? 'all' : f.headline.pct >= 85 ? 'most' : f.headline.pct >= 77 ? 'about four-fifths' : f.headline.pct >= 70 ? 'about three-quarters' : f.headline.pct >= 60 ? 'about two-thirds' : 'about half';
    let s = `For two weeks your internet ran at **${frac} of what your plan promises**. `;
    s += f.headline.status === 'below' ? `It was not a one-off: **${f.daysBelow} of ${f.daysDone} days** fell below the fair line${f.evening.avg < f.daytime.avg * 0.92 ? ', mostly in the evening' : ''}. ` : `Only ${f.daysBelow} of ${f.daysDone} days fell below the fair line. `;
    if (f.diagnosis.cause === 'provider') s += 'The tests near your router were low too, so the cause is most likely **your provider**.';
    else if (f.diagnosis.cause === 'wifi') s += 'Speed dropped sharply away from your router, so the cause is most likely **your home Wi-Fi**.';
    else if (f.diagnosis.cause === 'none') s += 'No lasting problem was found.';
    return { sentence: s, reasons: reasons(f), chips: chips(f), mode: 'offline' };
  },

  /** A quick local read of one finished test. Always computed on this device. */
  liveRead(test, f) {
    if (!f || !f.plan) return { text: 'Add your plan and Proof AI will compare this result to it.', chips: [] };
    const pct = Math.round((test.down / f.plan.down) * 100);
    const typical = f.headline ? f.headline.mbps : null;
    const hour = new Date(test.t || Date.now()).getHours();
    const evening = hour >= 19 && hour < 23;
    let text;
    if (typical && test.down < typical * 0.6) text = `This result is **far below your usual ${typical} Mbps**. If the next tests are normal, Proof AI will treat it as a one-off dip and ignore it.`;
    else if (test.down < f.fairLine) text = evening && f.evening.n >= 3 && f.evening.avg < f.fairLine ? `This result **fits your evening pattern**. It is not a one-off dip, so it **will count** toward today's median.` : `This result is **below your fair line** of ${f.fairLine} Mbps. It will count toward today's median.`;
    else text = `This result is **${pct}% of your plan**, at or above the fair line.`;
    return { text, chips: [fmtTime(test.t || Date.now()), `${pct}% of plan`] };
  },

  /** Chat. Live: Claude answers from the facts. Offline: a rule-based answer from the same facts. */
  async answer(question, f, state, catalog) {
    const steps = [`Looked at ${f.testsCount} tests`, 'Compared evening and daytime', f.router && f.router.pairs ? 'Checked router tests' : 'Checked your plan'];
    if (!f.headline) return { headline: 'I do not have any test results yet. Run a test and ask me again.', paragraphs: [], followups: ['How does the two-week check work?'], steps: ['Looked for tests'], mode: 'offline' };
    const l = await live('chat', { question, facts: slim(f, state), history: (state.chat || []).map((m) => ({ role: m.role, text: m.text })) });
    if (l) return { ...l, steps };
    const q = question.toLowerCase();
    const P = (text, source) => ({ text, source });
    let headline, paragraphs = [], followups = ['Is ' + f.headline.pct + '% bad enough to complain about?', 'What should I say to my provider?', 'Would a different plan fix this?'];
    const eveP = P(`**Evenings are slower.** Your tests between 7 and 11 PM average **${f.evening.avg} Mbps**. Your daytime tests average **${f.daytime.avg} Mbps**.`, 'evening tests');
    const routerP = f.router.pairs ? P(`**It is slow next to the router too.** The test beside your router got ${f.router.near} Mbps and the far room got ${f.router.far} Mbps. That gap is small, so the walls and distance in your home are not the cause.`, 'router check') : P('**I have no router check yet.** Run one test next to your router and one in a far room, and I can tell Wi-Fi from your provider.', 'none');
    const planP = P(`**It is under what you pay for.** Your plan lists ${f.plan.down} Mbps for $${f.plan.price} a month, so the fair line is ${f.fairLine} Mbps. Your median is ${f.headline.mbps} Mbps.`, 'plan label');
    if (/night|evening|slow|why/.test(q) && !/complain|say|plan fix|different plan/.test(q)) {
      headline = f.diagnosis.cause === 'provider' ? "It looks like your provider's network gets busy at night. It does not look like your Wi-Fi." : f.diagnosis.cause === 'wifi' ? 'It looks like your home Wi-Fi, not your provider.' : `Your speed is ${f.headline.pct}% of your plan. I need a router check to say why.`;
      paragraphs = [eveP, routerP, planP];
    } else if (/complain|bad enough|worth/.test(q)) {
      headline = f.headline.status === 'below' ? `Yes. ${f.headline.pct}% is under the 80% fair line, and it lasted ${f.streak.len} days in a row.` : `Not yet. ${f.headline.pct}% is at or above the 80% fair line.`;
      paragraphs = [P(`**The fair line is 80% of your plan.** That is ${f.fairLine} Mbps on a ${f.plan.down} Mbps plan. ${f.daysBelow} of ${f.daysDone} days fell below it.`, 'speed tests'), P(`**One-off dips were not counted.** ${f.ignored.length} single low results were ignored, so this is not a fluke.`, 'speed tests')];
      followups = ['What should I say to my provider?', 'How much am I overpaying?', 'Why is it slow at night?'];
    } else if (/say|tell|provider|message|email/.test(q)) {
      headline = 'Keep it short and factual: your plan, what you measured, how long it lasted, and what you want.';
      paragraphs = [P(`**The numbers to give them.** Plan: ${f.plan.down} Mbps for $${f.plan.price}. Measured median: ${f.headline.mbps} Mbps, ${f.headline.pct}% of plan. ${f.daysBelow} of ${f.daysDone} days below ${f.fairLine} Mbps.`, 'speed tests'), P('**Let me draft it.** Open the Report page and I will write the message. You read it, edit it, and approve it before anything is sent.', 'none')];
      followups = ['Is this bad enough to complain about?', 'How much am I overpaying?', 'Would a different plan fix this?'];
    } else if (/plan|switch|cheaper|deal/.test(q)) {
      const r = catalog ? recommend(f, catalog, state.household) : null;
      headline = r && r.pick ? `Possibly. ${r.pick.name} fits your household and costs $${r.pick.price} a month, about $${r.savingsYear} a year less.` : 'I do not have plan data loaded to compare.';
      paragraphs = r && r.pick ? [P(`**Why that one.** It has room for ${r.people} people, and its upload speed handles video calls. The cheapest plan, ${r.cheapest.name}, is tighter on upload.`, 'plans near you'), P('**Check before you switch.** Plan details can change, so read the provider\'s label first. Plan values in this demo are sample values.', 'plans near you')] : [];
      followups = ['How much am I overpaying?', 'Why is it slow at night?', 'What should I say to my provider?'];
    } else if (/overpay|money|cost|bill|much/.test(q)) {
      headline = `About $${f.money.lostMonth} a month of your $${f.money.price} bill pays for speed you did not receive.`;
      paragraphs = [P(`**How I got that.** You get ${f.headline.pct}% of your plan speed, so ${f.money.pctLost}% of the bill bought speed that never arrived. That is an estimate, about $${f.money.lostYear} a year.`, 'speed tests')];
      if (state.bill && state.bill.fees && state.bill.fees.some((x) => x.junk)) paragraphs.push(P(`**There is also a fee to question.** Your bill has a "${state.bill.fees.find((x) => x.junk).name}" of $${state.bill.fees.find((x) => x.junk).amount} a month, which looks like a company fee, not a tax.`, 'your bill'));
    } else if (/worst|best|which day/.test(q)) {
      headline = `Your worst day was Day ${f.worst.day} at ${f.worst.median} Mbps. Your best was Day ${f.best.day} at ${f.best.median} Mbps.`;
      paragraphs = [P(`**The pattern.** ${f.daysBelow} of ${f.daysDone} days were under the ${f.fairLine} Mbps fair line.`, 'speed tests')];
    } else if (/pay for|getting what/.test(q)) {
      headline = f.headline.status === 'below' ? `Not fully. You are getting ${f.headline.pct}% of the speed you pay for.` : `Yes. You are getting ${f.headline.pct}% of the speed you pay for.`;
      paragraphs = [planP];
    } else {
      headline = `Here is what I can see: ${f.headline.mbps} Mbps, which is ${f.headline.pct}% of your ${f.plan.down} Mbps plan (${f.headline.statusWord.toLowerCase()}).`;
      paragraphs = [P('**I answer from your own results.** Ask me why it is slow, whether it is worth a complaint, what to tell your provider, or whether another plan would help.', 'none')];
    }
    return { headline, paragraphs, followups, steps, mode: 'offline' };
  },

  /** Report message draft. The user must approve before anything leaves the device. */
  async draft(f, state, tone = 'polite') {
    const l = await live('draft', { facts: slim(f, state), tone });
    if (l) return l;
    const name = (state.user && state.user.name) || 'A customer';
    const short = f.plan.name.replace(/^\S+\s/, '');
    const subject = `Speeds below my plan, ${short}`;
    const router = f.router.pairs && f.diagnosis.cause === 'provider' ? ' Tests next to my router were low as well, so my Wi-Fi does not appear to be the cause.' : '';
    const core = `I am on the ${short} plan, which lists a typical download speed of ${f.plan.down} Mbps for $${f.plan.price} a month. Over ${f.daysDone} days I ran ${f.testsCount} independent speed tests, and my median speed was ${f.headline.mbps} Mbps, which is ${f.headline.pct}% of the plan. On ${f.daysBelow} of the ${f.daysDone} days my speed was below ${f.fairLine} Mbps.${router}`;
    const provider = f.plan.provider || f.plan.name.split(' ')[0];
    let body;
    if (tone === 'short') body = `Hello ${provider} support,\n\nMy ${short} plan lists ${f.plan.down} Mbps. Over ${f.daysDone} days my median was ${f.headline.mbps} Mbps (${f.headline.pct}%). Please fix this or credit my bill. Report attached.\n\n${name}`;
    else if (tone === 'firm') body = `Hello ${provider} support,\n\n${core} I am paying for a service I am not receiving. Please restore the speed on my plan and apply a credit to my bill for the shortfall. If this is not resolved, I will file a complaint with the FCC.\n\nThe full report is attached.\n${name}`;
    else body = `Hello ${provider} support,\n\n${core} Could you please fix this, or apply a credit to my bill for the speed I did not receive?\n\nThe full report is attached. Thank you,\n${name}`;
    return { subject, body, mode: 'offline' };
  },

  /** Bill photo. Live: Claude reads the image. Offline: returns the labelled sample extraction, because reading a photo needs the AI service. */
  /**
   * @param {string} dataUrl  the photo
   * @param {object} [known]  for a bundled sample bill: its known values from samples/manifest.json.
   *                          Used only when no language model is available, and labelled as such.
   */
  async readBill(dataUrl, known) {
    const l = await live('bill', { image: dataUrl });
    // the model says when the photo is not a bill; an empty reading counts as that too
    if (l && (l.isBill === false || (l.planPrice == null && l.total == null && !(l.fees || []).length))) return { fields: { planPrice: null, equipment: null, fees: [], total: null, promoEnds: null, provider: null, plan: null }, confidence: 'low', mode: 'live', notBill: true };
    if (l) return { fields: { planPrice: l.planPrice, equipment: l.equipment, fees: l.fees, total: l.total, promoEnds: l.promoEnds, provider: l.provider, plan: l.plan }, confidence: l.confidence, mode: 'live', model: l.model };
    if (known) return { fields: JSON.parse(JSON.stringify(known)), confidence: 'known', mode: 'offline', note: 'Offline mode: no AI model is connected, so these are the known values of this bundled sample bill, not an AI reading.' };
    return { fields: { planPrice: 65, equipment: 10, fees: [{ name: 'Network enhancement fee', amount: 5, junk: true, why: 'A company fee, not a government tax.' }], total: 80, promoEnds: 'Jan 2027' }, confidence: 'sample', mode: 'offline', note: 'Offline mode cannot read a real photo. These are sample values so you can see how the step works. Edit them to match your bill.' };
  },
};
