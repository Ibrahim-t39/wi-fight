// Sample two-week dataset for demos. Clearly labelled as sample data everywhere it is shown.
// Deterministic: the same call always returns the same tests.
export const SAMPLE_MEDIANS = [461, 447, 452, 431, 418, 389, 372, 381, 366, 394, 389, 384, 377, 369];
export const SAMPLE_PLAN = { id: 'ns500', provider: 'Northstar Fiber', name: 'Northstar Fiber 500', down: 500, up: 20, latency: 30, price: 80, source: 'picked' };
export const SAMPLE_BILL = { planPrice: 65, equipment: 10, fees: [{ name: 'Network enhancement fee', amount: 5, junk: true }], total: 80, promoEnds: 'Jan 2027' };
const TIMES = [[9, 40], [15, 40], [19, 40], [21, 40]];

export function buildSample(days = 9, today = new Date()) {
  const end = new Date(today); end.setHours(0, 0, 0, 0);
  const start = new Date(end.getTime() - (days - 1) * 86400000);
  const tests = [];
  let id = 1;
  const add = (date, h, m, down, extra = {}) => { const t = new Date(date); t.setHours(h, m, 0, 0); tests.push({ id: 's' + id++, t: t.toISOString(), down, up: extra.up ?? 22, latency: extra.latency ?? 28, location: extra.location || 'normal', source: 'sample' }); };
  for (let i = 0; i < days; i++) {
    const date = new Date(start.getTime() + i * 86400000);
    const m = SAMPLE_MEDIANS[i];
    const low = m < 400;
    const offs = low ? [45, 10, -10, -60] : [20, 6, -6, -20];
    const ups = [23, 22, 22, 21], lats = [26, 27, 29, 31];
    TIMES.forEach(([h, mi], k) => add(date, h, mi, m + offs[k], { up: ups[k], latency: lats[k] }));
    if (i === 3) add(date, 14, 10, 96, { up: 19, latency: 41 });   // one-off dip
    if (i === 4) add(date, 8, 5, 141, { up: 19, latency: 36 });    // one-off dip
    if (i === 6) { add(date, 20, 5, 394, { location: 'near' }); add(date, 20, 8, 373, { location: 'far' }); }
    if (i === 7) { add(date, 20, 15, 390, { location: 'near' }); add(date, 20, 18, 369, { location: 'far' }); }
  }
  const clock = new Date(end); clock.setHours(21, 46, 0, 0);
  return { tests, startedAt: start.toISOString(), clock: clock.toISOString() };
}
