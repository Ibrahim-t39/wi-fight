import assert from 'node:assert/strict';
import { summarize, recommend, median } from '../public/js/engine.js';
import { buildSample, SAMPLE_PLAN } from '../public/js/sample.js';
import fs from 'node:fs';
const catalog = JSON.parse(fs.readFileSync(new URL('../public/data/plans.json', import.meta.url)));
const mk = (days) => { const s = buildSample(days, new Date('2026-09-30T12:00:00')); return { plan: { ...SAMPLE_PLAN }, tests: s.tests, startedAt: s.startedAt, clock: s.clock, sample: true, household: { people: 3, devices: 9, uses: ['Online classes', 'Video calls', 'Streaming', 'Some gaming'] }, settings: {} }; };

assert.equal(median([1, 2, 3, 4]), 2.5);
let f = summarize(mk(9));
console.log('day 9:', f.headline, 'daysBelow', f.daysBelow, 'streak', f.streak, 'ignored', f.ignored.map((x) => x.when + ' ' + x.down), 'tests', f.testsCount);
console.log('  eve/day', f.evening.avg, f.daytime.avg, 'router', f.router, 'diag', f.diagnosis.title, f.diagnosis.confidence, f.diagnosis.level, 'money', f.money, 'next', f.nextTest.label);
console.log('  days', f.days.map((d) => d.median).join(','));
console.log('  tod', f.timeOfDay.map((b) => b.label + ' ' + b.avg + ' ' + b.statusWord).join(' | '));
assert.equal(f.fairLine, 400); assert.equal(f.dayNumber, 9); assert.equal(f.headline.mbps, 389); assert.equal(f.headline.pct, 78); assert.equal(f.headline.status, 'below');
assert.deepEqual(f.days.slice(0, 9).map((d) => d.median), [461, 447, 452, 431, 418, 389, 372, 381, 366]);
assert.equal(f.ignored.length, 2); assert.ok(f.streak.flagged); assert.equal(f.diagnosis.cause, 'provider'); assert.equal(f.diagnosis.confidence, 86); assert.equal(f.money.lostMonth, 18);
f = summarize(mk(14));
console.log('day 14:', f.headline, 'complete', f.complete, 'daysBelow', f.daysBelow, 'streak', f.streak.len, 'tests', f.testsCount, 'diag', f.diagnosis.confidence);
assert.ok(f.complete); assert.equal(f.headline.mbps, 389); assert.equal(f.daysBelow, 9); assert.equal(f.streak.len, 9);
const r = recommend(f, catalog, mk(14).household);
console.log('pick:', r.pick && r.pick.name, 'saves/yr', r.savingsYear, r.rows.map((x) => `${x.name} $${x.cost24} ${x.fits} (${x.note})`).join(' | '));
assert.equal(r.pick.id, 'vl1000'); assert.equal(r.savingsYear, 120);
// a healthy connection must not be flagged
const ok = mk(9); ok.tests = ok.tests.map((t) => ({ ...t, down: t.location === 'normal' && t.down > 200 ? 470 + (t.down % 7) : t.down }));
f = summarize(ok); console.log('healthy:', f.headline.statusWord, f.diagnosis.title, 'ignored', f.ignored.length);
assert.equal(f.headline.status, 'on'); assert.equal(f.diagnosis.cause, 'none'); assert.equal(f.ignored.length, 2);
// a Wi-Fi problem must be diagnosed as Wi-Fi
const wifi = mk(9); wifi.tests = wifi.tests.map((t) => (t.location === 'near' ? { ...t, down: 480 } : t.location === 'far' ? { ...t, down: 210 } : t));
f = summarize(wifi); console.log('wifi case:', f.diagnosis.title, f.diagnosis.providerPct);
assert.equal(f.diagnosis.cause, 'wifi');
// no tests yet
f = summarize({ plan: { ...SAMPLE_PLAN }, tests: [] }); assert.equal(f.ready, false); assert.equal(f.headline, null);
console.log('ALL ENGINE TESTS PASSED');
