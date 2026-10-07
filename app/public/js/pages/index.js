// Landing page. Public: it reads the store only to decide where the "Get started" buttons go.
// Every figure on the page is computed here from the labelled sample two weeks by the same engine the app uses.
import { Store, $, $$, bind, esc, badge, statusKind, setRing, barsHTML, xlabelsHTML, daysHTML, sha256 } from '../shell.js';
import { summarize, FAIR, SCHEDULE, fmtTime, fmtWeekday } from '../engine.js';
import { buildSample, SAMPLE_PLAN, SAMPLE_BILL } from '../sample.js';
import { modelStack, stackHTML } from '../models.js';

const sample = buildSample(14);
const F = summarize({ plan: { ...SAMPLE_PLAN }, tests: sample.tests, startedAt: sample.startedAt, clock: sample.clock, sample: true });
const P = F.plan, H = F.headline, M = F.money, D = F.diagnosis;
const usd = (n) => `$${n}`;
const chips = (list) => list.map((c) => `<span class="evidence">${esc(c)}</span>`).join('');

/* ---------- the numbers behind the copy ---------- */
const ordinary = sample.tests.filter((t) => t.location === 'normal');
const fastest = ordinary.reduce((a, b) => (b.down > a.down ? b : a));
const cause = D.cause === 'provider' ? 'your provider, not your home Wi-Fi' : D.cause === 'wifi' ? 'your home Wi-Fi, not your provider' : 'no single cause yet';
const reportData = (mbps) => JSON.stringify({ provider: P.provider, plan: P.name, pricePerMonth: P.price, promisedMbps: P.down, fairLineMbps: F.fairLine, typicalMbps: mbps, percentOfPlan: Math.round((mbps / P.down) * 100), daysBelowFairLine: F.daysBelow, days: F.totalDays, tests: F.testsCount });
const realPrint = await sha256(reportData(H.mbps));

bind({
  badgeHtml: badge(statusKind(H.status), H.statusWord),
  pct: H.pct, got: H.mbps, down: P.down, fair: F.fairLine, fairPct: Math.round(FAIR * 100),
  price: usd(P.price), planName: P.name,
  dotsText: `${F.daysBelow} of ${F.totalDays} days came in under the fair line.`,
  aiLead: `Below the fair line on ${F.daysBelow} of ${F.totalDays} days.`,
  aiRest: `The evidence points to ${cause}.`,
  aiChipsHtml: chips([`${F.testsCount} tests`, `${F.totalDays} days`, `Confidence: ${D.level}`]),
  oneTest: fastest.down,
  oneTestText: `This was the fastest single test, taken on ${fmtWeekday(fastest.t)} at ${fmtTime(fastest.t)}. Seen alone, it looks close to the plan.`,
  twoWeeksText: `This is the typical speed across ${F.totalDays} days and ${F.testsCount} tests, which is ${H.pct} percent of the plan.`,
  timesHtml: chips(SCHEDULE.map((hm) => { const [h, m] = hm.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; })),
  perDay: SCHEDULE.length === 4 ? 'four' : String(SCHEDULE.length),
  daysCap: `${F.totalDays - F.daysBelow} days on plan and ${F.daysBelow} days below the fair line`,
  verdictLine: `${H.statusWord} on ${F.daysBelow} of ${F.totalDays} days`,
  provPct: `${D.providerPct}%`, wifiPct: `${D.wifiPct}%`,
  lostYear: usd(M.lostYear), lostMonth: usd(M.lostMonth),
});

/* ---------- hero: ring and the fourteen day dots ---------- */
$('#fairtick').setAttribute('transform', `rotate(${FAIR * 360} 100 100)`);
$('#dots14').innerHTML = F.days.map((d) => `<i class="${d.median == null ? 'none' : d.low ? 'low' : ''}"></i>`).join('');

/* ---------- 01 the problem: fourteen daily bars ---------- */
$('#bars').innerHTML = barsHTML(F, F.days);
$('#xl').innerHTML = xlabelsHTML(F.days, 'day');

/* ---------- 02 how it works ---------- */
$('#days').innerHTML = daysHTML(F);

/* ---------- 03 Proof AI examples ---------- */
$('#evi').innerHTML = `<div class="base"><span>Every check starts undecided, halfway between the two</span><span class="w">50</span></div>`
  + D.evidence.filter((e) => e.weight).map((e) => `<div><span>${esc(e.title)}</span><span class="w">${e.supports === 'wifi' ? `${e.weight} toward Wi-Fi` : `+${e.weight}`}</span></div>`).join('');
const B = SAMPLE_BILL;
$('#bill').innerHTML = `<div><span>Plan</span><b>${esc(P.name)}</b></div><div><span>Plan price</span><b>${usd(B.planPrice)}</b></div><div><span>Equipment</span><b>${usd(B.equipment)}</b></div>`
  + B.fees.map((f) => `<div><span>${esc(f.name)}</span><b>${f.junk ? '<span class="badge warn">Worth questioning</span>' : ''}${usd(f.amount)}</b></div>`).join('')
  + `<div class="tot"><span>Total each month</span><b>${usd(B.total)}</b></div>`;
/* ---------- "Get started": new visitors begin at consent, and someone who finished setup goes to the dashboard ---------- */
const state = await Store.load();
const done = !!(state.consent && state.consent.mlab && state.user && state.plan);
$$('[data-cta]').forEach((a) => { a.href = done ? 'dashboard.html' : 'onboarding-consent.html'; });
document.documentElement.dataset.ready = '1';

/* ---------- motion, only when the visitor has not asked for less ---------- */
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window);
const countUp = (el) => {
  const m = el.textContent.match(/^(\D*)(\d+)(.*)$/); if (!m) return;
  const end = Number(m[2]), t0 = performance.now(), ms = 1100;
  const tick = (t) => { const k = Math.min(1, (t - t0) / ms), e = 1 - (1 - k) ** 3; el.textContent = m[1] + Math.round(end * e) + m[3]; if (k < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
};
const ring = $('#ring');
if (calm) setRing(ring, H.pct, H.status);
else {
  document.documentElement.classList.add('anim');
  requestAnimationFrame(() => requestAnimationFrame(() => setRing(ring, H.pct, H.status)));
  $$('.hero [data-count]').forEach(countUp);
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in'); io.unobserve(en.target);
    $$('[data-count]', en.target).forEach(countUp);
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.rv').forEach((el) => io.observe(el));
}
requestAnimationFrame(() => requestAnimationFrame(() => { $('#splitbar').style.width = `${D.providerPct}%`; }));

/* ---------- 04 security: one protection running for real on this page ---------- */
// Fingerprint: SHA-256 of the example report. Changing one number gives a fingerprint that no longer matches.
let tampered = false;
async function showPrint() {
  const mbps = tampered ? H.mbps + 100 : H.mbps;
  const print = await sha256(reportData(mbps));
  $('#tamVal').textContent = mbps; $('#tamVal').classList.toggle('chg', tampered);
  $('#hash').textContent = print; $('#hash').classList.toggle('bad', print !== realPrint);
  $('#tamState').innerHTML = print === realPrint ? badge('good', 'Matches the original report') : badge('bad', 'No longer matches the original');
  $('#tamBtn').textContent = tampered ? 'Put it back' : 'Change one number';
}
await showPrint();
$('#tamBtn').addEventListener('click', () => { tampered = !tampered; showPrint(); });

/* ---------- 03 the models behind Proof AI, named from what the server reports ---------- */
const stack = await modelStack();
$('#stack').innerHTML = stackHTML(stack);
$('#stackState').innerHTML = stack.live ? badge('good', 'Connected right now') : badge('warn', 'Offline mode right now');
$('#stackNote').textContent = stack.live
  ? 'These are the models doing the work right now, named from what the server reports.'
  : 'No AI model is connected on this computer right now, so Proof AI is using its built-in writer.';
