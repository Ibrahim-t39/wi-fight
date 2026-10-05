import { boot, bind, $, $$, setRing, barsHTML, xlabelsHTML, daysHTML, chipsHTML, reasonsHTML, labelHTML, badge, statusKind, AI, esc } from '../shell.js';
import { now } from '../engine.js';

const { state, facts } = await boot({ need: 'plan' });
const h = now(state).getHours();
const hello = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
bind({ greeting: `${hello}, ${state.user.name || 'there'}`, planHtml: `<b style="color:var(--ink)">${esc(facts.plan.name)}</b> · $${facts.plan.price} a month` });

if (!facts.headline) {
  $('#empty').hidden = false; $('#grid').hidden = true;
  bind({ eyebrow: 'Your two-week check has not started' });
} else {
  const H = facts.headline;
  bind({
    eyebrow: facts.complete ? `Day ${facts.totalDays} of ${facts.totalDays} · check complete` : `Day ${facts.dayNumber} of ${facts.totalDays} · ${facts.testsCount} tests so far`,
    statusHtml: badge(statusKind(H.status), H.statusWord), pct: H.pct, got: H.mbps, got3: H.mbps, paid: facts.plan.down, paid2: facts.plan.down,
    fair: `80% · ${facts.fairLine} Mbps`,
    basis: `Median of ${H.basis}, from ${facts.testsCount} tests. The black mark on the ring is the 80% fair line.`,
    progress: `${facts.daysDone} of ${facts.totalDays}`,
    nextHtml: facts.complete ? 'Your check is complete. <a href="verdict.html" style="color:var(--cobalt);font-weight:600">See your verdict</a>.' : `${facts.totalDays - facts.daysDone} more day${facts.totalDays - facts.daysDone === 1 ? '' : 's'} and your verdict and report are ready. Next test <b style="color:var(--ink)">${esc(facts.nextTest.label)}</b>.`,
    downBadgeHtml: badge(statusKind(H.status), `${H.pct}% of plan`),
    up: facts.upload ? facts.upload.mbps : 0, upBadgeHtml: facts.upload ? badge(statusKind(facts.upload.status), facts.upload.statusWord) : '',
    lat: facts.latency ? facts.latency.ms : 0, latBadgeHtml: facts.latency ? badge(statusKind(facts.latency.status), facts.latency.statusWord) : '',
    lost: facts.money.lostMonth, lostNote: facts.money.lostMonth ? `${facts.money.pctLost}% of a $${facts.money.price} bill, estimated` : 'You are getting what you pay for',
  });
  setRing($('#ring'), H.pct, H.status);
  $('#days').innerHTML = daysHTML(facts);
  $('#label').innerHTML = labelHTML(facts);

  const drawBars = (n) => {
    const done = facts.days.filter((d) => !d.future);
    const days = n === 14 ? facts.days : done.slice(-7);
    $('#bars').innerHTML = barsHTML(facts, days, { values: n !== 14 || window.innerWidth > 720 });
    $('#xlabels').innerHTML = xlabelsHTML(days, n === 14 ? 'day' : 'weekday');
    $$('[data-range]').forEach((c) => c.classList.toggle('on', Number(c.dataset.range) === n));
  };
  $$('[data-range]').forEach((c) => { c.style.cursor = 'pointer'; c.onclick = () => drawBars(Number(c.dataset.range)); });
  drawBars(7);

  // How Proof AI got here: four steps with the engine's own counts. Each links to the page that shows it.
  const plural = (n, one, many) => (n === 1 ? one : many);
  const TICK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.500"/></svg>';
  const dips = facts.ignored.length;
  // Regular tests that count toward the daily medians: not router checks, and not the dips set aside in step 2.
  const counted = state.tests.filter((t) => (t.location || 'normal') === 'normal').length - dips;
  const ev = facts.diagnosis.evidence.length;
  const pipeline = [
    { href: 'history.html', text: `Collected <b>${counted}</b> ${plural(counted, 'test', 'tests')}`, sub: 'regular tests that count' },
    { href: 'history.html', text: `Set aside <b>${dips}</b> one-off ${plural(dips, 'dip', 'dips')}`, sub: dips ? 'left out of the daily median' : 'none found so far' },
    { href: 'history.html', text: `Compared <b>${facts.daysDone}</b> ${plural(facts.daysDone, 'day', 'days')} to the fair line`, sub: `${facts.daysBelow} below it` },
    { href: 'diagnosis.html', text: `Weighed <b>${ev}</b> ${plural(ev, 'piece', 'pieces')} of evidence`, sub: 'Wi-Fi or provider' },
  ];
  $('#pipeSteps').innerHTML = pipeline.map((p, i) => `<a class="pstep" href="${p.href}" data-step="${i + 1}"><span class="k">${TICK}STEP ${i + 1}</span><span>${p.text}</span><small>${esc(p.sub)}</small></a>`).join('');
  $('#pipe').hidden = false;

  // Proof AI insight: numbers from the engine, wording from Claude (live) or the built-in writer (offline)
  const insight = AI.insight(facts, state);
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let runId = 0;
  // The steps tick in one after another, then the insight appears. Safe to run again.
  const playPipeline = async () => {
    const id = ++runId;
    const body = $('#aiBody'), stepEls = $$('.pstep');
    const still = reduced();
    body.classList.add('wait'); body.dataset.insight = 'waiting';
    $('#aiSentence').textContent = 'Proof AI is reading your results.';
    stepEls.forEach((el) => el.classList.toggle('in', still));
    if (!still) {
      await wait(150);
      for (const el of stepEls) { if (id !== runId) return; el.classList.add('in'); await wait(250); }
      await wait(200);
    }
    const ai = await insight;
    if (id !== runId) return;
    bind({ aiSentenceHtml: AI.html(ai.sentence), aiReasonsHtml: reasonsHTML(ai.reasons), aiChipsHtml: chipsHTML(ai.chips), aiNote: AI.note(ai.mode), aiMeta: `Updated after your last test · ${ai.mode === 'live' ? 'live' : 'offline mode'}` });
    body.classList.remove('wait'); body.dataset.insight = 'ready';
  };
  playPipeline();
  // The guided demo's "Do it for me": replay the analysis, then bring the Broadband Facts card into view.
  window.wfDemoFill = async () => {
    $('#pipe').scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
    await wait(400);
    await playPipeline();
    await wait(900);
    $('#labelCard').scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
  };
}
