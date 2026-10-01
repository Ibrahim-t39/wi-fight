// Wi-Fight engine: the statistics behind Proof AI. Pure functions, no DOM, no network.
// Everything a page shows about speed, fairness, anomalies, and diagnosis is computed here.

export const FAIR = 0.8;          // fair line: 80% of the plan's typical download speed
export const STREAK = 3;          // days in a row below the fair line that count as a real shortfall
export const CHECK_DAYS = 14;
export const SCHEDULE = ['09:40', '15:40', '19:40', '21:40']; // four tests a day

export const median = (a) => {
  const s = a.filter((x) => Number.isFinite(x)).slice().sort((x, y) => x - y);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
export const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
export const round = (x, d = 0) => (x == null ? null : Math.round(x * 10 ** d) / 10 ** d);
const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (t) => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const startOfDay = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d; };
const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtTime = (t) => { const d = new Date(t); let h = d.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${pad(d.getMinutes())} ${ap}`; };
export const fmtDate = (t) => { const d = new Date(t); return `${MONTH[d.getMonth()]} ${d.getDate()}`; };
export const fmtWeekday = (t) => WEEK[new Date(t).getDay()];

export function now(state) { return state && state.clock ? new Date(state.clock) : new Date(); }

// Anomaly detection. A test is a one-off dip when it is far below the tests around it:
// robust z-score (median and median absolute deviation) under -3.5 AND at least 40% below the local median.
// Sustained slow periods are not flagged, because their neighbours are slow too.
export function flagOutliers(tests) {
  const reg = tests.filter((t) => (t.location || 'normal') === 'normal').slice().sort((a, b) => new Date(a.t) - new Date(b.t));
  const out = new Map();
  const WINDOW = 36 * 3600 * 1000;
  reg.forEach((t) => {
    const near = reg.filter((o) => o !== t && Math.abs(new Date(o.t) - new Date(t.t)) <= WINDOW).map((o) => o.down);
    if (near.length < 4) return;
    const med = median(near);
    const mad = Math.max(median(near.map((x) => Math.abs(x - med))), med * 0.05);
    const z = (0.6745 * (t.down - med)) / mad;
    if (z < -3.5 && t.down < med * 0.6) out.set(t.id, { z: round(z, 1), localMedian: round(med), reason: 'A single low result between normal ones' });
  });
  return out;
}

const BUCKETS = [
  { key: 'morning', label: 'Morning', range: '6 AM to noon', from: 6, to: 12 },
  { key: 'afternoon', label: 'Afternoon', range: 'Noon to 7 PM', from: 12, to: 19 },
  { key: 'evening', label: 'Evening', range: '7 to 11 PM', from: 19, to: 23 },
  { key: 'night', label: 'Night', range: '11 PM to 6 AM', from: 23, to: 30 },
];
const bucketOf = (t) => { const h = new Date(t).getHours(); if (h >= 6 && h < 12) return 'morning'; if (h >= 12 && h < 19) return 'afternoon'; if (h >= 19 && h < 23) return 'evening'; return 'night'; };

// The one function pages call. Returns every fact the interface shows.
export function summarize(state) {
  const plan = state.plan || null;
  const tests = (state.tests || []).slice().sort((a, b) => new Date(a.t) - new Date(b.t));
  const clock = now(state);
  const facts = { ready: !!plan && tests.length > 0, hasPlan: !!plan, plan, testsCount: tests.length, totalDays: CHECK_DAYS, sample: !!state.sample, generatedAt: clock.toISOString() };
  if (!plan) return facts;
  const fairLine = round(plan.down * FAIR);
  facts.fairLine = fairLine;
  const started = startOfDay(state.startedAt || (tests[0] ? tests[0].t : clock));
  const dayNumber = Math.min(CHECK_DAYS, Math.max(1, Math.floor((startOfDay(clock) - started) / 86400000) + 1));
  facts.dayNumber = dayNumber;
  facts.startDate = started.toISOString();
  facts.endDate = new Date(started.getTime() + (CHECK_DAYS - 1) * 86400000).toISOString();

  const outliers = flagOutliers(tests);
  const regular = tests.filter((t) => (t.location || 'normal') === 'normal');
  const kept = regular.filter((t) => !outliers.has(t.id));
  facts.ignored = regular.filter((t) => outliers.has(t.id)).map((t) => ({ ...t, ...outliers.get(t.id), when: `${fmtWeekday(t.t)} ${fmtTime(t.t)}`, day: Math.floor((startOfDay(t.t) - started) / 86400000) + 1 }));

  // Daily medians over the 14-day check
  const days = [];
  for (let i = 0; i < CHECK_DAYS; i++) {
    const date = new Date(started.getTime() + i * 86400000);
    const key = dayKey(date);
    const dt = kept.filter((t) => dayKey(t.t) === key);
    const med = dt.length ? round(median(dt.map((t) => t.down))) : null;
    days.push({ day: i + 1, date: date.toISOString(), weekday: WEEK[date.getDay()], label: fmtDate(date), n: dt.length, median: med, pct: med == null ? null : round((med / plan.down) * 100), low: med != null && med < fairLine, today: i + 1 === dayNumber, future: i + 1 > dayNumber, hadIgnored: facts.ignored.some((x) => x.day === i + 1) });
  }
  facts.days = days;
  const done = days.filter((d) => d.median != null);
  facts.daysDone = done.length;
  facts.complete = facts.daysDone >= CHECK_DAYS;
  facts.daysBelow = done.filter((d) => d.low).length;

  // Headline: while the check runs, the median of the last 7 measured days. When it is complete, all 14.
  const basisDays = facts.complete ? done : done.slice(-7);
  const mbps = done.length ? round(median(basisDays.map((d) => d.median))) : null;
  facts.headline = mbps == null ? null : {
    mbps, pct: round((mbps / plan.down) * 100), status: mbps < fairLine ? 'below' : 'on',
    statusWord: mbps < fairLine ? 'Below plan' : 'On plan',
    basis: facts.complete ? `all ${CHECK_DAYS} days` : `the last ${basisDays.length} day${basisDays.length === 1 ? '' : 's'}`,
    basisCount: basisDays.length,
  };

  // Longest run of days below the fair line, and whether it is still going
  let best = [], cur = [];
  done.forEach((d) => { if (d.low) { cur.push(d.day); if (cur.length > best.length) best = cur.slice(); } else cur = []; });
  facts.streak = { len: best.length, days: best, flagged: best.length >= STREAK, ongoing: cur.length > 0 && cur.length === best.length };

  facts.best = done.length ? done.reduce((a, b) => (b.median > a.median ? b : a)) : null;
  facts.worst = done.length ? done.reduce((a, b) => (b.median < a.median ? b : a)) : null;

  const up = median(kept.map((t) => t.up).filter((x) => x != null));
  const lat = median(kept.map((t) => t.latency).filter((x) => x != null));
  facts.upload = up == null ? null : { mbps: round(up), status: up >= plan.up * FAIR ? 'on' : 'below', statusWord: up >= plan.up * FAIR ? 'On plan' : 'Below plan' };
  facts.latency = lat == null ? null : { ms: round(lat), status: lat <= 50 ? 'good' : 'slow', statusWord: lat <= 50 ? 'Good' : 'Slow' };

  // Money: the share of the bill that paid for speed not received
  if (facts.headline) {
    const share = Math.max(0, 1 - facts.headline.mbps / plan.down);
    facts.money = { price: plan.price, pctLost: round(share * 100), lostMonth: round(plan.price * share), lostYear: round(plan.price * share * 12) };
  }

  // Time of day
  facts.timeOfDay = BUCKETS.map((b) => {
    const v = kept.filter((t) => bucketOf(t.t) === b.key).map((t) => t.down);
    const avg = v.length ? round(mean(v)) : null;
    return { key: b.key, label: b.label, range: b.range, n: v.length, avg, low: avg != null && avg < fairLine, statusWord: avg == null ? 'No tests yet' : avg < fairLine ? 'Below fair line' : 'On plan' };
  });
  const eve = kept.filter((t) => bucketOf(t.t) === 'evening').map((t) => t.down);
  const dayt = kept.filter((t) => ['morning', 'afternoon'].includes(bucketOf(t.t))).map((t) => t.down);
  facts.evening = { avg: eve.length ? round(mean(eve)) : null, n: eve.length };
  facts.daytime = { avg: dayt.length ? round(mean(dayt)) : null, n: dayt.length };

  // Paired router checks
  const nearT = tests.filter((t) => t.location === 'near').map((t) => t.down);
  const farT = tests.filter((t) => t.location === 'far').map((t) => t.down);
  facts.router = { near: nearT.length ? round(mean(nearT)) : null, far: farT.length ? round(mean(farT)) : null, pairs: Math.min(nearT.length, farT.length) };

  facts.diagnosis = diagnose(facts, state);

  // Next scheduled test
  const paused = state.settings && state.settings.pausedUntil && new Date(state.settings.pausedUntil) > clock;
  const sched = SCHEDULE.map((s) => { const [h, m] = s.split(':').map(Number); const d = new Date(clock); d.setHours(h, m, 0, 0); return d; });
  const upcoming = sched.find((d) => d > clock);
  facts.nextTest = paused ? { paused: true, label: 'Paused' } : upcoming ? { at: upcoming.toISOString(), label: `today at ${fmtTime(upcoming)}` } : { at: null, label: `tomorrow at ${fmtTime(sched[0])}` };
  facts.testsToday = regular.filter((t) => dayKey(t.t) === dayKey(clock)).length;
  facts.recent = tests.slice().reverse().slice(0, 12).map((t) => ({ ...t, when: `${dayKey(t.t) === dayKey(clock) ? 'Today' : fmtWeekday(t.t)} ${fmtTime(t.t)}`, ignored: outliers.has(t.id), low: t.down < fairLine }));
  return facts;
}

// Diagnosis: is the likely cause the home Wi-Fi or the provider?
// A transparent evidence score, not a black box. Each piece of evidence moves the score and is shown to the user.
export function diagnose(facts, state) {
  const d = { evidence: [], needsPairedTest: !facts.router || !facts.router.pairs };
  if (!facts.headline) return { ...d, cause: 'unknown', title: 'Not enough tests yet', confidence: 0, level: 'low', providerPct: 50, wifiPct: 50 };
  if (facts.headline.status === 'on' && !facts.streak.flagged) {
    return { ...d, cause: 'none', title: 'No lasting problem found', sub: 'Your speed is at or above the fair line', confidence: 0, level: 'low', providerPct: 50, wifiPct: 50 };
  }
  let p = 0.5; // probability the provider is the cause
  const { near, far, pairs } = facts.router;
  if (pairs) {
    const gap = (near - far) / near;
    const gapMbps = round(near - far);
    if (near < facts.fairLine && gap < 0.15) {
      p += 0.22;
      d.evidence.push({ key: 'router', supports: 'provider', weight: 22, title: 'Speed is low right next to the router too.', detail: `A small gap of ${gapMbps} Mbps. If Wi-Fi were the cause, the far room would be much slower than the spot next to the router. Both are under the fair line, so the slow speed arrives at your home already slow.`, values: { near, far, fairLine: facts.fairLine, plan: facts.plan.down } });
    } else if (gap >= 0.3) {
      const w = near >= facts.fairLine ? 30 : 15;
      p -= w / 100;
      d.evidence.push({ key: 'router', supports: 'wifi', weight: w, title: 'Speed drops a lot away from the router.', detail: `Next to the router you got ${near} Mbps. In the far room, ${far} Mbps. That large gap points to Wi-Fi coverage inside your home.`, values: { near, far, fairLine: facts.fairLine, plan: facts.plan.down } });
    } else {
      d.evidence.push({ key: 'router', supports: 'neutral', weight: 0, title: 'The router check is not decisive.', detail: `Near the router ${near} Mbps, far room ${far} Mbps.`, values: { near, far, fairLine: facts.fairLine, plan: facts.plan.down } });
    }
  }
  if (facts.evening.avg != null && facts.daytime.avg != null) {
    const drop = (facts.daytime.avg - facts.evening.avg) / facts.daytime.avg;
    if (drop >= 0.08) {
      p += 0.08;
      d.evidence.push({ key: 'evening', supports: 'provider', weight: 8, title: 'It gets worse in the evening.', detail: `Evening tests, 7 to 11 PM, average ${facts.evening.avg} Mbps. Daytime tests average ${facts.daytime.avg} Mbps. Slowdowns at the busiest hours usually come from the provider's network.`, values: { evening: facts.evening.avg, daytime: facts.daytime.avg, fairLine: facts.fairLine, plan: facts.plan.down } });
    }
  }
  const devices = (state.household && state.household.devices) || null;
  const people = (state.household && state.household.people) || null;
  if (devices && people) {
    const normal = devices <= people * 5;
    if (!normal) p -= 0.08;
    d.evidence.push({ key: 'devices', supports: normal ? 'provider' : 'wifi', weight: normal ? 0 : 8, title: normal ? 'Your network is not overloaded.' : 'Your network is carrying a lot of devices.', detail: `${devices} devices connected, ${normal ? 'normal' : 'high'} for ${people} ${people === 1 ? 'person' : 'people'}.`, values: { devices, people } });
  }
  if (facts.streak.flagged) {
    p += 0.06;
    d.evidence.push({ key: 'streak', supports: 'provider', weight: 6, title: `It has lasted ${facts.streak.len} days in a row.`, detail: `Below the ${facts.fairLine} Mbps fair line on days ${facts.streak.days[0]} to ${facts.streak.days[facts.streak.days.length - 1]}. A problem that lasts is not a one-off.`, values: { days: facts.streak.days, fairLine: facts.fairLine } });
  }
  p = Math.min(0.97, Math.max(0.03, p));
  const providerPct = Math.round(p * 100);
  const cause = providerPct >= 60 ? 'provider' : providerPct <= 40 ? 'wifi' : 'unclear';
  const conf = cause === 'unclear' ? 50 : Math.max(providerPct, 100 - providerPct);
  return { ...d, cause, providerPct, wifiPct: 100 - providerPct, confidence: conf,
    level: conf >= 80 ? 'high' : conf >= 60 ? 'medium' : 'low',
    title: cause === 'provider' ? 'Your provider' : cause === 'wifi' ? 'Your home Wi-Fi' : 'Not clear yet',
    sub: cause === 'provider' ? 'Not your home Wi-Fi' : cause === 'wifi' ? 'Not your provider' : 'Run a near-router test to find out',
    method: 'Evidence score: router check, time of day, devices, and how long it lasted' };
}

// Plan recommendation: a transparent score over the plans near the user.
export function recommend(facts, catalog, household = {}) {
  const people = household.people || 3;
  const uses = household.uses || ['Online classes', 'Video calls', 'Streaming'];
  const needDown = people * 50 + (uses.includes('Some gaming') ? 50 : 0);
  const needUp = uses.includes('Video calls') ? people * 15 : people * 5;
  const all = catalog.providers.flatMap((p) => p.plans.map((pl) => ({ ...pl, provider: p.name })));
  const rows = catalog.compare.map((id) => all.find((p) => p.id === id)).filter(Boolean).map((pl) => {
    const cost24 = pl.price * Math.min(24, pl.promoMonths || 24) + (pl.promoMonths ? pl.afterPromo * (24 - pl.promoMonths) : 0);
    const current = facts.plan && pl.id === facts.plan.id;
    let fits = 'yes', note = `Room for all ${people} of you`;
    if (current && facts.headline && facts.headline.status === 'below') { fits = 'partly'; note = 'Slow in the evening'; }
    else if (pl.promoMonths) { fits = 'partly'; note = 'Price jumps in year two'; }
    else if (pl.up < needUp) { fits = 'partly'; note = 'Upload is tight for calls'; }
    else if (pl.down < needDown) { fits = 'partly'; note = 'Tight for your household'; }
    return { ...pl, cost24, current, fits, note };
  });
  const candidates = rows.filter((r) => r.fits === 'yes' && !r.current).sort((a, b) => a.cost24 - b.cost24);
  const pick = candidates[0] || null;
  const cheapest = rows.slice().sort((a, b) => a.cost24 - b.cost24)[0];
  const price = facts.plan ? facts.plan.price : null;
  return { rows, pick, cheapest, needDown, needUp, people, uses,
    savingsMonth: pick && price != null ? price - pick.price : null,
    savingsYear: pick && price != null ? (price - pick.price) * 12 : null };
}
