// Landing page. Public: it reads the store only to decide where the "Start" buttons go.
import { Store, $, $$, bind, labelHTML } from '../shell.js';
import { summarize } from '../engine.js';
import { buildSample, SAMPLE_PLAN } from '../sample.js';

// Broadband Facts card from the labelled sample two weeks, computed by the same engine the app uses.
const sample = buildSample(9);
const facts = summarize({ plan: { ...SAMPLE_PLAN }, tests: sample.tests, startedAt: sample.startedAt, clock: sample.clock, sample: true });
$('#bf').innerHTML = labelHTML(facts);
const H = facts.headline;
bind({
  typical: `It is the speed the provider says most customers on the plan usually get. It is their promise, not a top speed. On this sample plan the label says ${facts.plan.down} Mbps.`,
  got: `The label only shows the promise. Wi-Fight adds your own measured middle value next to it. In this sample that is ${H.mbps} Mbps, which is ${H.pct}% of the label and ${H.mbps < facts.fairLine ? 'under' : 'over'} the ${facts.fairLine} Mbps fair line.`,
});

// Start buttons: new visitors begin at consent. Someone who finished setup goes straight to the dashboard.
const state = await Store.load();
const done = !!(state.consent && state.consent.mlab && state.user && state.plan);
$$('[data-cta]').forEach((a) => { a.href = done ? 'dashboard.html' : 'onboarding-consent.html'; });
document.documentElement.dataset.ready = '1';
