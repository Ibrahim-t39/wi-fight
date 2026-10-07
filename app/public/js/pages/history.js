// History page. Every number comes from facts (engine.js) or the stored tests.
import { boot, bind, $, $$, barsHTML, chipsHTML, badge, esc } from '../shell.js';
import { now, dayKey, fmtTime, fmtWeekday } from '../engine.js';

const { state, facts } = await boot({ need: 'plan' });
const STAR = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.900 5.600a3 3 0 0 0 1.900 1.900L21.400 11.400l-5.600 1.900a3 3 0 0 0-1.900 1.900L12 20.800l-1.900-5.600a3 3 0 0 0-1.900-1.900L2.600 11.400l5.600-1.900a3 3 0 0 0 1.900-1.900z"/></svg>';
const PULSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h4l3-8 4 16 3-8h6"/></svg>';
const IGN = `<span class="badge ign">${STAR}Ignored: one-off</span>`;
const plural = (n, one, many) => (n === 1 ? one : many);
const list = (a) => (a.length <= 1 ? a.join('') : a.length === 2 ? a.join(' and ') : a.slice(0, -1).join(', ') + ', and ' + a[a.length - 1]);

if (!facts.headline) {
  $('#empty').hidden = false; $('#grid').hidden = true;
  $$('[data-range]').forEach((c) => { c.hidden = true; });
  bind({ eyebrow: 'Your two-week check has not started' });
} else {
  const fair = facts.fairLine;
  bind({
    eyebrow: `Day ${facts.dayNumber} of ${facts.totalDays} · ${facts.testsCount} ${plural(facts.testsCount, 'test', 'tests')} so far`,
    planLegend: `Your ${facts.plan.down} Mbps plan`,
  });

  // ----- headline -----
  const dayName = (d) => (d.today ? 'today' : `Day ${d.day}`);
  const cls = (d) => (d.low ? 'hl-bad' : 'hl-good');
  const B = facts.best, W = facts.worst;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  bind({
    headlineHtml: B.day === W.day
      ? `You have one day of results so far: <span class="${cls(B)}">${cap(dayName(B))}</span> at <span class="${cls(B)}">${B.median} Mbps</span>.`
      : `Your best day was <span class="${cls(B)}">${dayName(B)}</span> at <span class="${cls(B)}">${B.median} Mbps</span>, and your worst was <span class="${cls(W)}">${dayName(W)}</span> at <span class="${cls(W)}">${W.median} Mbps</span>.`,
  });

  // ----- chart -----
  const draw = (n) => {
    const shown = facts.days.filter((d) => !d.future);
    const days = n === 14 ? facts.days : shown.slice(-7);
    $('#bars').innerHTML = barsHTML(facts, days, { values: true });
    $('#xlabels').innerHTML = days.map((d) => `<span${d.today ? ' class="today"' : ''}><b>${d.day}</b><em>${d.today ? 'Today' : d.weekday}</em></span>`).join('');
    const col = (day) => days.findIndex((d) => d.day === day) + 1; // 0 when the day is not in view
    let marks = days.map((d, i) => (d.hadIgnored ? `<i class="aidot" style="grid-column:${i + 1}" title="One-off dip ignored on day ${d.day}"></i>` : '')).join('');
    if (facts.streak.flagged) {
      const cols = facts.streak.days.map(col).filter(Boolean);
      if (cols.length) marks += `<div class="bracket" style="grid-column:${cols[0]}/${cols[cols.length - 1] + 1}"><span>${facts.streak.len} days in a row</span></div>`;
    }
    const m = $('#marks'); m.style.gridTemplateColumns = `repeat(${days.length},minmax(0,1fr))`; m.innerHTML = marks;
    $$('[data-range]').forEach((c) => c.classList.toggle('on', Number(c.dataset.range) === n));
  };
  let range = 14;
  $$('[data-range]').forEach((c) => { c.style.cursor = 'pointer'; c.onclick = () => { range = Number(c.dataset.range); showRun++; draw(range); }; });
  draw(14);

  // ----- show what Proof AI ignored -----
  // Each ignored dip is drawn inside its own day at its real height (dip speed over plan speed),
  // dropping from that day's median, then marked as ignored. The day's bar never moves.
  let showRun = 0;
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const showIgnored = async () => {
    const id = ++showRun;
    const inView = () => (range === 14 ? facts.days : facts.days.filter((d) => !d.future).slice(-7));
    // If a dip's day is not on screen, switch to the full 14 days first.
    if (facts.ignored.some((x) => !inView().some((d) => d.day === x.day))) range = 14;
    draw(range);
    const days = inView(), bars = $$('#bars .bar'), still = reduced();
    if (!still) { $('#bars').scrollIntoView({ block: 'center', behavior: 'smooth' }); await wait(450); if (id !== showRun) return; }
    const pctOf = (mbps) => Math.max(0, Math.min(100, (mbps / facts.plan.down) * 100)).toFixed(1);
    const marks = [];
    for (const x of facts.ignored.slice().sort((a, b) => new Date(a.t) - new Date(b.t))) {
      const i = days.findIndex((d) => d.day === x.day); if (i < 0 || !bars[i]) continue;
      const day = days[i];
      const m = document.createElement('div');
      m.className = 'dipmark'; m.dataset.day = x.day; m.dataset.down = x.down;
      m.title = `${x.when}: ${x.down} Mbps, ignored as a one-off dip. Day ${day.day} median stayed ${day.median} Mbps.`;
      m.innerHTML = `<span><b>${x.down}</b><em>ignored</em></span>`;
      m.style.bottom = `${still || day.median == null ? pctOf(x.down) : pctOf(day.median)}%`;
      bars[i].appendChild(m);
      marks.push(m);
      if (still) { m.classList.add('in', 'ignored'); continue; }
      void m.offsetWidth;
      m.classList.add('in'); m.style.bottom = `${pctOf(x.down)}%`;
      await wait(550); if (id !== showRun) return;
    }
    if (still) return;
    await wait(1100); if (id !== showRun) return;
    for (const m of marks) { m.classList.add('ignored'); await wait(350); if (id !== showRun) return; }
    await wait(400);
  };
  const showBtn = $('#showIgnored');
  showBtn.hidden = !facts.ignored.length;
  showBtn.onclick = () => showIgnored();
  if (facts.ignored.length) window.wfDemoFill = showIgnored;

  // ----- Proof AI: kept and ignored -----
  const ign = facts.ignored;
  const lowDays = facts.days.filter((d) => d.median != null && d.low);
  const keptN = facts.streak.flagged ? facts.streak.len : facts.daysBelow;
  $('#keptCount').classList.toggle('kept', keptN > 0);
  bind({
    keptN,
    keptLabel: facts.streak.flagged ? 'days in a row counted as a real shortfall' : `${plural(keptN, 'day', 'days')} below the fair line so far`,
    ignoredN: ign.length,
    ignoredLabel: `one-off ${plural(ign.length, 'dip', 'dips')} ignored`,
    dipsTitle: ign.length ? `The ${ign.length === 1 ? 'dip' : ign.length + ' dips'} it ignored` : 'No one-off dips so far',
    keptHtml: lowDays.length
      ? `<b style="color:var(--ink)">Kept:</b> ${esc(list(lowDays.map((d) => `${d.today ? 'Today' : d.weekday + ' (Day ' + d.day + ')'} ${d.median}`)))} Mbps. ${lowDays.length === 1 ? 'The whole day' : 'Each whole day'} stayed under ${fair}, so ${lowDays.length === 1 ? 'it counts' : 'they count'}.${facts.daysBelow !== keptN ? ` That is ${facts.daysBelow} low days in total.` : ''}`
      : `<b style="color:var(--ink)">Kept:</b> every other test. No whole day had a median under the ${fair} Mbps fair line.`,
    chipsHtml: chipsHTML(['Method: median + outlier check']),
  });
  $('#dips').innerHTML = ign.length
    ? ign.map((x) => `<div class="dip"><div class="itile mute">${PULSE}</div><div class="grow">
        <div class="top"><span class="when">${esc(x.when)} · <span class="strike">${x.down} Mbps</span></span>${IGN}</div>
        <div class="why">${esc(x.reason)}, while the tests around it had a median of ${x.localMedian} Mbps.</div></div></div>`).join('')
    : '<div class="why small" style="padding:8px 0">A dip is ignored only when one result is far below the tests around it.</div>';

  // ----- time of day -----
  const lowB = facts.timeOfDay.filter((b) => b.low).map((b) => b.label.toLowerCase());
  bind({
    todSub: `Average download speed over ${facts.daysDone} ${plural(facts.daysDone, 'day', 'days')}, with one-off dips left out`,
    todNote: `The dashed mark is the ${fair} Mbps fair line. ${lowB.length === 0 ? 'No time of day falls under it.' : lowB.length === facts.timeOfDay.filter((b) => b.avg != null).length ? 'Every time of day with tests falls under it.' : `${cap(list(lowB))} ${lowB.length === 1 ? 'falls' : 'fall'} under it.`}`,
  });
  $('#tod').innerHTML = facts.timeOfDay.map((b) => {
    const name = `<div class="name">${esc(b.label)}<small>${esc(b.range)}</small></div>`;
    if (b.avg == null) return `<div class="todt none">${name}<div class="v">No tests yet</div><div class="track"></div><span class="badge none">Not measured</span></div>`;
    const w = Math.min(100, (b.avg / facts.plan.down) * 100).toFixed(1);
    return `<div class="todt${b.low ? ' low' : ''}" title="${b.n} tests">${name}<div class="num v">${b.avg}<span class="unit" style="font-size:12px">Mbps</span></div><div class="track${b.low ? ' low' : ''}"><i style="width:${w}%"></i></div>${badge(b.low ? 'bad' : 'good', b.statusWord)}</div>`;
  }).join('');

  // ----- tests table -----
  const clock = now(state);
  const ignoredIds = new Set(ign.map((x) => x.id));
  const all = state.tests.slice().sort((a, b) => new Date(b.t) - new Date(a.t)).map((t) => ({ ...t, when: `${dayKey(t.t) === dayKey(clock) ? 'Today' : fmtWeekday(t.t)} ${fmtTime(t.t)}`, ignored: ignoredIds.has(t.id), low: t.down < fair }));
  const cell = (label, v, unit, extra = '') => `<span><i class="lbl">${label}</i>${v == null ? '<span class="n" style="color:var(--ink-3)">n/a</span>' : `<span class="n${extra}">${v}<small>${unit}</small></span>`}</span>`;
  const row = (t) => {
    const sp = t.when.indexOf(' ');
    const tags = (t.source === 'practice' ? '<span class="tag practice">Practice</span>' : '') + (t.location === 'near' ? '<span class="tag">Near router</span>' : t.location === 'far' ? '<span class="tag">Far room</span>' : '');
    const dl = t.ignored ? `<span><i class="lbl">Download</i><span class="n dl"><s>${t.down}</s><small>Mbps</small></span></span>` : cell('Download', t.down, 'Mbps');
    const stat = t.ignored ? IGN.replace('badge ign', 'badge ign stat') : badge(t.low ? 'bad' : 'good', t.low ? 'Below fair line' : 'On plan').replace('class="badge', 'class="stat badge');
    return `<div class="tr${t.ignored ? ' ignored' : ''}" data-id="${esc(t.id)}"><span class="when"><b>${esc(t.when.slice(0, sp))}</b><span>${esc(t.when.slice(sp + 1))}</span>${tags}</span>${dl}${cell('Upload', t.up, 'Mbps')}${cell('Response', t.latency, 'ms')}${stat}</div>`;
  };
  const HEAD = '<div class="tr head"><span>Time</span><span>Download</span><span>Upload</span><span>Response time</span><span class="stat">Status</span></div>';
  let showAll = false;
  const table = () => {
    const rows = showAll ? all : facts.recent;
    $('#table').innerHTML = HEAD + rows.map(row).join('');
    bind({ tableTitle: showAll ? `All ${all.length} tests` : 'Recent tests' });
    const btn = $('#allBtn');
    btn.textContent = showAll ? `Show the latest ${facts.recent.length}` : `All ${all.length} tests`;
    btn.hidden = all.length <= facts.recent.length;
  };
  $('#allBtn').onclick = () => { showAll = !showAll; table(); };
  table();
}
