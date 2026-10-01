// Live speed test page. Three states: ready, running, done.
// "Start test" runs the real M-Lab test. "Practice test" runs the labelled practice test.
import { boot, bind, $, $$, go, chipsHTML, Store, AI, summarize, esc } from '../shell.js';
import { FAIR, CHECK_DAYS, SCHEDULE, now, fmtDate, fmtTime } from '../engine.js';
import { runSpeedTest, ConsentError } from '../speedtest.js';

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
async function run(practice) {
  if (running || isPaused()) return;
  running = true; cancelled = false;
  let phase = 'locate', fellBack = false, lastDown = 0;
  $('#ready').hidden = true; $('#cancel').hidden = false; $('#livedot').hidden = false;
  $('#big').classList.remove('idle'); $('#big').textContent = '0';
  $('#cap').textContent = 'Mbps download';
  $('#statusWord').textContent = PHASES.locate;
  $('#foot').textContent = practice ? 'Practice test. Nothing is sent to M-Lab and nothing is published.' : "Runs on M-Lab's open test. This test's result and IP address are published by M-Lab.";
  ring('locate');
  slot('Down', waitHTML('waiting'), 'Up next');
  slot('Up', waitHTML('waiting'), 'Up next');
  slot('Lat', waitHTML('waiting'), 'At the end');
  drawTitle();
  const cb = {
    onPhase(p) {
      if (cancelled) return;
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
      if (cancelled) return;
      lastDown = v;
      $('#big').textContent = Math.round(v);
      ring('work', v);
      slot('Down', numHTML(v, 'Mbps'), '<span class="dot"></span>Live', 'now');
      $('#ringsvg').setAttribute('aria-label', `${Math.round(v)} Mbps download so far, out of a ${plan.down} Mbps plan`);
    },
    onUp(v) {
      if (cancelled) return;
      $('#big').textContent = Math.round(v);
      slot('Up', numHTML(v, 'Mbps'), '<span class="dot"></span>Live', 'now');
    },
    onServer() {},
    onFallback() {
      fellBack = true;
      $('#fallback').hidden = false;
      $('#foot').textContent = 'Practice test. Nothing is sent to M-Lab and nothing is published.';
    },
  };
  let r;
  try {
    // Real path: no practice flag, so the wrapper runs the M-Lab test. Practice path: { practice: true }.
    r = practice ? await runSpeedTest(cb, { practice: true, location: where }) : await runSpeedTest(cb, { location: where });
  } catch (e) {
    if (e instanceof ConsentError) { go('onboarding-consent.html'); return; }
    running = false;
    $('#cancel').hidden = true; $('#livedot').hidden = true;
    showReady();
    $('#statusWord').textContent = 'The test could not run. Try again.';
    return;
  }
  if (cancelled) return;
  await finish(r, fellBack);
}

$('#start').onclick = () => run(false);
$('#practice').onclick = () => run(true);
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
  $('#glow').style.background = `radial-gradient(520px 420px at 50% 300px,${ok ? 'rgba(61,220,151,.22)' : 'rgba(255,107,107,.26)'},transparent 72%)`;
  $('#big').textContent = saved.down; $('#cap').textContent = 'Mbps download';
  $('#ringsvg').setAttribute('aria-label', `${saved.down} Mbps download, ${pct}% of a ${plan.down} Mbps plan`);
  $('#livedot').hidden = true; $('#cancel').hidden = true;
  $('#statusWord').textContent = PHASES.done;
  $('#status').classList.add(ok ? 'good' : 'bad');

  const place = saved.location === 'near' ? ' Router check: next to the router.' : saved.location === 'far' ? ' Router check: far room.' : '';
  const r$ = $('#result'); r$.hidden = false;
  r$.innerHTML = `<b>${saved.down} Mbps</b> is <b>${pct}% of your plan</b>, ${ok ? 'at or above' : 'below'} the fair line of ${f.fairLine} Mbps.${esc(place)}`;
  const isPractice = saved.source === 'practice';
  $('#practiceLabel').hidden = !isPractice;
  $('#fallback').hidden = !fellBack;
  $('#foot').textContent = isPractice ? 'Practice result saved on this device and marked as practice. Nothing was sent to M-Lab.' : `Measured with M-Lab's open test${saved.server ? ', server in ' + saved.server : ''}. M-Lab publishes this result and your IP address.`;

  slot('Down', numHTML(saved.down, 'Mbps'), `${ok ? CHECK : ''}${pct}% of plan`, ok ? 'done' : 'bad');
  if (saved.up != null) { const upOk = saved.up >= plan.up * FAIR; slot('Up', numHTML(saved.up, 'Mbps'), `${upOk ? CHECK + 'On plan' : 'Below plan'}`, upOk ? 'done' : 'bad'); }
  else slot('Up', waitHTML('no result'), 'Not measured');
  if (saved.latency != null) { const latOk = saved.latency <= 50; slot('Lat', numHTML(saved.latency, 'ms'), `${latOk ? CHECK + 'Good' : 'Slow'}`, latOk ? 'done' : 'bad'); }
  else slot('Lat', waitHTML('no result'), 'Not measured');

  // Proof AI live read: computed on this device from the saved test and the refreshed facts
  const read = AI.liveRead(saved, f);
  const chips = read.chips.slice();
  if (isPractice) chips.push('Practice test');
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
