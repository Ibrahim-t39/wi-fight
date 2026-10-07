// Wi-Fight guided demo. A presenter bar that walks through the app one step at a time,
// so a live demo never gets stuck. Loaded on every page. Does nothing until the demo is started.
//   Start:  a button with [data-tour-start], or add ?tour=1 to any address.
//   Keys:   Right arrow = next, Left arrow = back, S = show or hide what to say, H = hide or show the bar, Esc = hide.
//   Pages can offer a shortcut by defining window.wfDemoFill = async () => { ... } ("Do it for me").
import { Store } from './store.js';

const KEY = 'wf.tour.v1';
export const STEPS = [
  { page: 'index.html', secs: 20, tag: 'UN Goal 9', title: 'The problem and the goal', say: 'People pay for an internet speed and have no way to tell whether they get it. Wi-Fight checks for two weeks and gives them proof, which supports UN Goal 9: affordable internet access.', act: 'Point at the headline and the 78 percent example, then press Next.' },
  { page: 'onboarding-consent.html', secs: 15, tag: 'Security', title: 'Consent comes first', say: 'Nothing runs until the user agrees. The page lists what is collected and what never is.', act: 'Press "Do it for me", or tick both boxes and continue.' },
  { page: 'onboarding-signin.html', secs: 15, tag: 'Security', title: 'No password to steal', say: 'Sign-in uses a one-time code, so there is no password to leak. For the demo any 6 digits work.', act: 'Press "Do it for me", or type any email and any 6 digits.' },
  { page: 'onboarding-plan.html', secs: 35, tag: 'Proof AI', title: 'Proof AI reads the bill', say: 'Instead of typing the plan, we give Proof AI a photo of the bill. It reads the plan, the price, and each fee, and it flags the fee that is not a tax. The photo is never stored.', act: 'Press "Do it for me" and choose northstar-bill.png from the demo-files folder.' },
  { page: 'test.html', secs: 20, tag: 'Core', title: 'The first speed test', say: "For the demo this is a simulated test, and the app labels it that way. The real one uses M-Lab's open test and is one click away.", act: 'Press "Do it for me", wait for the result, then press Next.' },
  { page: 'dashboard.html', prep: 9, secs: 35, tag: 'Core', title: 'Nine days later', say: 'This home gets 78 percent of the speed it pays for. Proof AI set aside two one-off dips, and it still found four full days in a row under the fair line.', act: 'Point at the ring, then at the steps inside the Proof AI card.' },
  { page: 'diagnosis.html', secs: 35, tag: 'Proof AI', title: 'Provider or home Wi-Fi?', say: 'Each piece of evidence moves the score. The speed is slow next to the router too, it drops in the evening, and it has lasted for days, so the score lands on the provider.', act: 'It plays by itself. Read the score as it moves from 50 to 86.' },
  { page: 'chat.html', secs: 35, tag: 'Proof AI', title: 'Ask it anything', say: 'This is a real language model answering from our own results, and the app checks every number it writes. If it cannot help, it can hand the case to a support agent.', act: 'Press "Do it for me". If there is time, type "Can I talk to a person?"' },
  { page: 'verdict.html', prep: 14, secs: 20, tag: 'Core', title: 'The two-week verdict', say: 'After 14 days the verdict is in. This home was below the fair line on 9 of 14 days, which is about 18 dollars a month paid for speed that never arrived.', act: 'Point at the 78 percent and the dollar figure, then press Next.' },
  { page: 'report.html', secs: 35, tag: 'Security', title: 'A report nobody can quietly edit', say: 'Proof AI drafts the letter, and nothing is sent until we approve it. Every report carries a fingerprint, so changing a single number makes it stop matching.', act: 'Press "Do it for me" and watch the fingerprint break.' },
  { page: 'privacy.html', secs: 25, tag: 'Security', title: 'Your data, locked', say: 'Everything is encrypted on this device. On the left is what we see, and on the right is what is actually saved. Our name is nowhere in it.', act: 'Press "Do it for me". Then go to the closing slides.' },
];
export const BUDGET = 300; // seconds: the live demo may take at most 5 minutes

const here = () => (location.pathname.split('/').pop() || 'index.html');
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } };
const write = (s) => localStorage.setItem(KEY, JSON.stringify(s));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');

function css() {
  if (document.getElementById('tour-css')) return;
  const st = document.createElement('style'); st.id = 'tour-css';
  st.textContent = `
.tour{position:fixed;right:14px;bottom:14px;z-index:80;width:336px;max-width:calc(100vw - 24px);background:#0B0F1A;color:#F5F7FB;border-radius:20px;box-shadow:0 18px 50px rgba(11,15,26,.45);font-family:var(--body,system-ui);overflow:hidden;border:1px solid #232A3B}
.tour *{box-sizing:border-box}
.tour-top{display:flex;align-items:center;gap:7px;padding:9px 10px 7px 14px}
.tour-step{font:700 11px/1 var(--body,system-ui);letter-spacing:.08em;text-transform:uppercase;color:#AEB5C6}
.tour-tag{font:700 11px/1 var(--body,system-ui);padding:5px 8px;border-radius:999px;background:rgba(39,71,245,.28);color:#B8C4FF}
.tour-tag.ai{background:linear-gradient(120deg,#2747F5,#8B5CF6 55%,#2FD9A0);color:#fff}
.tour-tag.sec{background:rgba(61,220,151,.18);color:#6EE7B0}
.tour-time{margin-left:auto;font:600 12px/1 ui-monospace,Menlo,monospace;color:#AEB5C6;white-space:nowrap}
.tour-step,.tour-tag{white-space:nowrap}
.tour-time.late{color:#FFC24B}
.tour-x{width:28px;height:28px;border-radius:50%;border:0;background:rgba(255,255,255,.08);color:#F5F7FB;font:600 14px/1 system-ui;cursor:pointer}
.tour-bar{height:3px;background:#232A3B}.tour-bar i{display:block;height:100%;background:linear-gradient(90deg,#2747F5,#8B5CF6,#2FD9A0);transition:width .3s}
.tour-body{padding:9px 14px 2px}
.tour-title{font:700 16px/1.2 var(--display,system-ui);letter-spacing:-.01em}
.tour-row{display:flex;gap:8px;margin-top:6px;font:500 12.5px/1.38 var(--body,system-ui);color:#D8DCE8}
.tour-row b{flex:none;width:34px;font:700 10.5px/1.9 var(--body,system-ui);letter-spacing:.08em;text-transform:uppercase;color:#8A90A0}
.tour-due{margin-top:8px;font:600 11.5px/1 var(--body,system-ui);color:#8A90A0}
.tour-off{margin-top:9px;padding:8px 10px;border-radius:10px;background:rgba(255,194,75,.14);color:#FFD88A;font:600 12.5px/1.35 var(--body,system-ui)}
.tour-off a{color:#fff;text-decoration:underline;cursor:pointer}
.tour-btns{display:flex;gap:6px;padding:9px 10px 10px 14px;align-items:center}
.tour-btns button{height:34px;border-radius:999px;border:0;padding:0 13px;font:600 13px/1 var(--body,system-ui);cursor:pointer}
.tour-fill{background:rgba(255,255,255,.1);color:#F5F7FB}.tour-fill[disabled]{opacity:.6;cursor:progress}
.tour-back{background:transparent;color:#AEB5C6;margin-left:auto}
.tour-next{background:#2747F5;color:#fff;min-width:76px}
.tour-say{background:transparent;color:#8FA4FF;border:0;padding:0;margin-top:6px;font:600 11.5px/1 var(--body,system-ui);cursor:pointer;text-decoration:underline;text-underline-offset:3px}
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
  el.innerHTML = `<div class="tour-top"><span class="tour-step">Stop ${s.i + 1}/${STEPS.length}</span><span class="tour-tag ${tagClass}">${esc(step.tag)}</span><span class="tour-time" data-t>0:00</span><button class="tour-x" data-min title="Hide or show (H)" aria-label="Hide or show the demo bar">${s.min ? '+' : '−'}</button><button class="tour-x" data-end title="End the demo" aria-label="End the demo">×</button></div>
    <div class="tour-bar"><i style="width:${((s.i + 1) / STEPS.length) * 100}%"></i></div>
    <div class="tour-body"><div class="tour-title">${esc(step.title)}</div>
      ${s.say ? `<div class="tour-row"><b>Say</b><span>${esc(step.say)}</span></div>` : ''}
      <div class="tour-row"><b>Do</b><span>${esc(step.act)}</span></div>
      <div class="tour-due">Leave this stop by ${Math.floor(STEPS.slice(0, s.i + 1).reduce((n, x) => n + (x.secs || 0), 0) / 60)}:${pad(STEPS.slice(0, s.i + 1).reduce((n, x) => n + (x.secs || 0), 0) % 60)}<button type="button" class="tour-say" data-say style="margin:0 0 0 10px">${s.say ? 'Hide what to say' : 'Show what to say'}</button></div>
      ${off ? `<div class="tour-off">This page is not part of step ${s.i + 1}. <a data-return>Go to step ${s.i + 1}</a></div>` : ''}</div>
    <div class="tour-btns"><button class="tour-fill" data-fill hidden>Do it for me</button><button class="tour-back" data-back ${s.i === 0 ? 'disabled style="opacity:.35"' : ''}>Back</button><button class="tour-next" data-next>${s.i === STEPS.length - 1 ? 'Finish' : 'Next'}</button></div>`;
  document.body.appendChild(el);
  // on phones the bar sits at the top, so make room for it instead of covering the page header
  if (window.matchMedia('(max-width:720px)').matches) document.body.style.paddingTop = (el.offsetHeight + 14) + 'px';
  const due = STEPS.slice(0, s.i + 1).reduce((n, x) => n + (x.secs || 0), 0); const mmss = (n) => `${Math.floor(n / 60)}:${pad(n % 60)}`;
  const tick = () => { const st = read(); const t = el.querySelector('[data-t]'); if (!st || !t) return; const sec = Math.max(0, Math.floor((Date.now() - st.t0) / 1000)); t.textContent = `${mmss(sec)}/${mmss(BUDGET)}`; t.classList.toggle('late', sec > due); t.title = `Aim to leave this stop by ${mmss(due)}`; };
  tick(); clearInterval(render.h); render.h = setInterval(tick, 1000);
  // "Do it for me" appears when the page offers a shortcut
  const fill = el.querySelector('[data-fill]');
  const showFill = () => { if (!off && typeof window.wfDemoFill === 'function') fill.hidden = false; };
  showFill(); let tries = 0; const poll = setInterval(() => { showFill(); if (!fill.hidden || ++tries > 20) clearInterval(poll); }, 300);
  fill.onclick = async () => { fill.disabled = true; fill.textContent = 'Working...'; try { await window.wfDemoFill(); } catch (e) { console.warn('Demo shortcut failed', e); } if (document.body.contains(fill)) { fill.disabled = false; fill.textContent = 'Do it for me'; } };
  el.querySelector('[data-next]').onclick = () => go(s.i + 1);
  el.querySelector('[data-back]').onclick = () => { if (s.i > 0) go(s.i - 1); };
  el.querySelector('[data-end]').onclick = end;
  el.querySelector('[data-say]').onclick = () => { const st = read(); if (!st) return; st.say = !st.say; write(st); render(); };
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
    <h2>Guided demo</h2><p>${STEPS.length} stops, timed to fit a 5 minute demo. A small bar in the corner shows what to press and how you are doing on time. Press S to see what to say, and the right arrow key to go to the next stop.</p>
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
    else { const at = STEPS.findIndex((x) => x.page === 'dashboard.html'); write({ on: true, i: at, t0: Date.now() - STEPS.slice(0, at).reduce((n, x) => n + (x.secs || 0), 0) * 1000, min: false }); back.remove(); await go(at); }
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
    else if (e.key === 's' || e.key === 'S') { st.say = !st.say; write(st); render(); }
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
