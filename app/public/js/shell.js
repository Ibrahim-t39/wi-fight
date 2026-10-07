// Wi-Fight shell: shared by every app page. Loads the encrypted store, guards the page,
// wires navigation, and offers small render helpers so every page draws numbers the same way.
import { Store } from './store.js';
import { summarize } from './engine.js';
import { AI } from './ai.js';
import { modelName } from './models.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
export const esc = AI.esc;
// Leave softly: the page fades out (ds.css, .wf-leaving) just before the next one loads and fades in.
export const go = (page) => { document.documentElement.classList.add('wf-leaving'); setTimeout(() => { location.href = page; }, 160); };
// coming back with the browser's Back button must not show a faded-out page
addEventListener('pageshow', () => document.documentElement.classList.remove('wf-leaving'));

const ROUTES = { 'Dashboard': 'dashboard.html', 'Home': 'dashboard.html', 'History': 'history.html', 'Report': 'report.html', 'Plans': 'plans.html', 'Ask Proof AI': 'chat.html', 'Proof AI': 'chat.html', 'Diagnosis': 'diagnosis.html', 'Privacy & data': 'privacy.html', 'Verdict': 'verdict.html', 'About': 'about.html' };
const ICON = {
  verdict: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4.5 6v6c0 4.5 3.2 7.6 7.5 9 4.3-1.4 7.5-4.5 7.5-9V6z"/><path d="m9 12 2 2 4-4"/></svg>',
  about: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 8l-4 4 4 4M6 12h10"/></svg>',
  flask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6L4.5 19a1.500 1.500 0 0 0 1.300 2h12.400a1.500 1.500 0 0 0 1.300-2L14 9V3"/><path d="M7.500 14h9"/></svg>',
};
const here = () => (location.pathname.split('/').pop() || 'index.html');

/**
 * Start a page. Returns { state, facts, ai } where ai = { live:boolean }.
 * need: 'none' (public), 'auth' (consent and sign-in), 'plan' (also a plan).
 */
export async function boot({ need = 'plan' } = {}) {
  const state = await Store.load();
  if (need !== 'none') {
    if (!state.consent || !state.consent.mlab) { go('onboarding-consent.html'); return new Promise(() => {}); }
    if (!state.user) { go('onboarding-signin.html'); return new Promise(() => {}); }
    if (need === 'plan' && !state.plan) { go('onboarding-plan.html'); return new Promise(() => {}); }
  }
  const facts = summarize(state);
  const ai = await AI.status();
  wireNav(state, facts, ai);
  $$('.sample, [data-sample]').forEach((el) => { el.hidden = !state.sample; el.style.display = state.sample ? '' : 'none'; });
  // Proof AI switched off: every Proof AI block shows an off state instead of its content.
  if (state.settings && state.settings.aiAnalyze === false) {
    document.documentElement.classList.add('ai-off');
    document.addEventListener('click', (e) => { if (e.target.closest('.ai-card') && !e.target.closest('[data-keep]')) go('privacy.html'); });
  }
  document.documentElement.dataset.ready = '1';
  return { state, facts, ai };
}

function wireNav(state, facts, ai) {
  const page = here();
  // sidebar
  const side = $('.sidebar');
  if (side) {
    const acct = $$('.navitem', side).find((a) => a.textContent.trim() === 'Privacy & data');
    const dash = $$('.navitem', side).find((a) => a.textContent.trim() === 'Dashboard');
    if (dash && facts.complete && !$$('.navitem', side).some((a) => a.textContent.trim() === 'Verdict')) dash.insertAdjacentHTML('afterend', `<a class="navitem">${ICON.verdict}<span>Verdict</span></a>`);
    if (acct && !$$('.navitem', side).some((a) => a.textContent.trim() === 'About')) acct.insertAdjacentHTML('afterend', `<a class="navitem">${ICON.about}<span>About</span></a>`);
    $$('.navitem', side).forEach((a) => { const r = ROUTES[a.textContent.trim()]; if (r) { a.href = r; a.classList.toggle('on', r === page); } });
    const brand = $('.brand', side); if (brand) { brand.style.cursor = 'pointer'; brand.onclick = () => go('dashboard.html'); }
    const foot = $('.sidefoot', side);
    if (foot) foot.innerHTML = `<span class="badge lock" style="align-self:flex-start"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2.500"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>${Store.isEncrypted() ? 'Encrypted on this device' : 'Stored on this device'}</span>
      <div class="small" style="color:var(--ink-2)">Nothing is sent without your approval.</div>
      <div class="small" data-ai-mode>${ai.provider === 'local' ? 'Proof AI: ' + esc(modelName(ai.model)) + ', on this computer' : ai.live ? 'Proof AI: ' + esc(modelName(ai.model)) + (ai.provider === 'groq' ? ' on Groq' : '') : 'Proof AI: offline mode'}</div>
      <button class="btn ghost sm" data-demo style="align-self:stretch">${ICON.flask}Demo</button>
      <button class="btn ghost sm" data-logout style="align-self:stretch">${ICON.logout}Log out</button>`;
  }
  // phone tab bar: Home, History, [Run test], Proof AI, More
  const bar = $('.tabbar');
  if (bar) {
    const tabs = $$('.tab', bar);
    const last = tabs[tabs.length - 1];
    if (last) last.innerHTML = `${ICON.more}More`;
    tabs.forEach((t) => { const name = t.textContent.trim(); t.style.cursor = 'pointer'; if (name === 'More') { t.onclick = openMore; t.classList.toggle('on', !['dashboard.html', 'history.html', 'chat.html'].includes(page)); } else { const r = ROUTES[name]; t.onclick = () => go(r); t.classList.toggle('on', r === page); } });
    const fab = $('.fab', bar); if (fab) { fab.style.cursor = 'pointer'; fab.setAttribute('role', 'button'); fab.setAttribute('aria-label', 'Run a test'); fab.onclick = () => go('test.html'); }
  }
  document.addEventListener('click', (e) => {
    const h = e.target.closest('[data-href]'); if (h) { e.preventDefault(); go(h.dataset.href); return; }
    if (e.target.closest('[data-demo]')) { e.preventDefault(); openDemo(); return; }
    if (e.target.closest('[data-logout]')) { e.preventDefault(); openLogout(); }
  });
}

function sheet(html) {
  closeSheet();
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet-back"></div><div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(wrap);
  $('.sheet-back', wrap).onclick = closeSheet;
  return wrap;
}
export function closeSheet() { const w = $('.sheet-wrap'); if (w) w.remove(); }

function openMore() {
  const facts = summarize(Store.get());
  const items = [['Report', 'report.html'], ['Diagnosis', 'diagnosis.html'], ['Plans', 'plans.html'], ...(facts.complete ? [['Verdict', 'verdict.html']] : []), ['Privacy & data', 'privacy.html'], ['About', 'about.html']];
  const w = sheet(`<div class="h3" style="margin-bottom:8px">More</div>${items.map(([n, r]) => `<a class="lrow" href="${r}" style="text-decoration:none;color:inherit"><span class="grow" style="font-weight:600">${n}</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></a>`).join('')}<button class="btn ghost sm" data-demo style="margin-top:14px;width:100%">${ICON.flask}Demo data</button><button class="btn ghost sm" data-logout style="margin-top:8px;width:100%">${ICON.logout}Log out</button>`);
  return w;
}

/** Log out. This prototype keeps everything in this browser, so logging out clears it all, including the
 *  encryption key, and returns to the first page. That also makes it the way to restart a demo. */
export function openLogout() {
  closeSheet();
  const u = (Store.get() && Store.get().user) || {};
  const who = u.email ? `You are signed in as ${esc(u.email)}. ` : '';
  const w = sheet(`<div class="h3">Log out?</div>
    <p class="small" style="margin:6px 0 14px;color:var(--ink-2)">${who}Wi-Fight keeps your data only in this browser. Logging out deletes it here, with its encryption key, and takes you back to the start.</p>
    <div class="col gap8">
      <button class="btn primary" data-logout-yes>Log out and start over</button>
      <button class="btn ghost" data-logout-no>Stay signed in</button>
    </div>`);
  $('[data-logout-no]', w).onclick = closeSheet;
  $('[data-logout-yes]', w).onclick = async () => {
    await Store.wipe();
    try { localStorage.removeItem('wf.tour.v1'); sessionStorage.clear(); } catch { /* storage may be blocked */ }
    location.href = 'index.html';
  };
}

/** Demo data controls: load the labelled sample two weeks, or clear back to an empty check. */
/** Fast-forward for demos. Shows the days ticking by, then loads the labelled sample data for that many days.
 *  It keeps who is signed in and what they agreed to. Nothing is measured: the sample is marked on every page. */
export async function simulate(days = 14) {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:120;background:#070A12;color:#F5F7FB;display:grid;place-items:center;text-align:center;padding:24px;font-family:var(--body,system-ui)';
  ov.innerHTML = `<div style="max-width:520px;width:100%"><div style="font:600 12px/1 var(--body,system-ui);letter-spacing:.12em;text-transform:uppercase;color:#8FA4FF">Simulating a ${days === 14 ? 'two-week' : days + '-day'} check</div>
    <div style="font:700 76px/1 var(--display,system-ui);letter-spacing:-.03em;margin:18px 0 6px">Day <span data-d>1</span></div>
    <div style="font:500 16px/1.4 var(--body,system-ui);color:#AEB5C6"><span data-n>4</span> speed tests recorded</div>
    <div style="height:8px;border-radius:99px;background:#1B2233;margin:26px 0 18px;overflow:hidden"><i data-b style="display:block;height:100%;width:0;background:#2747F5;border-radius:99px;transition:width .16s linear"></i></div>
    <div style="font:500 13.5px/1.45 var(--body,system-ui);color:#7C859B">A real check runs 4 tests a day for 14 days. This skips the wait.</div></div>`;
  document.body.appendChild(ov);
  const st = Store.get() || {};
  const keepUser = st.user && st.user.method !== 'sample' ? { ...st.user } : null;
  const keepConsent = st.consent ? { ...st.consent } : null;
  const load = Store.loadSample(days).then(() => (keepUser || keepConsent ? Store.update((x) => { if (keepUser) x.user = keepUser; if (keepConsent) x.consent = keepConsent; }) : null));
  for (let d = 1; d <= days; d++) {
    ov.querySelector('[data-d]').textContent = d; ov.querySelector('[data-n]').textContent = d * 4; ov.querySelector('[data-b]').style.width = `${(d / days) * 100}%`;
    await new Promise((r) => setTimeout(r, 170));
  }
  await load; await new Promise((r) => setTimeout(r, 450));
  location.href = days >= 14 ? 'verdict.html' : 'dashboard.html';
}
document.addEventListener('click', (e) => { const b = e.target.closest('[data-simulate]'); if (b) { e.preventDefault(); simulate(Number(b.dataset.simulate) || 14); } });

export function openDemo() {
  const w = sheet(`<div class="h3">Demo data</div>
    <p class="small" style="margin:6px 0 14px;color:var(--ink-2)">A real check takes two weeks. Skip ahead so every page has results to show.</p>
    <div class="col gap8">
      <button class="btn primary" data-tour-start>Start the guided demo</button>
      <button class="btn" data-simulate="9">Simulate: skip to day 9</button>
      <button class="btn" data-simulate="14">Simulate the full two weeks</button>
      <button class="btn ghost" data-s="0">Clear tests and start fresh</button>
    </div>`);
  $$('[data-s]', w).forEach((b) => { b.onclick = async () => { const n = Number(b.dataset.s); if (n) await Store.loadSample(n); else await Store.clearTests(); location.href = n === 14 ? 'verdict.html' : 'dashboard.html'; }; });
}

export function toast(msg) {
  let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2600);
}

/** Fill every [data-b="key"] inside root with map[key] (text). Keys ending in "Html" are set as HTML. */
export function bind(map, root = document) {
  $$('[data-b]', root).forEach((el) => { const k = el.dataset.b; if (!(k in map) || map[k] == null) return; if (k.endsWith('Html')) el.innerHTML = map[k]; else el.textContent = map[k]; });
}

export const badge = (kind, word) => `<span class="badge ${kind}"><span class="dot"></span>${esc(word)}</span>`;
export const statusKind = (s) => (s === 'on' || s === 'good' ? 'good' : s === 'below' || s === 'slow' ? 'bad' : 'warn');

/** Score ring: sets the progress arc on a <circle r="84"> to pct (0 to 100) and its colour to the status. */
export function setRing(circle, pct, status) {
  const r = Number(circle.getAttribute('r')) || 84, c = 2 * Math.PI * r;
  circle.setAttribute('stroke-dasharray', `${(Math.max(0, Math.min(100, pct)) / 100) * c} ${c}`);
  circle.setAttribute('stroke', status === 'below' ? 'var(--bad)' : 'var(--good)');
}

/** Daily bars with the plan as a ghost bar and the fair line across. opts.days: array from facts.days. */
export function barsHTML(facts, days, { values = true } = {}) {
  const max = facts.plan.down;
  const bars = days.map((d) => d.median == null
    ? '<div class="bar"><div class="ghost"></div></div>'
    : `<div class="bar${d.low ? ' low' : ''}" title="Day ${d.day}: ${d.median} Mbps"><div class="ghost"></div><div class="fill" style="height:${Math.min(100, (d.median / max) * 100).toFixed(1)}%">${values ? `<div class="val">${d.median}</div>` : ''}</div></div>`).join('');
  return `<div class="threshold" style="bottom:80%"><span>Fair line ${facts.fairLine}</span></div>${bars}`;
}
export const xlabelsHTML = (days, mode = 'weekday') => days.map((d) => `<span>${mode === 'day' ? d.day : d.weekday}</span>`).join('');

/** The 14 day dots. */
export const daysHTML = (facts) => facts.days.map((d) => `<div class="day ${d.median == null ? (d.today ? 'today' : '') : d.low ? 'low' : 'ok'}${d.today && d.median != null ? ' today-done' : ''}" title="Day ${d.day}${d.median != null ? ': ' + d.median + ' Mbps' : ''}">${d.day}</div>`).join('');

export const chipsHTML = (list) => list.map((c) => `<span class="evidence">${esc(c)}</span>`).join('');
export const reasonsHTML = (list) => list.map((r) => `<div><span><b>${esc(r.title)}</b> ${AI.html(r.detail)}</span></div>`).join('');

/** Download a text file to the user's device. */
export function download(name, text, type = 'application/json') {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/** SHA-256 of a string, hex. Used to sign the report so any change is detectable. */
export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export { Store, AI, summarize };

/**
 * "Broadband Facts" card: what the provider's label promises beside what the user measured.
 * Modeled on the layout of the FCC broadband label. Returns HTML. Works before any test (shows dashes).
 */
export function labelHTML(facts) {
  const p = facts.plan; if (!p) return '';
  const got = facts.headline ? facts.headline.mbps : null;
  const row = (name, promised, measured, unit, ok) => `<div class="bf-row"><span class="bf-k">${name}</span><span class="bf-p">${promised == null ? 'Not published' : promised + (unit ? ' ' + unit : '')}</span><span class="bf-m ${measured == null ? '' : ok ? 'ok' : 'low'}">${measured == null ? 'Not measured yet' : measured + (unit ? ' ' + unit : '')}${measured == null ? '' : `<em>${ok ? 'On plan' : 'Below'}</em>`}</span></div>`;
  return `<div class="bf" role="table" aria-label="Broadband Facts: promised and measured">
    <div class="bf-title">Broadband Facts</div>
    <div class="bf-sub">${esc(p.provider || '')}<b>${esc(p.name)}</b></div>
    <div class="bf-price"><span>Monthly price</span><b>$${Number(p.price).toFixed(2)}</b></div>
    <div class="bf-head"><span>Speeds</span><span>Label says</span><span>You got</span></div>
    ${row('Typical download', p.down, got, 'Mbps', got != null && got >= facts.fairLine)}
    ${row('Typical upload', p.up, facts.upload ? facts.upload.mbps : null, 'Mbps', facts.upload && facts.upload.status === 'on')}
    ${row('Typical response time', p.latency, facts.latency ? facts.latency.ms : null, 'ms', facts.latency && facts.latency.status === 'good')}
    <div class="bf-foot">Left column: what the provider's label lists for this plan. Right column: your measured median${facts.headline ? ` over ${esc(facts.headline.basis)}` : ''}. Fair line: ${facts.fairLine} Mbps, 80% of the label.</div>
  </div>`;
}
