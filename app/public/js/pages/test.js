// Live speed test page. Three states: ready, running, done.
// "Start test" runs the simulated (practice) test, so it never touches the real connection.
// "Use the real M-Lab test" is the opt-in for a real measurement.
import { boot, bind, $, $$, go, chipsHTML, Store, AI, summarize, esc, paintTheme } from '../shell.js';
import { FAIR, CHECK_DAYS, SCHEDULE, now, fmtDate, fmtTime } from '../engine.js';
import { runSpeedTest, ConsentError } from '../speedtest.js';
paintTheme(); // draw the sun or moon on this page's light and dark toggle

const { state, facts } = await boot({ need: 'plan' });
const plan = facts.plan;
const fairLine = facts.fairLine;
const R = 130, C = 2 * Math.PI * R;
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const LOCS = { normal: 'Anywhere', near: 'Next to the router', far: 'Far room' };
const PHASES = { locate: 'Finding a test server...', download: 'Measuring download...', upload: 'Measuring upload...', done: 'Done' };

const q = new URLSearchParams(location.search).get('location');
let where = q === 'near' || q === 'far' ? q : 'normal';
let cancelled = false;
let running = false;
let runToken = 0;        // each run gets a number, so an abandoned run can never save a result later
let current = null;      // the promise of the run in progress
let realFailed = false;  // the real test did not run in this visit, so a practice test took its place
const STALL_MS = 12000;  // a real test that shows no progress for this long gets the practice offer

// ---------- header, marks ----------
const regularCount = () => Store.get().tests.filter((t) => (t.location || 'normal') === 'normal').length;
const totalTests = CHECK_DAYS * SCHEDULE.length;
function drawTitle() {
  const n = regularCount() + (running || !$('#ready').hidden || !$('#paused').hidden ? 1 : 0);
  let html;
  if (where !== 'normal') html = `Router check · <b>${esc(LOCS[where])}</b>`;
  else html = n <= totalTests ? `Test <b>${n}</b> of ${totalTests}` : `Test <b>${n}</b>`;
  bind({ titleHtml: html });
}
bind({ lock: Store.isEncrypted() ? 'Encrypted' : 'Not encrypted', plan: plan.down, fair: fairLine });

// Ring marks from the plan's real values: the full circle is the plan speed, the fair line sits at fairLine / plan.
const fairFrac = fairLine / plan.down;
const fairDeg = -90 + 360 * fairFrac;
const rad = (fairDeg * Math.PI) / 180;
$('#fairMark').setAttribute('transform', `rotate(${fairDeg.toFixed(2)} 180 180)`);
const ft = $('#fairText');
ft.setAttribute('x', (180 + 168 * Math.cos(rad)).toFixed(1));
ft.setAttribute('y', (180 + 168 * Math.sin(rad) + 4).toFixed(1));
ft.textContent = fairLine;
$('#planText').textContent = plan.down;

// ---------- ring ----------
const arcs = [$('#arc'), $('#arcGlow')];
const box = $('#ringbox');
function ring(mode, mbps = 0, color) {
  box.classList.toggle('locating', mode === 'locate');
  box.classList.toggle('running', mode === 'locate' || mode === 'work');
  if (mode === 'empty') { arcs.forEach((a) => a.setAttribute('visibility', 'hidden')); return; }
  const L = Math.max(0, Math.min(1, mbps / plan.down)) * C;
  let dash;
  if (mode === 'locate') dash = `110 ${C - 110}`;
  else if (mode === 'solid') dash = `${L.toFixed(1)} ${C.toFixed(1)}`;
  else {
    // working arc: broken into up to four round-capped pieces
    const gap = 30, n = Math.max(1, Math.min(4, Math.floor(L / 80)));
    const seg = (L - (n - 1) * gap) / n;
    const parts = [];
    for (let i = 0; i < n; i++) parts.push(seg.toFixed(1), i === n - 1 ? (C - L + 1).toFixed(1) : gap);
    dash = parts.join(' ');
  }
  arcs.forEach((a) => { a.setAttribute('stroke-dasharray', dash); a.setAttribute('visibility', L < 1 && mode !== 'locate' ? 'hidden' : 'visible'); });
  $('#arc').setAttribute('stroke', color || '#3D5BFF');
  $('#arcGlow').setAttribute('stroke', color || '#2747F5');
}

// ---------- slots ----------
const numHTML = (v, unit) => `<div class="num v">${Math.round(v)}<span class="unit" style="font-size:11px">${unit}</span></div>`;
const waitHTML = (word) => `<div class="v wait">${word}</div>`;
function slot(id, valueHtml, statusHtml, cls = '') {
  $('#v' + id).innerHTML = valueHtml;
  const s = $('#s' + id); s.className = 's ' + cls; s.innerHTML = statusHtml;
}
function slotsIdle() {
  slot('Down', waitHTML('not run yet'), `Plan: ${plan.down} Mbps`);
  slot('Up', waitHTML('not run yet'), `Plan: ${plan.up} Mbps`);
  slot('Lat', waitHTML('not run yet'), plan.latency != null ? `Plan: ${plan.latency} ms` : '');
}

// ---------- ready ----------
function drawWhere() {
  $$('[data-loc]').forEach((c) => { const on = c.dataset.loc === where; c.classList.toggle('on', on); c.setAttribute('aria-checked', on ? 'true' : 'false'); });
  drawTitle();
}
$$('[data-loc]').forEach((c) => { c.onclick = () => { where = c.dataset.loc; history.replaceState(null, '', where === 'normal' ? 'test.html' : `test.html?location=${where}`); drawWhere(); }; });

const isPaused = () => { const p = Store.get().settings && Store.get().settings.pausedUntil; return !!p && new Date(p) > now(Store.get()); };
function showReady() {
  ring('empty');
  $('#big').textContent = plan.down; $('#big').classList.add('idle');
  $('#cap').textContent = 'Mbps on your plan';
  $('#ringsvg').setAttribute('aria-label', `Ready to test. Your plan is ${plan.down} Mbps and the fair line is ${fairLine} Mbps.`);
  $('#statusWord').textContent = 'Ready to test';
  slotsIdle();
  const paused = isPaused();
  $('#paused').hidden = !paused; $('#ready').hidden = paused;
  if (paused) {
    const until = Store.get().settings.pausedUntil;
    $('#statusWord').textContent = 'Tests are paused';
    bind({ pausedText: `Tests are paused until ${fmtDate(until)} at ${fmtTime(until)}. Resume to run a test now.` });
  }
  drawWhere();
}
$('#resume').onclick = async () => { await Store.update((s) => { s.settings = { ...(s.settings || {}), pausedUntil: null }; }); showReady(); };

// ---------- running ----------
// The small line under the result. It is only shown for a real M-Lab test.
const setFoot = (t) => { $('#foot').textContent = t; $('#foot').hidden = !t; };
// The notice for a real test that failed, stalled, or fell back. One button: run the practice test.
function alertReal(title, text, offer = true) {
  $('#fallbackTitle').textContent = title; $('#fallbackText').textContent = text;
  $('#usePractice').hidden = !offer;
  const box = $('#fallback'); box.hidden = false;
  if (offer) box.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
$('#usePractice').onclick = () => { running = false; current = run(true); };

function run(practice) { current = runOnce(practice); return current; }
async function runOnce(practice) {
  if (running || isPaused()) return;
  running = true; cancelled = false;
  const token = ++runToken;
  const stale = () => cancelled || token !== runToken;
  let phase = 'locate', fellBack = false, lastDown = 0;
  $('#fallback').hidden = true;
  // Watchdog for the real test only: no progress for a while means the network is probably blocking it.
  let dog = null;
  const pet = () => {
    clearTimeout(dog);
    if (!practice) dog = setTimeout(() => { if (!stale() && running) { realFailed = true; alertReal('The real test is not getting through', 'This network may be blocking it. Nothing has been measured yet. You can keep waiting, or switch now.'); } }, STALL_MS);
  };
  pet();
  $('#ready').hidden = true; $('#cancel').hidden = false; $('#livedot').hidden = false;
  $('#big').classList.remove('idle'); $('#big').textContent = '0';
  $('#cap').textContent = 'Mbps download';
  $('#statusWord').textContent = PHASES.locate;
  setFoot(practice ? '' : "Runs on M-Lab's open test. M-Lab publishes the result with your IP address.");
  ring('locate');
  slot('Down', waitHTML('waiting'), 'Up next');
  slot('Up', waitHTML('waiting'), 'Up next');
  slot('Lat', waitHTML('waiting'), 'At the end');
  drawTitle();
  const cb = {
    onPhase(p) {
      if (stale()) return;
      pet(); if (!fellBack) $('#fallback').hidden = true;
      phase = p;
      $('#statusWord').textContent = PHASES[p] || '';
      if (p === 'download') { $('#cap').textContent = 'Mbps download'; }
      if (p === 'upload') {
        slot('Down', numHTML(lastDown, 'Mbps'), `${CHECK}Done`, 'done');
        $('#big').textContent = '0'; $('#cap').textContent = 'Mbps upload';
        slot('Up', numHTML(0, 'Mbps'), '<span class="dot"></span>Live', 'now');
      }
    },
    onDown(v) {
      if (stale()) return;
      pet(); if (!practice && !fellBack) realFailed = false;
      lastDown = v;
      $('#big').textContent = Math.round(v);
      ring('work', v);
      slot('Down', numHTML(v, 'Mbps'), '<span class="dot"></span>Live', 'now');
      $('#ringsvg').setAttribute('aria-label', `${Math.round(v)} Mbps download so far, out of a ${plan.down} Mbps plan`);
    },
    onUp(v) {
      if (stale()) return;
      pet();
      $('#big').textContent = Math.round(v);
      slot('Up', numHTML(v, 'Mbps'), '<span class="dot"></span>Live', 'now');
    },
    onServer() {},
    onFallback() {
      if (stale()) return;
      fellBack = true; realFailed = true;
      alertReal('The real test could not run here', 'A simulated test is running in its place.', false);
      setFoot('');
    },
  };
  let r;
  try {
    // Real path: no practice flag, so the wrapper runs the M-Lab test. Practice path: { practice: true }.
    // A failed real test stops here and says so, instead of quietly becoming a practice test.
    r = practice ? await runSpeedTest(cb, { practice: true, location: where }) : await runSpeedTest(cb, { location: where, noFallback: true });
  } catch (e) {
    clearTimeout(dog);
    if (stale()) return;
    if (e instanceof ConsentError) { go('onboarding-consent.html'); return; }
    running = false;
    $('#cancel').hidden = true; $('#livedot').hidden = true;
    showReady();
    $('#statusWord').textContent = practice ? 'The test could not run. Try again.' : 'The real test could not run';
    if (!practice) { realFailed = true; alertReal('The real test could not run here', 'This network may be blocking M-Lab. Nothing was measured and nothing was saved.'); }
    return;
  }
  clearTimeout(dog);
  if (stale()) return;
  await finish(r, fellBack || (practice && realFailed));
}

$('#start').onclick = () => run(true);
$('#practice').onclick = () => run(false);
// The guided demo's "Do it for me": always the practice test, never the real one. Waits until it has finished.
// Safe to call twice: a run in progress is awaited, and a finished test is not run again.
window.wfDemoFill = async () => {
  if (!$('#actions').hidden) return;
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));
  // A real test that is stuck: take the practice offer. Any other run in progress is simply awaited.
  if (running) { if (!$('#fallback').hidden && !$('#usePractice').hidden) $('#usePractice').click(); await current; return; }
  if (isPaused()) { $('#resume').click(); await pause(600); }
  await pause(500);
  $('#start').click();
  await current;
};
// Cancel leaves the page. Nothing is saved, because saving only happens in finish().
$('#cancel').onclick = () => { cancelled = true; go('dashboard.html'); };

// ---------- done ----------
async function finish(r, fellBack) {
  await Store.addTest({ down: r.down, up: r.up, latency: r.latency, source: r.source, server: r.server, location: r.location });
  running = false;
  const st = Store.get();
  const saved = st.tests[st.tests.length - 1];
  const f = summarize(st);
  const ok = saved.down >= f.fairLine;
  const pct = Math.round((saved.down / plan.down) * 100);
  const color = ok ? 'var(--good)' : 'var(--bad)';

  ring('solid', saved.down, color);
  $('#glow').style.setProperty('--glowc', ok ? 'rgba(61,220,151,.22)' : 'rgba(255,107,107,.26)');
  $('#big').textContent = saved.down; $('#cap').textContent = 'Mbps download';
  $('#ringsvg').setAttribute('aria-label', `${saved.down} Mbps download, ${pct}% of a ${plan.down} Mbps plan`);
  $('#livedot').hidden = true; $('#cancel').hidden = true;
  // The result is the headline of the finished state: the share of the plan this test delivered.
  $('#statusWord').textContent = `${pct}% of your plan`;
  $('#status').classList.add(ok ? 'good' : 'bad');

  const place = saved.location === 'near' ? ' It was a router check, taken next to the router.' : saved.location === 'far' ? ' It was a router check, taken in a far room.' : '';
  const r$ = $('#result'); r$.hidden = false;
  r$.innerHTML = `This test measured <b>${saved.down} Mbps</b> on a ${plan.down} Mbps plan, which is <b>${ok ? 'at or above' : 'below'} the fair line</b> of ${f.fairLine} Mbps.${esc(place)}`;
  const isPractice = saved.source === 'practice';
  if (fellBack && isPractice) alertReal('The real test could not run here', 'This result is simulated.', false);
  else $('#fallback').hidden = true;
  setFoot(isPractice ? '' : `Measured with M-Lab's open test${saved.server ? ', server in ' + saved.server : ''}. M-Lab publishes this result and your IP address.`);

  slot('Down', numHTML(saved.down, 'Mbps'), `${ok ? CHECK : ''}${pct}% of plan`, ok ? 'done' : 'bad');
  if (saved.up != null) { const upOk = saved.up >= plan.up * FAIR; slot('Up', numHTML(saved.up, 'Mbps'), `${upOk ? CHECK + 'On plan' : 'Below plan'}`, upOk ? 'done' : 'bad'); }
  else slot('Up', waitHTML('no result'), 'Not measured');
  if (saved.latency != null) { const latOk = saved.latency <= 50; slot('Lat', numHTML(saved.latency, 'ms'), `${latOk ? CHECK + 'Good' : 'Slow'}`, latOk ? 'done' : 'bad'); }
  else slot('Lat', waitHTML('no result'), 'Not measured');

  // Proof AI live read: computed on this device from the saved test and the refreshed facts
  const read = AI.liveRead(saved, f);
  const chips = read.chips.slice();
  if (isPractice) chips.push('Simulated');
  if (saved.location !== 'normal') chips.push(LOCS[saved.location]);
  bind({ readHtml: AI.html(read.text), readChipsHtml: chipsHTML(chips) });
  $('#read').hidden = false;

  // Router check prompt, only while there is no near and far pair
  if (!f.router.pairs) {
    const nearN = st.tests.filter((t) => t.location === 'near').length;
    const next = nearN > 0 ? 'far' : 'near';
    bind({ routerText: next === 'far' ? 'You have a test next to the router. Now run one in a far room to finish the router check.' : 'No router check yet. Run one test next to the router and one in a far room so Proof AI can tell Wi-Fi from your provider.' });
    $('#addRouter').onclick = () => go(`test.html?location=${next}`);
    $('#routerPrompt').hidden = false;
  }
  $('#actions').hidden = false;
  $('#again').onclick = () => go('test.html');
  drawTitle();
}

showReady();
