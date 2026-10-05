// Wi-Fight guided demo. A presenter bar that walks through the app one step at a time,
// so a live demo never gets stuck. Loaded on every page. Does nothing until the demo is started.
//   Start:  a button with [data-tour-start], or add ?tour=1 to any address.
//   Keys:   Right arrow = next, Left arrow = back, H = hide or show the bar, Esc = hide.
//   Pages can offer a shortcut by defining window.wfDemoFill = async () => { ... } ("Do it for me").
import { Store } from './store.js';

const KEY = 'wf.tour.v1';
export const STEPS = [
  { page: 'index.html', tag: 'The goal', title: 'The problem', say: 'You pay for a speed. You cannot tell if you get it, and you cannot prove it. Wi-Fight checks, and gives you proof. That is UN Goal 9, target 9.c: affordable internet.', act: 'Point at the three cards under the headline, then press Next.' },
  { page: 'onboarding-consent.html', tag: 'Security', title: 'Consent comes first', say: 'Nothing runs until you agree. We list what is collected and what never is. We are honest that M-Lab publishes test results.', act: 'Tick both boxes and continue. Or press "Do it for me".' },
  { page: 'onboarding-signin.html', tag: 'Security', title: 'No password to steal', say: 'Sign-in uses a one-time code or a passkey, so there is no password to leak. In this prototype no email is sent, so any 6 digits work.', act: 'Type any email, press the button, then type any 6 digits. Or press "Do it for me".' },
  { page: 'onboarding-plan.html', tag: 'Proof AI', title: 'Proof AI reads the bill', say: 'Proof AI reads a photo of the bill, pulls out the price, and flags a fee that is not a tax. The photo is never stored.', act: 'Press "Do it for me" and choose northstar-bill.png from the demo-files folder. Or upload it yourself.' },
  { page: 'test.html', tag: 'Core', title: 'A real speed test', say: "The real test is M-Lab's open test, the same one researchers use. In class we run the practice test, which is quicker and needs no open network.", act: 'Press "Practice test", or "Do it for me". Then press Next.' },
  { page: 'dashboard.html', prep: 9, tag: 'Core', title: 'The answer at a glance', say: 'Nine days in, we get 78 percent of the speed we pay for. Proof AI says it has lasted four days in a row and points to the provider.', act: 'Point at the ring, the Proof AI card, and the Broadband Facts card.' },
  { page: 'history.html', tag: 'Proof AI', title: 'Real problems, not flukes', say: 'Two slow tests were one-off dips, so Proof AI ignored them. Four full days stayed low, so those count.', act: 'Press "Show what Proof AI ignored".' },
  { page: 'diagnosis.html', tag: 'Proof AI', title: 'Watch Proof AI decide', say: 'Is it our Wi-Fi or the provider? Each piece of evidence moves the score. It lands on the provider, with high confidence.', act: 'It plays by itself. Press "Watch Proof AI decide" to play it again.' },
  { page: 'chat.html', tag: 'Proof AI', title: 'Ask it anything', say: 'This is a real language model answering from our own results. Every number it writes is checked against our data.', act: 'Press "Do it for me" to ask a question. Then type "Can I talk to a person?" to show the handoff to a support agent.' },
  { page: 'verdict.html', prep: 14, tag: 'Core', title: 'The two-week verdict', say: 'After 14 days the verdict is in: 78 percent, below the fair line on 9 of 14 days. There is a card to share.', act: 'Point at the verdict and the share card.' },
  { page: 'report.html', tag: 'Security', title: 'AI drafts, you approve', say: 'Proof AI drafts the message. Nothing is sent until we approve it. The fingerprint breaks if anyone changes a number.', act: 'Press "Try to tamper with it" and change the number. Or press "Do it for me".' },
  { page: 'privacy.html', tag: 'Security', title: 'Your data, locked', say: 'Everything is encrypted on this device. Here is what is actually stored. One button deletes it all, key included.', act: 'Open "See what is stored on disk", then search for your name. Or press "Do it for me".' },
  { page: 'about.html', tag: 'The goal', title: 'Why it matters', say: 'Affordable internet only counts if you get what you pay for. Here is what works today, what does not yet, and what comes next.', act: 'Show the dip detector slider, then the limitations.' },
];

const here = () => (location.pathname.split('/').pop() || 'index.html');
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } };
const write = (s) => localStorage.setItem(KEY, JSON.stringify(s));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');

function css() {
  if (document.getElementById('tour-css')) return;
  const st = document.createElement('style'); st.id = 'tour-css';
  st.textContent = `
.tour{position:fixed;right:18px;bottom:18px;z-index:80;width:400px;max-width:calc(100vw - 24px);background:#0B0F1A;color:#F5F7FB;border-radius:20px;box-shadow:0 18px 50px rgba(11,15,26,.45);font-family:var(--body,system-ui);overflow:hidden;border:1px solid #232A3B}
.tour *{box-sizing:border-box}
.tour-top{display:flex;align-items:center;gap:8px;padding:11px 12px 9px 16px}
.tour-step{font:700 11px/1 var(--body,system-ui);letter-spacing:.08em;text-transform:uppercase;color:#AEB5C6}
.tour-tag{font:700 11px/1 var(--body,system-ui);padding:5px 8px;border-radius:999px;background:rgba(39,71,245,.28);color:#B8C4FF}
.tour-tag.ai{background:linear-gradient(120deg,#2747F5,#8B5CF6 55%,#2FD9A0);color:#fff}
.tour-tag.sec{background:rgba(61,220,151,.18);color:#6EE7B0}
.tour-time{margin-left:auto;font:600 12px/1 ui-monospace,Menlo,monospace;color:#AEB5C6}
.tour-x{width:28px;height:28px;border-radius:50%;border:0;background:rgba(255,255,255,.08);color:#F5F7FB;font:600 14px/1 system-ui;cursor:pointer}
.tour-bar{height:3px;background:#232A3B}.tour-bar i{display:block;height:100%;background:linear-gradient(90deg,#2747F5,#8B5CF6,#2FD9A0);transition:width .3s}
.tour-body{padding:12px 16px 4px}
.tour-title{font:700 19px/1.2 var(--display,system-ui);letter-spacing:-.01em}
.tour-row{display:flex;gap:9px;margin-top:9px;font:500 13.5px/1.4 var(--body,system-ui);color:#D8DCE8}
.tour-row b{flex:none;width:34px;font:700 10.5px/1.9 var(--body,system-ui);letter-spacing:.08em;text-transform:uppercase;color:#8A90A0}
.tour-off{margin-top:9px;padding:8px 10px;border-radius:10px;background:rgba(255,194,75,.14);color:#FFD88A;font:600 12.5px/1.35 var(--body,system-ui)}
.tour-off a{color:#fff;text-decoration:underline;cursor:pointer}
.tour-btns{display:flex;gap:8px;padding:12px 12px 12px 16px;align-items:center}
.tour-btns button{height:38px;border-radius:999px;border:0;padding:0 15px;font:600 13.5px/1 var(--body,system-ui);cursor:pointer}
.tour-fill{background:rgba(255,255,255,.1);color:#F5F7FB}.tour-fill[disabled]{opacity:.6;cursor:progress}
.tour-back{background:transparent;color:#AEB5C6;margin-left:auto}
.tour-next{background:#2747F5;color:#fff;min-width:92px}
.tour.min{width:auto}.tour.min .tour-body,.tour.min .tour-btns,.tour.min .tour-bar,.tour.min .tour-time{display:none}.tour.min .tour-top{padding:9px 9px 9px 14px;cursor:pointer}
.tour-skip{position:fixed;inset:0;z-index:90;background:#070A12;color:#F5F7FB;display:grid;place-items:center;text-align:center;padding:24px;animation:tourfade .25s}
.tour-skip .big{font:700 clamp(40px,7vw,84px)/1.05 var(--display,system-ui);letter-spacing:-.03em}
.tour-skip .sm{margin-top:14px;font:500 17px/1.45 var(--body,system-ui);color:#AEB5C6;max-width:520px}
.tour-skip .dots{margin-top:26px;display:flex;gap:7px;justify-content:center}.tour-skip .dots i{width:9px;height:9px;border-radius:50%;background:#2747F5;animation:tourdot 1s infinite}.tour-skip .dots i:nth-child(2){animation-delay:.15s}.tour-skip .dots i:nth-child(3){animation-delay:.3s}
@keyframes tourfade{from{opacity:0}}@keyframes tourdot{0%,100%{opacity:.25}50%{opacity:1}}
.tour-dialog-back{position:fixed;inset:0;z-index:95;background:rgba(11,15,26,.55);display:grid;place-items:center;padding:16px}
.tour-dialog{width:min(480px,100%);background:var(--surface,#fff);color:var(--ink,#0B0F1A);border-radius:24px;padding:24px;box-shadow:0 24px 60px rgba(11,15,26,.35);font-family:var(--body,system-ui)}
.tour-dialog h2{font:700 24px/1.15 var(--display,system-ui);letter-spacing:-.02em;margin:0 0 8px}
.tour-dialog p{font:400 15px/1.45 var(--body,system-ui);color:var(--ink-2,#4A5163);margin:0 0 16px}
.tour-dialog button{display:block;width:100%;text-align:left;border:1.5px solid var(--line,#E4E6EC);background:var(--surface,#fff);border-radius:16px;padding:14px 16px;margin-top:10px;cursor:pointer;font-family:inherit;color:inherit}
.tour-dialog button b{display:block;font:700 16px/1.25 var(--body,system-ui)}.tour-dialog button span{display:block;font:500 13px/1.4 var(--body,system-ui);color:var(--ink-2,#4A5163);margin-top:2px}
.tour-dialog button.pri{border-color:#2747F5;background:#F1F3FF}.tour-dialog button.quiet{border:0;text-align:center;color:var(--ink-3,#8A90A0);font:600 14px var(--body,system-ui);padding:10px}
@media (max-width:720px){.tour{left:8px;right:8px;top:8px;bottom:auto;width:auto;max-width:none;border-radius:16px}.tour-title{font-size:16px}.tour-row{font-size:12.5px;margin-top:6px}.tour-btns{padding:8px 10px 10px 12px}.tour-btns button{height:34px;font-size:13px;padding:0 12px}}
@media print{.tour,.tour-skip,.tour-dialog-back{display:none !important}}`;
  document.head.appendChild(st);
}

function render() {
  const s = read(); const old = document.querySelector('.tour'); if (old) old.remove();
  document.body.style.paddingTop = '';
  if (!s || !s.on) return;
  css();
  const step = STEPS[s.i]; const off = here() !== step.page;
  const el = document.createElement('aside'); el.className = 'tour' + (s.min ? ' min' : ''); el.setAttribute('aria-label', 'Guided demo');
  const tagClass = step.tag === 'Proof AI' ? 'ai' : step.tag === 'Security' ? 'sec' : '';
  el.innerHTML = `<div class="tour-top"><span class="tour-step">Demo ${s.i + 1} of ${STEPS.length}</span><span class="tour-tag ${tagClass}">${esc(step.tag)}</span><span class="tour-time" data-t>0:00</span><button class="tour-x" data-min title="Hide or show (H)" aria-label="Hide or show the demo bar">${s.min ? '+' : '−'}</button><button class="tour-x" data-end title="End the demo" aria-label="End the demo">×</button></div>
    <div class="tour-bar"><i style="width:${((s.i + 1) / STEPS.length) * 100}%"></i></div>
    <div class="tour-body"><div class="tour-title">${esc(step.title)}</div>
      <div class="tour-row"><b>Say</b><span>${esc(step.say)}</span></div>
      <div class="tour-row"><b>Do</b><span>${esc(step.act)}</span></div>
      ${off ? `<div class="tour-off">This page is not part of step ${s.i + 1}. <a data-return>Go to step ${s.i + 1}</a></div>` : ''}</div>
    <div class="tour-btns"><button class="tour-fill" data-fill hidden>Do it for me</button><button class="tour-back" data-back ${s.i === 0 ? 'disabled style="opacity:.35"' : ''}>Back</button><button class="tour-next" data-next>${s.i === STEPS.length - 1 ? 'Finish' : 'Next'}</button></div>`;
  document.body.appendChild(el);
  // on phones the bar sits at the top, so make room for it instead of covering the page header
  if (window.matchMedia('(max-width:720px)').matches) document.body.style.paddingTop = (el.offsetHeight + 14) + 'px';
  const tick = () => { const st = read(); const t = el.querySelector('[data-t]'); if (!st || !t) return; const sec = Math.max(0, Math.floor((Date.now() - st.t0) / 1000)); t.textContent = `${Math.floor(sec / 60)}:${pad(sec % 60)}`; };
  tick(); clearInterval(render.h); render.h = setInterval(tick, 1000);
  // "Do it for me" appears when the page offers a shortcut
  const fill = el.querySelector('[data-fill]');
  const showFill = () => { if (!off && typeof window.wfDemoFill === 'function') fill.hidden = false; };
  showFill(); let tries = 0; const poll = setInterval(() => { showFill(); if (!fill.hidden || ++tries > 20) clearInterval(poll); }, 300);
  fill.onclick = async () => { fill.disabled = true; fill.textContent = 'Working...'; try { await window.wfDemoFill(); } catch (e) { console.warn('Demo shortcut failed', e); } if (document.body.contains(fill)) { fill.disabled = false; fill.textContent = 'Do it for me'; } };
  el.querySelector('[data-next]').onclick = () => go(s.i + 1);
  el.querySelector('[data-back]').onclick = () => { if (s.i > 0) go(s.i - 1); };
  el.querySelector('[data-end]').onclick = end;
  el.querySelector('[data-min]').onclick = (e) => { e.stopPropagation(); toggleMin(); };
  if (s.min) el.querySelector('.tour-top').onclick = toggleMin;
  const ret = el.querySelector('[data-return]'); if (ret) ret.onclick = () => go(s.i);
}

function toggleMin() { const s = read(); if (!s) return; s.min = !s.min; write(s); render(); }
function end() { localStorage.removeItem(KEY); render(); }

/** Move to step i. Steps with "prep" skip ahead in time by loading the labelled sample data. */
async function go(i) {
  const s = read(); if (!s) return;
  if (i >= STEPS.length) { end(); location.href = 'dashboard.html'; return; }
  const step = STEPS[i];
  s.i = i; write(s);
  if (step.prep) {
    await Store.load();
    const st = Store.get();
    const haveDays = st.sample ? new Set((st.tests || []).filter((t) => t.source === 'sample').map((t) => t.t.slice(0, 10))).size : 0;
    if (haveDays !== step.prep) {
      css();
      const ov = document.createElement('div'); ov.className = 'tour-skip';
      ov.innerHTML = step.prep === 14 ? '<div><div class="big">Day 14</div><div class="sm">The two-week check is finished. For the demo we skip ahead with sample data, which is labelled on every page.</div><div class="dots"><i></i><i></i><i></i></div></div>' : '<div><div class="big">Nine days later</div><div class="sm">A real check takes two weeks. For the demo we skip ahead with nine days of sample data, which is labelled on every page.</div><div class="dots"><i></i><i></i><i></i></div></div>';
      document.body.appendChild(ov);
      const keepUser = st.user && st.user.method !== 'sample' ? { ...st.user } : null;
      const keepConsent = st.consent ? { ...st.consent } : null;
      await Store.loadSample(step.prep);
      if (keepUser || keepConsent) await Store.update((x) => { if (keepUser) x.user = keepUser; if (keepConsent) x.consent = keepConsent; if (x.settings) x.settings.aiAnalyze = true; });
      await new Promise((r) => setTimeout(r, 1700));
    }
  }
  if (here() === step.page) { location.reload(); } else location.href = step.page;
}

/** The start dialog. */
export function startDialog() {
  css();
  const back = document.createElement('div'); back.className = 'tour-dialog-back';
  back.innerHTML = `<div class="tour-dialog" role="dialog" aria-modal="true" aria-label="Start the guided demo">
    <h2>Guided demo</h2><p>${STEPS.length} short steps, about 6 minutes. A bar in the corner tells you what to say and what to press. Right arrow goes to the next step.</p>
    <button class="pri" data-go="clean"><b>Start from the beginning</b><span>Clears Wi-Fight's data in this browser, then walks through sign-up, a speed test, and the results.</span></button>
    <button data-go="skip"><b>Skip the setup</b><span>Loads nine days of sample data and starts at the dashboard.</span></button>
    <button class="quiet" data-go="no">Not now</button></div>`;
  document.body.appendChild(back);
  back.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-go]'); if (!b && e.target !== back) return;
    const how = b ? b.dataset.go : 'no';
    if (how === 'no') { back.remove(); return; }
    await Store.load();
    if (how === 'clean') { await Store.wipe(); write({ on: true, i: 0, t0: Date.now(), min: false }); location.href = 'index.html'; }
    else { write({ on: true, i: 5, t0: Date.now(), min: false }); back.remove(); await go(5); }
  });
}

function init() {
  const q = new URLSearchParams(location.search);
  if (q.get('tour') === '1' && !read()) { history.replaceState(null, '', location.pathname); startDialog(); }
  if (q.get('tour') === '0') { end(); history.replaceState(null, '', location.pathname); }
  // Follow the presenter: if they moved on by using the page itself, the bar catches up.
  const s = read();
  if (s && s.on) {
    const cur = STEPS.findIndex((x, i) => x.page === here() && i >= s.i - 1);
    if (cur >= 0 && cur !== s.i && !(STEPS[cur].prep && cur > s.i)) { s.i = cur; write(s); }
  }
  render();
  document.addEventListener('click', (e) => { if (e.target.closest('[data-tour-start]')) { e.preventDefault(); e.stopPropagation(); document.querySelectorAll('.sheet-wrap').forEach((x) => x.remove()); startDialog(); } }, true);
  document.addEventListener('keydown', (e) => {
    const st = read(); if (!st || !st.on) return;
    const t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(st.i + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (st.i > 0) go(st.i - 1); }
    else if (e.key === 'h' || e.key === 'H' || e.key === 'Escape') toggleMin();
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
