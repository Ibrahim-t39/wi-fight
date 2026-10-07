// Report: a document built from the facts, a SHA-256 fingerprint of its data, an AI draft,
// and an approve-before-send gate that is enforced in code (see canSend and send).
// There is no mail server. "Approve and send" opens the user's own email app.
import { boot, bind, $, $$, esc, toast, AI, Store, sha256 } from '../shell.js';
import { fmtDate, fmtTime, dayKey } from '../engine.js';
import { paintSwitch, copyText, pause, bringIntoView } from './ui-sheet.js';
import { modelChip } from '../models.js';

const { state, facts, ai: status } = await boot({ need: 'plan' });
const FCC_URL = 'https://consumercomplaints.fcc.gov/';
const MARK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 10.8 6.9 20.2 10.5 12.6 14.1 20.2 21.5 4.4"/><circle cx="10.5" cy="6.5" r="2.25" fill="currentColor" stroke="none"/></svg>';
const SEAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4.5 6v6c0 4.5 3.2 7.6 7.5 9 4.3-1.4 7.5-4.5 7.5-9V6z"/><path d="m9 12 2 2 4-4"/></svg>';
const CROSS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

/** JSON with keys sorted at every level, so the same data always gives the same text. */
export function canonical(v) {
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
  return JSON.stringify(v === undefined ? null : v);
}
/** The mailto link the send button opens. Nothing else in this page can send a message. */
export function buildMailto(email, subject, body) {
  const enc = (s) => encodeURIComponent(String(s || '').replace(/\r?\n/g, '\r\n'));
  return `mailto:${encodeURIComponent(String(email || '').trim()).replace(/%40/g, '@')}?subject=${enc(subject)}&body=${enc(body)}`;
}

const api = { canonical, buildMailto, openMail: (url) => { const a = document.createElement('a'); a.href = url; document.body.appendChild(a); a.click(); a.remove(); } };
window.WF_REPORT = api;

if (!facts.headline) {
  $('#empty').hidden = false; $('#grid').hidden = true; $('#status').hidden = true; $('.stickybar').hidden = true;
  bind({ eyebrow: 'Two-week check · no results yet' });
  document.documentElement.dataset.report = '1';
} else {
  const H = facts.headline, plan = facts.plan;
  const measured = facts.days.filter((d) => d.median != null);
  const last = measured[measured.length - 1];
  const year = new Date(last.date).getFullYear();
  const range = `${fmtDate(facts.startDate)} to ${fmtDate(last.date)}`;
  const regular = (state.tests || []).filter((t) => (t.location || 'normal') === 'normal').length;
  const routerTests = facts.testsCount - regular;
  const sources = [...new Set((state.tests || []).map((t) => t.source || 'mlab'))];

  /* ---------- the signed data ---------- */
  const data = {
    report: 'Wi-Fight speed report', version: 1, sampleData: !!facts.sample,
    preparedFor: state.user.name || '',
    plan: { name: plan.name, provider: plan.provider || '', downloadMbps: plan.down, uploadMbps: plan.up, pricePerMonth: plan.price },
    fairLineMbps: facts.fairLine,
    dates: { from: dayKey(facts.startDate), to: dayKey(last.date) },
    headline: { medianMbps: H.mbps, percentOfPlan: H.pct, status: H.statusWord, basis: H.basis },
    counts: { tests: facts.testsCount, daysMeasured: facts.daysDone, daysBelowFairLine: facts.daysBelow, oneOffDipsIgnored: facts.ignored.length, routerCheckPairs: facts.router.pairs },
    dailyMedians: measured.map((d) => ({ day: d.day, date: dayKey(d.date), medianMbps: d.median, tests: d.n })),
  };
  const json = canonical(data);
  const hash = await sha256(json);
  const short = `${hash.slice(0, 4)}…${hash.slice(-4)}`;
  const reportId = `WF-${hash.slice(0, 8).toUpperCase()}`;
  Object.assign(api, { json, hash, data });

  /* ---------- the document ---------- */
  const head = (n) => `<div class="sh-head"><div class="sh-brand"><span class="sh-mark">${MARK}</span>Wi-Fight</div><div class="sh-meta">Report ${reportId}<br>Page ${n} of 2</div></div>`;
  const page1 = () => `<div class="paper light" data-page="1">${head(1)}
    <div class="sh-title">Wi-Fight speed report${facts.complete ? '' : ' (draft)'}</div>
    <div class="sh-info">
      <div><span>Prepared for</span><b>${esc(state.user.name || 'Customer')}</b></div>
      <div><span>Plan</span><b>${esc(plan.name)}, $${plan.price} a month</b></div>
      <div><span>Dates</span><b>${range}, ${year}</b></div>
    </div>
    <div class="sh-sum">
      <div class="sh-sumhead"><span>Summary</span><em class="${H.status === 'below' ? '' : 'ok'}">${esc(H.statusWord)}</em></div>
      <div class="sh-stats">
        <div><b>${H.pct}%</b><span>of plan speed</span></div>
        <div><b>${H.mbps} <small>vs. ${plan.down} Mbps</small></b><span>measured vs. on the label</span></div>
        <div><b>${facts.daysBelow} <small>of ${facts.daysDone} day${facts.daysDone === 1 ? '' : 's'}</small></b><span>below the fair line</span></div>
      </div>
    </div>
    <div class="sh-cap">Measured speed is the median of ${esc(H.basis)}.${facts.complete ? '' : ` The check is not finished: ${facts.daysDone} of ${facts.totalDays} days measured.`}</div>
    <div class="sh-h">Daily median download speed</div>
    <div class="sh-chart"><div class="sh-line"><span>Fair line ${facts.fairLine} Mbps</span></div>${facts.days.map((d) => `<i class="${d.low ? 'low' : ''}" style="height:${d.median == null ? 0 : Math.min(100, (d.median / plan.down) * 100).toFixed(1)}%"></i>`).join('')}</div>
    <div class="sh-x">${facts.days.map((d) => `<span>${d.day}</span>`).join('')}</div>
    <div class="sh-cap">Each bar is one day. Dark bars fell below the fair line. The top of the chart is the ${plan.down} Mbps plan.${facts.daysDone < facts.totalDays ? ' Days without a bar are not measured yet.' : ''}</div>
    <div class="sh-h">How this was measured</div>
    <p class="sh-p">Wi-Fight recorded ${facts.testsCount} test${facts.testsCount === 1 ? '' : 's'} over ${facts.daysDone} day${facts.daysDone === 1 ? '' : 's'}: ${regular} regular test${regular === 1 ? '' : 's'}${routerTests ? ` and ${routerTests} router check test${routerTests === 1 ? '' : 's'}` : ''}. ${facts.sample ? 'These are sample results.' : sources.includes('practice') ? 'Tests use the M-Lab open speed test. Some results are simulated.' : 'Tests use the M-Lab open speed test.'} Each day is scored by its daily median, so one bad test cannot decide a day. ${facts.ignored.length} one-off dip${facts.ignored.length === 1 ? ' was' : 's were'} set aside by the outlier check. The fair line is 80% of the speed on the plan label, which is ${facts.fairLine} Mbps for this plan.</p>
    <div class="sh-sign"><span class="sh-seal">${SEAL}</span><div><b>Fingerprinted with SHA-256, so any change to these numbers can be detected</b><code data-short>sha256 · ${short}</code></div></div>
  </div>`;

  const routerEv = (facts.diagnosis.evidence || []).find((e) => e.key === 'router');
  const routerNote = !facts.router.pairs ? '' : routerEv && routerEv.supports === 'provider' ? 'Small gap, and both are under the fair line, so Wi-Fi is not the likely cause.' : routerEv && routerEv.supports === 'wifi' ? 'A large gap, which points to Wi-Fi coverage inside the home.' : `A gap of ${Math.round(facts.router.near - facts.router.far)} Mbps between the two spots.`;
  const hasTod = facts.evening.avg != null && facts.daytime.avg != null;
  const todNote = !hasTod ? '' : facts.evening.avg < facts.daytime.avg * 0.92 ? 'Speeds drop between 7 and 11 PM.' : 'No clear drop in the evening.';
  const boxes = [
    facts.router.pairs ? `<div class="p2box" data-box="router"><span>Router check</span><b>${facts.router.near} <small>near</small> · ${facts.router.far} <small>far, Mbps</small></b><em>${routerNote}</em></div>` : '',
    hasTod ? `<div class="p2box" data-box="tod"><span>Time of day</span><b>${facts.evening.avg} <small>evening</small> · ${facts.daytime.avg} <small>day, Mbps</small></b><em>${todNote}</em></div>` : '',
  ].filter(Boolean);
  const page2 = () => `<div class="paper light" data-page="2">${head(2)}
    ${boxes.length ? `<div class="sh-h" style="margin-top:20px">${H.status === 'below' ? 'Where the slowdown comes from' : 'Router and time of day'}</div><div class="p2grid">${boxes.join('')}</div>` : ''}
    <div class="sh-h"${boxes.length ? '' : ' style="margin-top:20px"'}>Daily results</div>
    <table class="p2t"><tr><th>Day</th><th>Date</th><th>Tests</th><th>Daily median</th><th>Result</th></tr>${measured.map((d) => `<tr><td>Day ${d.day}</td><td>${d.weekday}, ${d.label}</td><td>${d.n}</td><td>${d.median} Mbps</td><td class="${d.low ? 'lo' : ''}">${d.low ? 'Below fair line' : 'On plan'}</td></tr>`).join('')}</table>
    <div class="sh-cap" style="margin-top:12px">Full fingerprint (SHA-256): <span style="word-break:break-all;font-family:ui-monospace,Menlo,monospace">${hash}</span></div>
  </div>`;

  $('#thumbpaper').innerHTML = page1();
  $('#canvas').innerHTML = page1() + page2();
  bind({
    eyebrow: `Two-week check · ${range}`, thumbMeta: `2 pages · ${range}`,
    thumbSum: `${H.pct}% of plan · ${facts.daysBelow} of ${facts.daysDone} days below the fair line`,
    signed: `sha256 · ${short}`, fullHash: hash, canon: json,
  });
  if (!facts.complete) { const b = $('#banner'); b.hidden = false; $('span', b).textContent = `Your check is not finished. This is a draft based on ${facts.daysDone} day${facts.daysDone === 1 ? '' : 's'}.`; }

  // page arrows scroll the preview, and the label follows the scroll
  const canvas = $('#canvas');
  const papers = () => $$('.paper', canvas);
  const showPage = (n) => { $('#pglabel').textContent = `Page ${n} of 2`; $('#pgprev').disabled = n === 1; $('#pgnext').disabled = n === 2; };
  const toPage = (n) => { canvas.scrollTo({ top: n === 1 ? 0 : papers()[1].offsetTop - 12, behavior: 'smooth' }); showPage(n); };
  $('#pgprev').onclick = () => toPage(1); $('#pgnext').onclick = () => toPage(2);
  canvas.addEventListener('scroll', () => { const p2 = papers()[1]; showPage(canvas.scrollTop + canvas.clientHeight / 2 > p2.offsetTop || canvas.scrollTop + canvas.clientHeight >= canvas.scrollHeight - 4 ? 2 : 1); });
  showPage(1);
  $('#openpreview').onclick = () => { const v = $('#viewer'); const open = v.classList.toggle('open'); $('#openpreview').textContent = open ? 'Hide preview' : 'Open preview'; if (open) v.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  $('#copyhash').onclick = async () => toast((await copyText(hash)) ? 'Fingerprint copied' : 'Could not copy');

  /* ---------- draft state (kept in the store, tied to this fingerprint) ---------- */
  const provider = plan.provider || plan.name.split(' ')[0];
  let R = state.report && state.report.hash === hash && Array.isArray(state.report.drafts) && state.report.drafts.length ? state.report : null;
  if (!R) R = { hash, at: new Date().toISOString(), drafts: [], idx: 0, to: { name: `${provider} support`, email: '' }, fcc: false };
  let read = false;      // the "I have read this" box. Never stored: it must be ticked each time.
  let editing = false, busy = false;
  const save = () => Store.update((s) => { s.report = R; });
  const cur = () => R.drafts[R.idx];
  const alreadySent = () => (Store.get().sent || []).filter((x) => x.hash === hash);
  const emailOk = () => !R.to.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(R.to.email);
  const mailBody = () => `${cur().body}\n\nReport fingerprint (SHA-256): ${hash}`;
  /** The gate. Both conditions, checked again inside send(). */
  const canSend = () => !!cur() && cur().approved === true && read === true && !busy && !editing;
  api.canSend = canSend;
  api.currentMailto = () => buildMailto(R.to.email, cur().subject, mailBody());

  async function makeDraft(tone) {
    busy = true; paint();
    let d;
    try { d = await AI.draft(facts, Store.get(), tone); } catch { d = null; }
    busy = false;
    if (!d || !d.body) { toast('Proof AI could not write a draft. Try again.'); paint(); return; }
    const next = { subject: String(d.subject || 'Speeds below my plan'), body: String(d.body), mode: d.mode === 'live' ? 'live' : 'offline', model: d.mode === 'live' ? (d.model || status.model || null) : null, tone, edited: false, approved: false, at: new Date().toISOString() };
    const same = cur() && !cur().edited && cur().body === next.body && cur().subject === next.subject;
    R.drafts = cur() ? [cur(), next] : [next];   // keep the draft that was on screen, so the user can flip back
    R.idx = R.drafts.length - 1;
    setRead(false); editing = false;
    await save(); paint();
    return same;
  }

  function setRead(v) { read = v; $$('.approvechk').forEach((c) => { c.checked = v; }); }

  function paint() {
    const d = cur();
    const sent = alreadySent();
    if (d) {
      $('#dsubj').textContent = d.subject;
      $('#dbody').innerHTML = d.body.split(/\n\n+/).map((p) => `<p>${AI.html(p)}</p>`).join('');
      $('#draftview').hidden = editing; $('#draftedit').hidden = !editing;
      $('#dlabel').textContent = `Draft ${R.idx + 1} of ${R.drafts.length}`;
      $('#dprev').disabled = R.idx === 0; $('#dnext').disabled = R.idx >= R.drafts.length - 1;
      $$('[data-tone]').forEach((c) => { c.classList.toggle('on', c.dataset.tone === d.tone); c.setAttribute('aria-pressed', c.dataset.tone === d.tone ? 'true' : 'false'); c.disabled = busy; });
      $('#dchips').innerHTML = [`${facts.testsCount} tests`, `${facts.daysDone} day${facts.daysDone === 1 ? '' : 's'}`, 'Your plan label', ...(facts.router.pairs ? ['Router check'] : [])].map((c) => `<span class="evidence">${esc(c)}</span>`).join('');
      $('#dmeta').textContent = `${d.edited ? 'Edited by you' : `Drafted ${fmtTime(d.at)}`} · ${d.mode === 'live' ? 'live' : 'offline mode'}`;
      // who wrote it: the model saved with the draft, named through models.js. Offline drafts say the built-in writer wrote them.
      const by = d.mode === 'live' ? (d.model || status.model || '') : '';
      $('#dpager').hidden = R.drafts.length < 2;
      $('#dnote').dataset.model = by || 'offline';
      $('#dnote').innerHTML = `${d.mode === 'live' ? `Written by ${by ? modelChip(by) : 'an AI model'} from your own test results. It can make mistakes, so read it before you approve it.` : esc(AI.note(d.mode))}${d.edited ? ' You edited this draft.' : ''} Approving the draft does not send it.`;
      const ap = $('#approve');
      ap.innerHTML = `${CHECK}${d.approved ? 'Approved' : 'Approve'}`; ap.classList.toggle('approved', !!d.approved); ap.setAttribute('aria-pressed', d.approved ? 'true' : 'false'); ap.disabled = busy || editing;
      $('#edit').lastChild.textContent = editing ? 'Done' : 'Edit';
      $('#regen').disabled = busy;
    } else {
      $('#dmeta').textContent = busy ? 'Proof AI is writing' : '';
    }
    $('#tov').textContent = `${R.to.name || 'No name'}${R.to.email ? `, ${R.to.email}` : ', no email address yet (you can add it in your email app)'}`;
    $('#toemail').classList.toggle('bad', !emailOk());
    $('#fccword').textContent = R.fcc ? 'On' : 'Off';
    paintSwitch($('[data-switch="fcc"]'), !!R.fcc);
    const ok = canSend();
    $$('.sendbtn').forEach((b) => { b.disabled = !ok; });
    // the two things the lock waits for, ticked from the same state the gate reads
    const needs = { approved: !!d && d.approved === true, read: read === true };
    $$('.sendlist li').forEach((li) => { const on = needs[li.dataset.need]; li.classList.toggle('done', on); li.dataset.done = on ? 'true' : 'false'; li.title = on ? 'Done' : 'Still needed'; li.setAttribute('aria-label', `${$('span', li).textContent}: ${on ? 'done' : 'still needed'}`); });
    $('#gate').textContent = !d ? '' : !d.approved && !read ? 'To send: approve the draft above, then tick the box.' : !d.approved ? 'To send: approve the draft above.' : !read ? 'To send: tick the box.' : 'Ready. This opens your own email app.';
    const st = $('#status');
    st.className = `badge ${sent.length ? 'good' : 'warn'}`;
    st.innerHTML = `<span class="dot"></span>${sent.length ? 'Sent from your email app' : d && d.approved ? 'Approved, not sent' : 'Draft, not sent'}`;
    $('#sentbox').hidden = !sent.length;
    if (sent.length) {
      const lastSent = sent[sent.length - 1];
      $('#sentwhen').textContent = `Opened in your email app on ${fmtDate(lastSent.at)} at ${fmtTime(lastSent.at)}, addressed to ${lastSent.to || 'no address'}.`;
      $('#fccbox').hidden = !lastSent.fcc;
    }
    $$('.nosend span').forEach((n) => { n.textContent = sent.length ? 'Wi-Fight did not send anything. It opened your email app.' : 'Nothing is sent until you approve it.'; });
  }

  /* ---------- draft controls ---------- */
  const setTone = async (tone) => { if (busy || (cur() && tone === cur().tone && !cur().edited)) return; await makeDraft(tone); };
  $$('[data-tone]').forEach((c) => { c.onclick = () => setTone(c.dataset.tone); });
  $('#regen').onclick = async () => { if (busy) return; const same = await makeDraft(cur() ? cur().tone : 'polite'); if (same) toast('Offline mode writes the same words each time. Change the tone for a different draft.'); };
  $('#dprev').onclick = async () => { if (R.idx > 0) { R.idx--; editing = false; setRead(false); await save(); paint(); } };
  $('#dnext').onclick = async () => { if (R.idx < R.drafts.length - 1) { R.idx++; editing = false; setRead(false); await save(); paint(); } };
  $('#approve').onclick = async () => { if (busy || editing || !cur()) return; cur().approved = !cur().approved; if (!cur().approved) setRead(false); await save(); paint(); };
  $('#edit').onclick = () => {
    if (!cur() || busy) return;
    editing = !editing;
    if (editing) { $('#esubj').value = cur().subject; $('#ebody').value = cur().body; }
    paint();
    if (editing) $('#ebody').focus();
  };
  const onEdit = async () => {
    const d = cur(); const subject = $('#esubj').value, body = $('#ebody').value;
    if (subject === d.subject && body === d.body) return;
    d.subject = subject; d.body = body; d.edited = true;
    d.approved = false; setRead(false);          // any edit after approval needs a fresh approval
    await save(); paint();
  };
  $('#esubj').addEventListener('input', onEdit); $('#ebody').addEventListener('input', onEdit);

  /* ---------- review rows ---------- */
  $('#toedit').onclick = () => { const box = $('#tobox'); box.hidden = !box.hidden; $('#toedit').textContent = box.hidden ? 'Edit' : 'Done'; if (!box.hidden) { $('#toname').value = R.to.name; $('#toemail').value = R.to.email; $('#toname').focus(); } };
  const onTo = async () => { R.to = { name: $('#toname').value.trim().slice(0, 80), email: $('#toemail').value.trim().slice(0, 120) }; setRead(false); await save(); paint(); };
  $('#toname').addEventListener('input', onTo); $('#toemail').addEventListener('input', onTo);
  $('[data-switch="fcc"]').onclick = async () => { R.fcc = !R.fcc; setRead(false); await save(); paint(); };
  $$('.approvechk').forEach((c) => c.addEventListener('change', (e) => { read = e.target.checked; $$('.approvechk').forEach((x) => { x.checked = read; }); paint(); }));

  /* ---------- send: opens the user's own email app, then records what was opened ---------- */
  async function send() {
    if (!canSend()) return false;                       // enforced here, not only by the disabled button
    if (!emailOk()) { toast('That email address does not look right.'); $('#tobox').hidden = false; $('#toemail').focus(); return false; }
    const d = cur();
    const url = api.currentMailto();
    await Store.update((s) => { s.sent = s.sent || []; s.sent.push({ at: new Date().toISOString(), to: R.to.email || R.to.name, subject: d.subject, hash, fcc: !!R.fcc }); });
    setRead(false); paint();
    api.openMail(url);
    toast('Your email app is opening. Press send there.');
    return true;
  }
  api.send = send;
  $$('.sendbtn').forEach((b) => { b.onclick = send; });
  $('#copymsg').onclick = async () => toast((await copyText(`${cur().subject}\n\n${mailBody()}`)) ? 'Message copied' : 'Could not copy');

  /* ---------- download and share ---------- */
  $('#pdf').onclick = () => window.print();
  const summary = `Wi-Fight speed report${facts.complete ? '' : ' (draft)'}, ${range}: ${H.mbps} Mbps measured on a ${plan.down} Mbps plan (${H.pct}%). ${facts.daysBelow} of ${facts.daysDone} days below the ${facts.fairLine} Mbps fair line. Fingerprint sha256 ${hash}.`;
  api.summary = summary;
  $('#share').onclick = async () => {
    if (navigator.share) { try { await navigator.share({ title: 'Wi-Fight speed report', text: summary }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    toast((await copyText(summary)) ? 'Summary copied. Paste it anywhere.' : 'Could not copy');
  };

  /* ---------- tamper test: works on a copy of the signed data, never on the report itself ---------- */
  const ORIG = data.headline.medianMbps;
  const tp = { val: ORIG, hash, seq: 0, done: Promise.resolve() };
  /** The same canonical JSON and the same SHA-256 the report uses, with one value changed in a copy. */
  const tamperedJson = (v) => canonical({ ...data, headline: { ...data.headline, medianMbps: v } });
  api.tamperedJson = tamperedJson;
  api.tamper = tp;
  const hashHTML = (h) => h.split('').map((ch, i) => (ch === hash[i] ? ch : `<mark>${ch}</mark>`)).join('');
  function paintTamper(valid) {
    const v = $('#tp-verdict'), same = tp.hash === hash;
    $('#tp-val').classList.toggle('changed', valid && tp.val !== ORIG);
    if (!valid) {
      $('#tp-new').textContent = '';
      v.className = 'tp-verdict idle'; $('i', v).innerHTML = ''; $('#tp-word').textContent = 'Type a number to test.'; $('#tp-count').textContent = '';
      v.dataset.state = 'idle';
      return;
    }
    const diff = tp.hash.split('').filter((ch, i) => ch !== hash[i]).length;
    $('#tp-new').innerHTML = hashHTML(tp.hash);
    v.className = `tp-verdict ${same ? 'good' : 'bad'}`; v.dataset.state = same ? 'match' : 'mismatch'; v.dataset.diff = String(diff);
    $('i', v).innerHTML = same ? CHECK : CROSS;
    $('#tp-word').textContent = same ? 'Matches. Nothing was changed.' : 'Does not match. This report was changed.';
    $('#tp-count').textContent = same ? '0 of 64 characters changed.' : `${diff} of 64 characters changed, after changing ${ORIG} to ${tp.val}.`;
  }
  function setTamper(raw, { fromInput = false } = {}) {
    const n = raw === '' || raw == null ? NaN : Number(raw);
    const valid = Number.isFinite(n) && n >= 0 && n <= 100000;
    const seq = ++tp.seq;
    if (!fromInput && valid) $('#tp-val').value = String(n);
    if (!valid) { paintTamper(false); return tp.done; }
    tp.done = sha256(tamperedJson(n)).then((h) => { if (seq !== tp.seq) return; tp.val = n; tp.hash = h; paintTamper(true); });
    return tp.done;
  }
  const stepTamper = (by) => { const now = Number($('#tp-val').value); return setTamper(Math.max(0, (Number.isFinite(now) && $('#tp-val').value !== '' ? now : ORIG) + by)); };
  const openTamper = (open) => { $('#tp-panel').hidden = !open; const b = $('#tamperbtn'); b.setAttribute('aria-expanded', open ? 'true' : 'false'); b.textContent = open ? 'Close the test' : 'Try to tamper with it'; if (open && window.matchMedia('(min-width:721px)').matches) $('#tamper').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); b.classList.toggle('primary', !open); b.classList.toggle('ghost', open); };
  $('#tp-orig').textContent = hash;
  $('#tp-origval').textContent = `The report says ${ORIG}. Change it by any amount.`;
  $('#tamperbtn').onclick = () => openTamper($('#tp-panel').hidden);
  $('#tp-minus').onclick = () => stepTamper(-1);
  $('#tp-plus').onclick = () => stepTamper(1);
  $('#tp-reset').onclick = () => setTamper(ORIG);
  $('#tp-val').addEventListener('input', (e) => setTamper(e.target.value, { fromInput: true }));
  await setTamper(ORIG);

  /* ---------- guided demo shortcut: tone, then the tamper test. It never approves or sends. ---------- */
  let demoing = false;
  window.wfDemoFill = async () => {
    if (demoing) return;
    demoing = true;
    try {
      await bringIntoView($('.draftcard'), 700);
      $('[data-tone="firm"]').focus({ preventScroll: true });
      for (let i = 0; busy && i < 900; i++) await pause(100);   // a draft that is still being written
      await setTone('firm');
      await pause(1400);
      await bringIntoView($('#tamper'), 800);
      if ($('#tp-panel').hidden) $('#tamperbtn').click();
      await setTamper(ORIG);
      await pause(700);
      await bringIntoView($('#tp-verdict'), 500);
      $('#tp-plus').click(); await tp.done;
      await pause(1600);
      $('#tp-reset').click(); await tp.done;
      await pause(500);
    } finally { demoing = false; }
  };

  paint();
  if (!R.drafts.length) await makeDraft('polite'); else await save();
  document.documentElement.dataset.report = '1';
}
