import { boot, bind, $, $$, esc, badge, Store } from '../shell.js';
import { modelStack, stackHTML } from '../models.js';
import { flagOutliers, summarize, median, round, dayKey, fmtTime, FAIR, STREAK } from '../engine.js';
import { buildSample, SAMPLE_PLAN } from '../sample.js';

// Public page: it opens in every state, including a wiped store and a visitor who is not signed in.
await boot({ need: 'none' });

// Small icons for the tick lists and theme cards, so the page markup stays short.
const IC = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  lim: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 6v7M12 17.5v.5"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 5.6a3 3 0 0 0 1.9 1.9l5.6 1.9-5.6 1.9a3 3 0 0 0-1.9 1.9L12 20.800l-1.9-5.6a3 3 0 0 0-1.9-1.9l-5.6-1.9 5.6-1.9a3 3 0 0 0 1.9-1.9z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
};
$$('.tick i').forEach((i) => { const t = i.parentElement.classList; i.innerHTML = t.contains('lim') ? IC.lim : t.contains('next') ? IC.next : IC.check; });
$$('[data-ic]').forEach((i) => { i.innerHTML = IC[i.dataset.ic] || ''; });

// The AI models behind Proof AI, named from what the server reports. Nothing here names a model by hand.
const stack = await modelStack();
const host = stack.host ? stack.host.name : '';
$('#aiStatus').classList.add(stack.live ? 'good' : 'warn');
$('#models').dataset.live = stack.live ? '1' : '0';
bind({
  aiStatus: stack.live ? (stack.provider === 'local' ? 'Connected now, on this computer' : `Connected now${host ? `, through ${host}` : ''}`) : 'Offline mode on this computer',
  stackHtml: stackHTML(stack),
  whyOpen: !stack.live ? 'When a model is connected, this section names it and its maker. The live site uses openly published models, which the team chose because it can name exactly which model wrote each answer and swap it for another one, and because the host serves them quickly enough for a live demo.'
    : stack.provider === 'groq' ? `Why open models? They are openly published, so the team can name exactly which model wrote each answer and swap it for another one, and ${host} serves them quickly enough for a live demo.`
      : stack.provider === 'local' ? 'This model is openly published and runs on this computer, so the team can name it, swap it for another one, and keep every question on this device.'
        : 'The server is using a hosted model right now. The team prefers openly published models, because it can name exactly which model wrote each answer and swap it for another one.',
  fairPct: Math.round(FAIR * 100), streak: STREAK,
});
const enc = Store.isEncrypted();
$('#encStatus').classList.add(enc ? 'good' : 'warn');
bind({
  encStatus: enc ? 'Encryption is on in this browser.' : 'Encryption is not available in this browser.',
  encStatusNote: enc ? 'AES-GCM 256 with a key that cannot be read out.' : 'Data is stored on this device without encryption.',
});

// Interactive demonstration: the real one-off dip detector on day 4 of the sample two weeks.
const DAY = 4;
const WINDOW = 36 * 3600 * 1000; // the same 36 hours the engine uses, only to show the numbers behind a result that was not flagged
const sample = buildSample(9);
const key = dayKey(new Date(new Date(sample.startedAt).getTime() + (DAY - 1) * 86400000));
const dayTests = sample.tests.filter((t) => t.location === 'normal' && dayKey(t.t) === key).sort((a, b) => new Date(a.t) - new Date(b.t));
const dip = dayTests.reduce((a, b) => (b.down < a.down ? b : a));
const original = dip.down;
const range = $('#dipRange'), num = $('#dipNum');
const MIN = Number(range.min), MAX = Number(range.max);

// The demo always uses sample values, so its chip shows in every state.
const chip = $('#demoSample'); chip.hidden = false; chip.classList.add('show');
bind({ demoIntro: `These are the ${dayTests.length} tests from day ${DAY} of the sample two weeks. One of them, at ${fmtTime(dip.t)}, came in at ${original} Mbps. Change that number and watch the engine decide.` });

function render(value) {
  const v = Math.min(MAX, Math.max(MIN, Math.round(Number(value) || MIN)));
  range.value = v; if (document.activeElement !== num) num.value = v;
  const tests = sample.tests.map((t) => (t.id === dip.id ? { ...t, down: v } : t));

  // The decision: the real engine call.
  const hit = flagOutliers(tests).get(dip.id);

  // The numbers behind it. When flagged, the engine returns them. When not flagged, the engine returns nothing,
  // so the same formula is applied here with the engine's own median() to show why.
  const near = tests.filter((t) => t.location === 'normal' && t.id !== dip.id && Math.abs(new Date(t.t) - new Date(dip.t)) <= WINDOW).map((t) => t.down);
  const med = median(near);
  const mad = Math.max(median(near.map((x) => Math.abs(x - med))), med * 0.05);
  const z = hit ? hit.z : round((0.6745 * (v - med)) / mad, 1);
  const localMedian = hit ? hit.localMedian : round(med);
  const cut = round(med * 0.6);

  // The effect on the day, from the same summarize() every page uses.
  const facts = summarize({ plan: SAMPLE_PLAN, tests, startedAt: sample.startedAt, clock: sample.clock, sample: true });
  const day = facts.days[DAY - 1];

  $('#demoChips').innerHTML = dayTests.map((t) => {
    const mine = t.id === dip.id;
    return `<div class="tchip${mine ? ' edit' + (hit ? ' flag' : '') : ''}"><small>${esc(fmtTime(t.t))}${mine ? ' · yours to change' : ''}</small><b>${mine ? v : t.down}<i>Mbps</i></b></div>`;
  }).join('');
  $('#demoVerdict').innerHTML = hit ? badge('bad', 'Flagged as a one-off') : badge('good', 'Not flagged');
  $('#demoVerdict').dataset.flagged = hit ? '1' : '0';
  $('#demoVerdictNote').textContent = hit ? `${hit.reason}. It is left out of the day's median.` : `It is close enough to its neighbours, so it counts toward the day's median.`;
  $('#demoZ').textContent = z.toFixed(1);
  $('#demoZNote').textContent = `Flag needs a score under -3.5. ${z < -3.5 ? 'Met.' : 'Not met.'}`;
  $('#demoMed').innerHTML = `${localMedian}<span class="unit">Mbps</span>`;
  $('#demoMedNote').textContent = `From ${near.length} tests within 36 hours. Flag also needs under 60% of it, ${cut} Mbps. ${v < med * 0.6 ? 'Met.' : 'Not met.'}`;
  $('#demoDay').innerHTML = `${day.median}<span class="unit">Mbps</span>`;
  $('#demoDayNote').textContent = `Day ${DAY}, from ${day.n} of ${dayTests.length} tests. Fair line ${facts.fairLine} Mbps.`;
}

range.addEventListener('input', () => render(range.value));
num.addEventListener('input', () => { if (num.value !== '' && Number(num.value) >= MIN && Number(num.value) <= MAX) render(num.value); });
num.addEventListener('change', () => { num.blur(); render(num.value); });
$('#dipReset').addEventListener('click', () => { num.value = original; render(original); });
range.value = original; num.value = original;
render(original);
