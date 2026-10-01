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

  // Proof AI insight: numbers from the engine, wording from Claude (live) or the built-in writer (offline)
  const ai = await AI.insight(facts, state);
  bind({ aiSentenceHtml: AI.html(ai.sentence), aiReasonsHtml: reasonsHTML(ai.reasons), aiChipsHtml: chipsHTML(ai.chips), aiNote: AI.note(ai.mode), aiMeta: `Updated after your last test · ${ai.mode === 'live' ? 'live' : 'offline mode'}` });
}
