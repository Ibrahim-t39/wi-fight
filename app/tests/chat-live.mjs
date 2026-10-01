import { summarize } from '../public/js/engine.js';
import { buildSample, SAMPLE_PLAN, SAMPLE_BILL } from '../public/js/sample.js';
const s = buildSample(9); const state = { plan: { ...SAMPLE_PLAN }, bill: SAMPLE_BILL, tests: s.tests, startedAt: s.startedAt, clock: s.clock, sample: true, household: { people: 3, devices: 9 }, settings: {}, user: { name: 'Jordan' } };
const f = summarize(state);
const facts = { userFirstName: 'Jordan', plan: { name: f.plan.name, typicalDownloadMbps: f.plan.down, pricePerMonth: f.plan.price }, fairLineMbps: f.fairLine, dayNumber: f.dayNumber, totalDays: 14, checkComplete: f.complete, testsCount: f.testsCount, headline: { medianMbps: f.headline.mbps, percentOfPlan: f.headline.pct, status: f.headline.statusWord, basedOn: f.headline.basis }, daysBelowFairLine: f.daysBelow, daysMeasured: f.daysDone, longestRunBelowFairLine: f.streak.len, oneOffDipsIgnored: f.ignored.map((x) => ({ when: x.when, mbps: x.down })), eveningAverageMbps: f.evening.avg, daytimeAverageMbps: f.daytime.avg, routerCheck: { nearRouterMbps: f.router.near, farRoomMbps: f.router.far }, diagnosis: { likelyCause: f.diagnosis.title, confidencePercent: f.diagnosis.confidence, confidenceLevel: f.diagnosis.level }, money: { paidForNotReceivedPerMonth: f.money.lostMonth, percentOfBill: f.money.pctLost }, upload: { medianMbps: f.upload.mbps, status: f.upload.statusWord, planMbps: f.plan.up }, responseTime: { medianMs: f.latency.ms, status: f.latency.statusWord }, bestDay: { day: f.best.day, mbps: f.best.median }, worstDay: { day: f.worst.day, mbps: f.worst.median }, nextTest: f.nextTest.label, bill: SAMPLE_BILL, sampleData: true };
const ask = async (messages) => {
  const t0 = Date.now(); let first = null, text = '', meta = null;
  const r = await fetch('http://localhost:4810/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages, facts }) });
  const dec = new TextDecoder(); let buf = '';
  for await (const c of r.body) { buf += dec.decode(c, { stream: true }); let i; while ((i = buf.indexOf('\n\n')) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 2); const j = JSON.parse(l.slice(5)); if (j.delta) { if (first == null) first = Date.now() - t0; text += j.delta; } else meta = j; } }
  console.log(`\n>>> ${messages[messages.length - 1].content}\n${text}\n[first token ${first} ms, total ${Date.now() - t0} ms, ungrounded: ${JSON.stringify(meta && meta.ungrounded)}, provider: ${meta && meta.provider}]`);
  return text;
};
const m = [{ role: 'user', content: 'Why is my internet slow at night?' }];
m.push({ role: 'assistant', content: await ask(m) });
m.push({ role: 'user', content: 'So is that bad enough to complain about? What would I say?' });
m.push({ role: 'assistant', content: await ask(m) });
m.push({ role: 'user', content: 'What does response time mean, and is mine ok?' });
await ask(m);
await ask([{ role: 'user', content: 'Write me a poem about my cat.' }]);
