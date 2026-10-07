// Diagnosis page: everything here is drawn from facts.diagnosis, which the engine computes on this device.
import { boot, bind, $, esc, AI, Store } from '../shell.js';

const { facts } = await boot({ need: 'plan' });
const D = facts.diagnosis;

const ICON = {
  wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2.5 9a14 14 0 0 1 19 0M6 12.5a9 9 0 0 1 12 0M9.2 16a4.5 4.5 0 0 1 5.6 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/></svg>',
  tower: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 10v11M8 21h8M7.5 14.5a6 6 0 0 1 0-9M16.5 5.5a6 6 0 0 1 0 9M4.5 17a10 10 0 0 1 0-14M19.5 3a10 10 0 0 1 0 14"/><circle cx="12" cy="10" r="1.5" fill="currentColor"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  bars: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 20V10M12 20V4M19 20v-7"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
};
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const pairs = facts.router ? facts.router.pairs : 0;

if (!facts.headline || !D || D.cause === 'unknown') {
  $('#empty').hidden = false; $('#grid').hidden = true;
  bind({ updated: 'No tests yet' });
} else {
  const quiet = D.cause === 'none';
  const unsure = D.cause === 'unclear';
  bind({
    updated: `${plural(facts.testsCount, 'test')} · day ${facts.dayNumber} of ${facts.totalDays}`,
    title: D.title, sub: D.sub || '',
    lock: Store.isEncrypted() ? 'Encrypted' : 'On this device',
    usedTests: plural(facts.testsCount, 'test'), usedDays: plural(facts.daysDone, 'day'), usedPairs: String(pairs),
    usedPlanHtml: `${esc(facts.plan.name)}<br><span class="small">${esc(facts.plan.down)} Mbps typical download</span>`,
    stamp: `Day ${facts.dayNumber} of ${facts.totalDays}`,
  });

  // The evidence score, rebuilt here from the engine's own weights: start at 50, each finding moves it.
  // "exact" is true only when that sum equals the engine's providerPct. Only then is the arithmetic shown.
  const steps = D.evidence.map((e) => {
    const w = Number(e.weight) || 0;
    const dir = e.supports === 'provider' ? 1 : e.supports === 'wifi' ? -1 : 0;
    return { e, move: dir * w, mapped: w === 0 || dir !== 0 };
  });
  const moves = steps.filter((s) => s.move).map((s) => s.move);
  const exact = !quiet && steps.length > 0 && steps.every((s) => s.mapped) && 50 + moves.reduce((a, b) => a + b, 0) === D.providerPct;
  const sumOf = (list) => `50${list.map((m) => ` ${m < 0 ? '-' : '+'} ${Math.abs(m)}`).join('')}`;
  const sumText = `${sumOf(moves)} = ${D.providerPct}% provider`;
  const sumHTML = exact ? `<div class="sumline" id="sumline">${sumText}<small>Starts at 50, an even chance. Each finding moves it.${D.cause === 'wifi' ? ` Wi-Fi gets the rest: ${D.wifiPct}%.` : ''}</small></div>` : '';
  const zonesHTML = (level) => `<div class="zones" style="grid-template-columns:60% 20% 20%"><span data-z="low" class="${level === 'low' ? 'on' : ''}">Low</span><span data-z="medium" class="${level === 'medium' ? 'on' : ''}">Medium</span><span data-z="high" class="${level === 'high' ? 'on' : ''}">High</span></div>`;

  // Confidence
  const conf = $('#conf');
  const drawConf = () => {
  if (quiet) {
    conf.classList.add('calm');
    conf.innerHTML = `<div class="lab"><span class="t">Good news</span><span class="badge good"><span class="dot"></span>${esc(facts.headline.statusWord)}</span></div>
      <p class="body" style="font-size:14px;margin-top:10px">Your median is <b>${facts.headline.mbps} Mbps</b>, which is ${facts.headline.pct}% of your plan and at or above the ${facts.fairLine} Mbps fair line. There is no lasting slowdown to explain, so there is no confidence score to show.</p>`;
  } else if (unsure) {
    conf.innerHTML = `<div class="lab"><span class="t">Not enough evidence yet</span></div>
      <p class="body" style="font-size:14px;margin-top:10px">The findings so far do not point clearly one way. ${D.needsPairedTest ? 'A test next to your router and one in a far room will settle it.' : 'More days of tests will make it clearer.'}</p>${sumHTML}`;
  } else {
    const c = D.confidence;
    conf.innerHTML = `<div class="lab"><span class="t">Confidence: ${esc(D.level)}</span><span class="num p"><span data-n>${c}</span><span class="unit" style="font-size:14px">%</span></span></div>
      <div class="meter" role="img" aria-label="Confidence ${c} percent, ${esc(D.level)}"><i style="width:${c}%"></i><b style="left:60%"></b><b style="left:80%"></b><em style="left:${c}%"></em></div>
      ${zonesHTML(D.level)}
      <div class="small" style="margin-top:12px;color:var(--ink-2)">How strongly your test results point one way.${D.needsPairedTest ? ' Less certain without a router check.' : ''}</div>${sumHTML}`;
  }
  };
  drawConf();

  // The two causes
  let drawBalance = () => {};
  if (quiet) $('#compareCard').hidden = true;
  else {
    const ev = (k) => D.evidence.find((e) => e.key === k);
    const r = ev('router'), R = facts.router;
    const wifiCap = !r ? 'No router check yet, so Wi-Fi cannot be ruled in or out.'
      : r.supports === 'wifi' ? `Much slower in the far room: ${R.far} Mbps, against ${R.near} next to the router.`
      : r.supports === 'provider' ? `Speed barely changes between rooms: ${R.near} Mbps near the router, ${R.far} in the far room.`
      : `The router check is not decisive: ${R.near} Mbps near, ${R.far} far.`;
    const pro = [];
    if (r && r.supports === 'provider') pro.push('slow at the router');
    if (ev('evening')) pro.push('slower in the evening');
    if (ev('streak')) pro.push(`below the fair line ${facts.streak.len} days in a row`);
    const provCap = pro.length ? pro.join(', ').replace(/^./, (ch) => ch.toUpperCase()) + '.' : 'Nothing in your tests points here yet.';
    const opt = (name, pct, icon, cap, win, lose, live) => `<div class="opt${win ? ' win' : ''}" data-opt="${name === 'Your Wi-Fi' ? 'wifi' : 'provider'}">
        <div class="row between"><div class="itile${win ? '' : ' mute'}"${win ? ' style="background:var(--cobalt);color:#fff"' : ''}>${icon}</div><span class="badge ${win ? 'pick' : 'mute'}">${live ? 'Weighing' : win ? 'Likely' : lose ? 'Unlikely' : 'Possible'}</span></div>
        <div class="row between"><span class="name">${name}</span><span class="num pct" style="color:var(--${win ? 'cobalt' : 'ink-3'})"><span data-n>${pct}</span><span class="unit" style="font-size:12px">%</span></span></div>
        <div class="like"><i style="width:${pct}%"></i></div>
        <div class="small"${win ? ' style="color:var(--ink-2)"' : ''}>${esc(cap)}</div>
      </div>`;
    // live = true draws the even 50 / 50 starting point of the replay, with no winner yet
    drawBalance = (live) => {
      $('#balance').innerHTML = opt('Your Wi-Fi', live ? 50 : D.wifiPct, ICON.wifi, wifiCap, !live && D.cause === 'wifi', !live && D.cause === 'provider', live)
        + '<div class="vs">VS</div>'
        + opt('Your provider', live ? 50 : D.providerPct, ICON.tower, provCap, !live && D.cause === 'provider', !live && D.cause === 'wifi', live);
    };
    drawBalance(false);
  }

  // Evidence rows
  const tag = (s) => (s === 'provider' ? '<span class="badge pick way">Points to your provider</span>' : s === 'wifi' ? '<span class="badge warn way">Points to Wi-Fi</span>' : '<span class="badge mute way">Not decisive</span>');
  const visual = (e) => {
    const v = e.values || {};
    if (e.key === 'router') {
      const lo = Math.max(0, Math.floor((Math.min(v.near, v.far, v.fairLine) - v.plan * 0.15) / 50) * 50);
      const hi = Math.max(v.plan, v.near, v.far);
      const pos = (x) => Math.max(0, Math.min(100, ((x - lo) / (hi - lo)) * 100));
      const pts = [{ v: v.far, label: 'Far room' }, { v: v.near, label: 'Near router' }].sort((a, b) => a.v - b.v);
      const gap = pos(pts[1].v) - pos(pts[0].v);
      const side = [gap < 26 ? 'l' : pos(pts[0].v) < 10 ? 'r' : '', gap < 26 ? 'r' : pos(pts[1].v) > 88 ? 'l' : ''];
      return `<div class="range" role="img" aria-label="Near router ${v.near} Mbps, far room ${v.far} Mbps, fair line ${v.fairLine} Mbps">
          <div class="rail"></div>
          <div class="gap" style="left:${pos(pts[0].v).toFixed(1)}%;width:${gap.toFixed(1)}%"></div>
          <div class="fair" style="left:${pos(v.fairLine).toFixed(1)}%"><span>Fair line ${v.fairLine}</span></div>
          ${pts.map((p, i) => `<div class="pt ${side[i]}${p.v >= v.fairLine ? ' ok' : ''}" style="left:${pos(p.v).toFixed(1)}%"><span>${p.v}<small>${p.label}</small></span></div>`).join('')}
        </div>
        <div class="ends"><span>${lo} Mbps</span><span>${hi === v.plan ? `Your plan: ${v.plan}` : `${hi} Mbps`}</span></div>`;
    }
    if (e.key === 'evening') {
      const row = (name, val) => `<div class="r"><span>${name}</span><div class="t${val < v.fairLine ? ' low' : ''}"><i style="width:${Math.min(100, (val / v.plan) * 100).toFixed(1)}%"></i></div><span class="v"${val < v.fairLine ? ' style="color:var(--bad)"' : ''}>${val}<small>Mbps</small></span></div>`;
      return `<div class="cmp">${row('Daytime', v.daytime)}${row('Evening', v.evening)}</div><div class="small" style="margin-bottom:10px">The dashed mark is the ${v.fairLine} Mbps fair line.</div>`;
    }
    if (e.key === 'devices') {
      const many = e.supports === 'wifi';
      return `<div class="devs${many ? ' many' : ''}">${'<i></i>'.repeat(Math.min(40, v.devices))}<span>${plural(v.devices, 'device')} for ${plural(v.people, 'person').replace('persons', 'people')}</span></div>`;
    }
    if (e.key === 'streak') {
      return `<div class="days3">${v.days.map((n) => { const d = facts.days[n - 1]; return `<div class="d3"><div class="k">Day ${d.day} · ${d.weekday}</div><div class="num v">${d.median}</div><div class="u">${v.fairLine - d.median} under the line</div></div>`; }).join('')}</div>`;
    }
    return '';
  };
  const icon = (e) => (e.key === 'router' ? ['', ICON.wifi] : e.key === 'evening' ? ['', ICON.clock] : e.key === 'devices' ? [e.supports === 'wifi' ? ' warn' : ' good', ICON.check] : [' bad', ICON.bars]);
  const n = D.evidence.length;
  if (quiet || !n) {
    bind({ evTitle: quiet ? 'What Proof AI checked' : 'The evidence', evSub: quiet ? 'Nothing in your tests points to a lasting problem.' : 'No findings yet. Keep testing and run a router check.' });
    $('#evidence').innerHTML = `<div class="kv"><span class="k">Median speed</span><span class="v">${facts.headline.mbps} Mbps, ${facts.headline.pct}% of plan</span></div>
      <div class="kv"><span class="k">Days below the ${facts.fairLine} Mbps fair line</span><span class="v">${facts.daysBelow} of ${facts.daysDone}</span></div>
      <div class="kv"><span class="k">Longest run below the fair line</span><span class="v">${plural(facts.streak.len, 'day')}</span></div>
      <div class="kv"><span class="k">One-off dips ignored</span><span class="v">${facts.ignored.length}</span></div>`;
  } else {
    bind({ evSub: `${plural(n, 'finding')} from your own tests. Open any one to see the numbers.` });
    $('#evidence').innerHTML = D.evidence.map((e, i) => { const [cls, svg] = icon(e); return `<details class="ev" data-key="${esc(e.key)}"${i === 0 ? ' open' : ''}>
        <summary><div class="itile${cls}">${svg}</div><span class="q"><span>${esc(e.title)}</span>${tag(e.supports)}</span><span class="n">${i + 1} OF ${n}</span><span class="chev">${ICON.chev}</span></summary>
        <div class="evbody">${visual(e)}<p>${AI.html(e.detail)}</p></div>
      </details>`; }).join('');
  }

  // Router check card
  if (D.needsPairedTest && !quiet) {
    $('#checkCard').classList.add('need');
    $('#checkBtn').className = 'btn primary sm';
    bind({ checkTitle: 'One check is missing', checkText: 'Proof AI has no near and far tests yet, so this diagnosis is less certain without it. Stand next to your router and run one test, then run one in a far room. Each takes about 20 seconds.' });
  }
  if (quiet) bind({ reportTitle: 'Keep a record of your results' });

  // ---------- Watch Proof AI decide ----------
  // A replay of the evidence score. Every value shown is one of the engine's: each item's weight and
  // direction, and the final providerPct. Nothing here is scripted.
  if (!quiet && n) {
    const SEEN = 'wf.diag.replayed';
    const STEP = 1200;
    const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const title = $('[data-b="title"]'), sub = $('[data-b="sub"]'), grid = $('#grid');
    const rows = () => Array.from(document.querySelectorAll('#evidence .ev'));
    const levelOf = (c) => (c >= 80 ? 'high' : c >= 60 ? 'medium' : 'low');
    let runId = 0;

    // Count a number on screen from where it is to its new value.
    const rafs = new WeakMap();
    const tween = (el, to, ms = 700) => {
      if (!el) return;
      cancelAnimationFrame(rafs.get(el));
      const from = Number(el.textContent) || 0, t0 = performance.now();
      if (from === to) return;
      const tick = (t) => {
        const k = Math.max(0, Math.min(1, (t - t0) / ms)), e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(from + (to - from) * e);
        if (k < 1 && el.isConnected) rafs.set(el, requestAnimationFrame(tick));
      };
      rafs.set(el, requestAnimationFrame(tick));
    };
    // Move the meter and both bars to a provider score of p.
    const show = (p, ms) => {
      const c = Math.max(p, 100 - p);
      $('.meter i', conf).style.width = `${c}%`; $('.meter em', conf).style.left = `${c}%`;
      tween($('.lab [data-n]', conf), c, ms);
      conf.querySelectorAll('[data-z]').forEach((z) => z.classList.toggle('on', z.dataset.z === levelOf(c)));
      [['provider', p], ['wifi', 100 - p]].forEach(([k, v]) => {
        const o = $(`[data-opt="${k}"]`); if (!o) return;
        $('.like i', o).style.width = `${v}%`; tween($('[data-n]', o), v, ms);
      });
    };

    const finish = (emphasis) => {
      grid.classList.remove('replaying'); grid.dataset.replay = 'done';
      title.classList.remove('weigh'); title.textContent = D.title; sub.textContent = D.sub || '';
      drawConf(); drawBalance(false);
      rows().forEach((r, i) => { r.classList.remove('lit', 'seen'); r.open = i === 0; });
      $('#watch').hidden = false; $('#skip').hidden = true;
      if (emphasis && !reduced()) [title, $('.lab .t', conf)].forEach((el) => { if (!el) return; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); });
    };

    const play = async () => {
      const id = ++runId;
      if (reduced()) { finish(false); return; }
      grid.classList.add('replaying'); grid.dataset.replay = 'playing';
      $('#watch').hidden = true; $('#skip').hidden = false;
      title.classList.remove('pop'); title.classList.add('weigh'); title.textContent = 'Weighing the evidence...';
      sub.textContent = 'Starting even: 50 / 50';
      conf.classList.remove('calm');
      conf.innerHTML = `<div class="lab"><span class="t">Confidence</span><span class="num p"><span data-n>50</span><span class="unit" style="font-size:14px">%</span></span></div>
        <div class="meter" role="img" aria-label="Confidence meter, replaying"><i style="width:50%"></i><b style="left:60%"></b><b style="left:80%"></b><em style="left:50%"></em></div>
        ${zonesHTML('low')}
        <div class="now" aria-live="polite"><div class="what" id="nowWhat"><small>START</small>An even chance: 50% provider, 50% Wi-Fi.</div><span id="nowDelta"></span></div>
        <div class="sumline" id="runline">50</div>`;
      drawBalance(true);
      rows().forEach((r) => { r.open = false; r.classList.remove('lit', 'seen'); });
      await wait(900); if (id !== runId) return;

      if (!exact) {
        // The listed weights do not add up to the engine's result, so no per-step story: go straight to its value.
        rows().forEach((r) => r.classList.add('lit'));
        $('#nowWhat').innerHTML = `<small>ALL ${n} FINDINGS</small>Weighed together.`;
        $('#runline').hidden = true;
        show(D.providerPct, 1100);
        await wait(STEP + 300); if (id !== runId) return;
      } else {
        let run = 50; const done = [];
        for (let i = 0; i < steps.length; i++) {
          const { e, move } = steps[i];
          const r = rows()[i];
          if (r) { r.classList.add('lit'); r.open = true; }
          $('#nowWhat').innerHTML = `<small>FINDING ${i + 1} OF ${n}</small>${esc(e.title)}`;
          $('#nowDelta').outerHTML = move
            ? `<span class="delta ${move > 0 ? 'provider' : 'wifi'}" id="nowDelta" data-move="${move}">${move > 0 ? '+' : '-'}${Math.abs(move)} toward ${move > 0 ? 'your provider' : 'Wi-Fi'}</span>`
            : '<span class="delta zero" id="nowDelta" data-move="0">No change</span>';
          run += move; if (move) done.push(move);
          $('#runline').textContent = `${sumOf(done)}${done.length ? ` = ${run}` : ''}`;
          sub.textContent = `Now ${run}% provider, ${100 - run}% Wi-Fi`;
          show(run, 700);
          await wait(STEP); if (id !== runId) return;
          if (r) { r.classList.remove('lit'); r.classList.add('seen'); r.open = false; }
        }
      }
      if (id !== runId) return;
      finish(true);
    };

    $('#replayRow').hidden = false;
    $('#watch').onclick = () => play();
    $('#skip').onclick = () => { runId++; finish(false); };
    // The guided demo's "Do it for me": back to the top, then the same replay the button runs.
    window.wfDemoFill = async () => { window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' }); await wait(400); await play(); };

    // Play once by itself, the first time this page is opened in a browser session.
    let seen = true;
    try { seen = !!sessionStorage.getItem(SEEN); sessionStorage.setItem(SEEN, '1'); } catch { seen = true; }
    if (!seen && !document.documentElement.classList.contains('ai-off')) play();
  }
}
