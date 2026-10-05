// Step 3: your plan. Pick it from the catalog, or let Proof AI read a bill photo.
// The bill photo lives in this page's memory only. It is never written to the store.
import { Store, AI, $, $$, go, toast, esc } from '../shell.js';
import { FAIR } from '../engine.js';

const state = await Store.load();
if (!state.consent || !state.consent.mlab) { go('onboarding-consent.html'); await new Promise(() => {}); }
if (!state.user) { go('onboarding-signin.html'); await new Promise(() => {}); }

const catalog = await (await fetch('data/plans.json')).json();
const providers = catalog.providers;
const allPlans = providers.flatMap((p) => p.plans.map((pl) => ({ ...pl, provider: p.name, providerId: p.id })));
const n = (x) => Number(x).toLocaleString('en-US');
const money = (x) => '$' + Number(x || 0).toFixed(2);
const CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7"/></svg>';
const CHEV = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';
const TICK = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7"/></svg>';

/* ---------- pick your plan ---------- */
let selected = state.plan ? allPlans.find((p) => p.id === state.plan.id) || null : null;
let planSource = state.plan && selected ? state.plan.source || 'picked' : 'picked';
let providerId = selected ? selected.providerId : providers[0].id;
const q = $('#q');

// A bill often prints the provider once and a short plan name ("Fiber 500"), while the plan list says "Northstar Fiber 500".
// They are the same plan when every word of the listed name appears in the provider plus plan read from the bill.
function samePlan(listed, provider, plan) {
  const words = (t) => String(t || '').toLowerCase().match(/[a-z0-9]+/g) || [];
  const have = new Set(words(`${provider || ''} ${plan || ''}`)); const want = words(listed);
  return want.length > 0 && words(plan).length > 0 && want.every((w) => have.has(w));
}
function matches() {
  const term = q.value.trim().toLowerCase();
  if (!term) return providers.map((p) => ({ ...p, shown: p.plans }));
  return providers.map((p) => {
    const whole = p.name.toLowerCase().includes(term);
    return { ...p, shown: whole ? p.plans : p.plans.filter((pl) => pl.name.toLowerCase().includes(term)) };
  }).filter((p) => p.shown.length);
}

function drawPick() {
  const list = matches();
  if (list.length && !list.some((p) => p.id === providerId)) providerId = list[0].id;
  const cur = list.find((p) => p.id === providerId);
  $('#pcount').textContent = `${list.length} provider${list.length === 1 ? '' : 's'}`;
  $('#providers').innerHTML = list.length ? list.map((p) => `<button type="button" class="lrow prow${p.id === providerId ? ' on' : ''}" data-provider="${esc(p.id)}" aria-pressed="${p.id === providerId}"><div class="itile ${p.id === providerId ? '' : 'mute'}" style="font:700 14px var(--body)">${esc(p.name.charAt(0))}</div><div class="grow"><div class="dt">${esc(p.name)}</div><div class="small">${p.shown.length} plan${p.shown.length === 1 ? '' : 's'}</div></div>${p.id === providerId ? `<span class="pcheck">${CHECK}</span>` : `<span style="color:var(--ink-3)">${CHEV}</span>`}</button>`).join('')
    : `<div class="empty" id="nomatch">No provider or plan matches "${esc(q.value.trim())}". Try a shorter search.</div>`;
  $('#plansTitle').textContent = cur ? `${cur.name} plans` : 'Plans';
  $('#plans').innerHTML = cur ? cur.shown.map((pl) => { const on = selected && selected.id === pl.id; return `<button type="button" class="radio-card${on ? ' on' : ''}" role="radio" aria-checked="${!!on}" data-plan="${esc(pl.id)}"><div class="row gap12"><span class="radio"></span><div><div class="dt">${esc(pl.name)}</div><div class="small pm">Typical download <b>${n(pl.down)} Mbps</b><span class="sep"> · </span><span class="up">upload <b>${n(pl.up)} Mbps</b></span></div></div></div><div class="price"><div class="num">$${n(pl.price)}</div><div class="small">a month</div></div></button>`; }).join('') : '';
  const shownPlan = selected && cur && selected.providerId === cur.id ? selected : null;
  $('#source').textContent = shownPlan ? `Demo values, set out like a provider's broadband label. Typical response time ${shownPlan.latency} ms.` : 'Demo values, set out like a provider\'s broadband label. A real build uses each provider\'s own label.';
}

function drawFair() {
  const start = $('#start');
  start.disabled = !selected;
  $('#fairBar').hidden = !selected;
  if (!selected) { $('#fairPlan').textContent = ''; $('#fairText').textContent = 'Pick a plan above to see your fair line.'; return; }
  const fair = Math.round(selected.down * FAIR), pct = FAIR * 100;
  $('#fairPlan').textContent = `${selected.name} · $${n(selected.price)} a month`;
  $('#fairText').innerHTML = `Your fair line is <b>${n(fair)} Mbps</b>, ${pct}% of the ${n(selected.down)} Mbps on your plan's label.`;
  $('.fair .bar b').style.width = pct + '%'; $('.fair .bar u').style.left = pct + '%';
  const mark = $('#fairMark'); mark.style.left = pct + '%'; mark.textContent = `${n(fair)} fair line`;
  $('#fairMax').textContent = n(selected.down);
}

function choose(id, source = 'picked') {
  selected = allPlans.find((p) => p.id === id) || null; planSource = source;
  if (selected) providerId = selected.providerId;
  drawPick(); drawFair();
}

q.addEventListener('input', drawPick);
$('#providers').addEventListener('click', (e) => { const b = e.target.closest('[data-provider]'); if (b) { providerId = b.dataset.provider; drawPick(); } });
$('#plans').addEventListener('click', (e) => { const b = e.target.closest('[data-plan]'); if (b) { choose(b.dataset.plan); const again = $(`[data-plan="${b.dataset.plan}"]`); if (again) again.focus(); } });
$$('[data-way]').forEach((w) => w.addEventListener('click', () => {
  $$('[data-way]').forEach((x) => x.classList.toggle('on', x === w));
  const target = $('#' + w.dataset.way); target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (w.dataset.way === 'pick') q.focus({ preventScroll: true });
}));
drawPick(); drawFair();

$('#start').addEventListener('click', async () => {
  if (!selected) return;
  $('#start').disabled = true;
  const p = selected;
  await Store.update((s) => {
    s.plan = { id: p.id, provider: p.provider, name: p.name, down: p.down, up: p.up, latency: p.latency, price: p.price, source: planSource };
    if (!s.tests || !s.tests.length) s.startedAt = new Date().toISOString();
  });
  // During the guided demo the next step is the first test. Otherwise the dashboard opens, with its empty state.
  let touring = false; try { const t = JSON.parse(localStorage.getItem('wf.tour.v1')); touring = !!(t && t.on); } catch { touring = false; }
  go(touring ? 'test.html' : 'dashboard.html');
});

/* ---------- scan your bill with Proof AI ---------- */
const file = $('#billfile'), thumb = $('#thumb'), stage = $('#stage'), boxes = $('#boxes');
const STEPS = ['Reading the photo', 'Finding prices and fees', 'Checking fee names'];
const REVEAL_GAP = 350;
let thumbUrl = null, bill = null, runId = 0, scanState = 'idle', current = null, takeOn = false;
const status = await AI.status();
// Bundled sample bills. They are fictional, and the page says so wherever they appear.
let manifest = { bills: [] };
try { manifest = await (await fetch('samples/manifest.json')).json(); } catch { manifest = { bills: [] }; }
const show = (id) => { ['scanOff', 'scanIdle', 'scanWork'].forEach((k) => { $('#' + k).hidden = k !== id; }); $('#scan').classList.toggle('wide', id === 'scanWork'); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OKMARK = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7"/></svg>';

/** Scroll so el sits just under whatever is fixed at the top (the phone header, and the demo bar on phones). */
function bring(el) {
  let off = 12;
  const top = $('.mtop'); if (top && getComputedStyle(top).display !== 'none') off += top.offsetHeight;
  const bar = $('.tour'); if (bar && bar.getBoundingClientRect().top < 40) off += bar.offsetHeight + 8;
  window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - off), behavior: 'smooth' });
}

function drawSteps(active, failed = false) {
  $('#aisteps').innerHTML = STEPS.map((s, i) => { const st = i < active ? 'done' : i === active && !failed ? 'run' : 'wait'; return `<span class="aistep" data-step="${st}"><i class="${st === 'done' ? '' : st}">${st === 'done' ? TICK : ''}</i>${s}${st === 'done' ? '<em>Done</em>' : st === 'run' ? '<em class="run">Working</em>' : ''}</span>`; }).join('');
}

function resetScan() {
  runId++;
  if (thumbUrl) { URL.revokeObjectURL(thumbUrl); thumbUrl = null; }
  thumb.removeAttribute('src'); file.value = ''; bill = null; current = null; takeOn = false; scanState = 'idle';
  boxes.innerHTML = ''; stage.classList.remove('reading');
  $('#scanMeta').textContent = '';
  show('scanIdle');
}

/** Shrink the photo in memory so it is quick to read. Returns a data URL that is used once and then dropped. */
async function toDataUrl(f, longSide = 1600) {
  const raw = () => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(f); });
  try {
    const bmp = await createImageBitmap(f);
    const scale = Math.min(1, longSide / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(bmp.width * scale)); c.height = Math.max(1, Math.round(bmp.height * scale));
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); if (bmp.close) bmp.close();
    return c.toDataURL('image/jpeg', 0.85);
  } catch { return raw(); }
}

const num = (v) => { const x = parseFloat(String(v).replace(/[^0-9.]/g, '')); return Number.isFinite(x) ? Math.round(x * 100) / 100 : 0; };
const total = () => Math.round((bill.planPrice + bill.equipment + bill.fees.reduce((a, f) => a + f.amount, 0)) * 100) / 100;

function drawFields() {
  const row = (key, cls, label, value, vcls = '') => `<div class="frow hid ${cls}" data-k="${key}">${label}<div class="fv ${vcls}">${value}</div></div>`;
  const amt = (key, v, name) => `$<input type="text" inputmode="decimal" data-f="${key}" value="${v == null ? '' : Number(v).toFixed(2)}" aria-label="${esc(name)}">`;
  const fees = bill.fees.map((f, i) => row('fee' + i, f.junk ? 'flag' : '', `<label class="fl"><input type="text" data-fee-name="${i}" value="${esc(f.name || '')}" aria-label="Fee name">${f.junk ? '<span class="badge warn">Possible junk fee</span>' : ''}${f.junk && f.why ? `<span class="why">${AI.html(f.why)}</span>` : ''}</label>`, amt('fee' + i, f.amount, `${f.name || 'Fee'} amount`))).join('');
  $('#frows').innerHTML = (bill.plan ? row('plan', '', '<div class="fl"><span>Plan on the bill</span></div>', esc(bill.plan), 'txtv') : '')
    + row('planPrice', '', '<label class="fl" for="f-plan"><span>Plan price</span></label>', amt('planPrice', bill.planPrice, 'Plan price').replace('<input', '<input id="f-plan"'))
    + row('equipment', '', '<label class="fl" for="f-eq"><span>Equipment rental</span></label>', amt('equipment', bill.equipment, 'Equipment rental').replace('<input', '<input id="f-eq"'))
    + fees
    + row('total', 'total', '<div class="fl"><span>Total</span></div>', '<output id="f-total"></output>')
    + row('promo', '', '<label class="fl" for="f-promo"><span>Promo price ends</span></label>', `<input class="txt" id="f-promo" type="text" data-f="promoEnds" value="${esc(bill.promoEnds || '')}" placeholder="No promo" aria-label="Promo price ends">`)
    + (bill.printedTotal != null ? '<div class="why" id="f-printed" style="font:500 12px/1.35 var(--body);color:var(--ink-3)"></div>' : '');
  drawTotal();
}
function drawTotal() {
  const t = total(); $('#f-total').textContent = money(t);
  const p = $('#f-printed'); if (p) p.textContent = Math.abs(t - bill.printedTotal) > 0.005 ? `The total printed on the bill was ${money(bill.printedTotal)}. The total above adds up the fields.` : '';
}
/** The short Proof AI summary, built only from the values now in the fields. */
function drawTake() {
  const junk = bill.fees.filter((x) => x.junk);
  const sum = Math.round(junk.reduce((a, f) => a + f.amount, 0) * 100) / 100;
  let s = `You pay **${money(total())} a month**.`;
  s += junk.length === 1 ? ` **${money(sum)}** of it is a fee that is not a tax.` : junk.length ? ` **${money(sum)}** of it is ${junk.length} fees that are not taxes.` : ' No fee on it looks like a junk fee.';
  if (bill.promoEnds) s += ` Your promo price ends **${bill.promoEnds}**.`;
  $('#scanText').innerHTML = AI.html(s);
}
$('#frows').addEventListener('input', (e) => {
  const el = e.target; if (!bill) return;
  if (el.dataset.feeName != null) bill.fees[Number(el.dataset.feeName)].name = el.value;
  else if (el.dataset.f === 'promoEnds') bill.promoEnds = el.value.trim() || null;
  else if (el.dataset.f && el.dataset.f.startsWith('fee')) bill.fees[Number(el.dataset.f.slice(3))].amount = num(el.value);
  else if (el.dataset.f) bill[el.dataset.f] = num(el.value);
  drawTotal(); if (takeOn) drawTake();
  $('#billOk span').textContent = 'Looks right'; $('#billOk').disabled = false;
});

/* Comparing what the model read with the known values of a bundled sample. */
const norm = (x) => String(x == null ? '' : x).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
/** "March 2027", "Mar 2027", and "03/2027" all mean the same month. */
function monthYear(x) {
  const t = norm(x); const y = /\b(20\d\d)\b/.exec(t);
  let m = MONTHS.findIndex((k) => new RegExp('\\b' + k).test(t));
  if (m < 0) { const d = /\b(0?[1-9]|1[0-2])\b/.exec(t.replace(/\b20\d\d\b/, ' ')); if (d) m = Number(d[1]) - 1; }
  return y && m >= 0 ? `${MONTHS[m]} ${y[1]}` : t;
}
const same = (a, b) => a != null && b != null && Math.abs(Number(a) - Number(b)) < 0.005;
/** Which line of the sample bill each fee the model returned belongs to: by amount first, then by position. */
function feeLines(fees, known) {
  const kf = (known && known.fees) || []; const used = new Set();
  const lines = fees.map((f) => { const j = kf.findIndex((k, idx) => !used.has(idx) && same(f.amount, k.amount)); if (j >= 0) used.add(j); return j; });
  return lines.map((j, i) => { if (j >= 0) return j; if (i < kf.length && !used.has(i)) { used.add(i); return i; } return -1; });
}
/** Field by field: does the model's reading equal the sample's known value? Returns the real count. */
function compare(fl, known, lines) {
  const checks = [];
  const add = (key, ok) => checks.push({ key, ok: !!ok });
  if (fl.plan) add('plan', samePlan(known.plan, fl.provider, fl.plan));
  add('planPrice', same(fl.planPrice, known.planPrice));
  add('equipment', same(fl.equipment, known.equipment));
  (known.fees || []).forEach((k, j) => { const i = lines.indexOf(j); const f = i >= 0 ? (fl.fees || [])[i] : null; add(i >= 0 ? 'fee' + i : 'missingFee', f && same(f.amount, k.amount) && !!f.junk === !!k.junk); });
  add('total', same(fl.total, known.total));
  add('promo', monthYear(fl.promoEnds) === monthYear(known.promoEnds));
  const extra = lines.map((j, i) => (j < 0 ? 'fee' + i : null)).filter(Boolean);
  return { checks, extra, ok: checks.filter((c) => c.ok).length, of: checks.length };
}
/** A plan in the catalog that matches the bill: the sample's own plan, or the names the model read. */
function planFor(sample) {
  if (sample) return allPlans.find((p) => p.id === sample.planId) || null;
  if (!bill.plan) return null;
  return allPlans.find((p) => samePlan(p.name, bill.provider, bill.plan)) || null;
}

function addBox(sample, region, cls, tag) {
  const r = sample && sample.regions && sample.regions[region]; if (!r) return;
  const d = document.createElement('div'); d.className = 'hbox ' + cls; d.dataset.box = region;
  // A few pixels wider than the line so the outline does not sit on the text, and a hair shorter so neighbours do not touch.
  d.style.cssText = `left:calc(${r.x}% - 6px);top:calc(${r.y}% + 1px);width:calc(${r.w}% + 12px);height:calc(${r.h}% - 2px)`;
  if (tag) { const t = document.createElement('span'); t.className = 'tg'; t.textContent = tag; d.appendChild(t); }
  boxes.appendChild(d);
}

/** One scan, the same for an uploaded photo and for a bundled sample. sample is the manifest entry, or null. */
async function runScan({ src, getDataUrl, sample }) {
  const my = ++runId; bill = null; current = sample || null; takeOn = false; scanState = 'working';
  thumb.src = src; thumb.alt = sample ? `${sample.title}, a fictional sample bill` : 'The bill photo you chose';
  stage.classList.toggle('up', !sample); stage.classList.add('reading'); boxes.innerHTML = '';
  $('#billcap').textContent = sample ? 'A fictional sample bill. Shown here only.' : 'Your bill photo. Shown here only.';
  show('scanWork');
  $('#scanErr').hidden = true; $('#scanActions').hidden = true; $('#frows').innerHTML = ''; $('#scanChips').innerHTML = ''; $('#scanNote').textContent = '';
  $('#scanMatch').hidden = true; $('#scanOffNote').hidden = true; $('#usePlan').hidden = true; $('#take').hidden = false;
  $('#scanText').textContent = status.live ? 'Proof AI is reading the bill now. This takes a few seconds.' : 'Looking at the bill now.';
  $('#scanMeta').textContent = 'Reading now';
  drawSteps(0);
  let res = null, failed = false;
  // The data URL exists only inside this call. It goes to AI.readBill once and is not kept anywhere.
  const reading = Promise.resolve().then(getDataUrl).then((dataUrl) => AI.readBill(dataUrl, sample ? sample.fields : undefined)).then((r) => { res = r; }).catch(() => { failed = true; });
  for (let i = 0; i < STEPS.length; i++) { if (my !== runId) return; drawSteps(i); await sleep(650); if (i === STEPS.length - 1) await reading; }
  if (my !== runId) return;
  stage.classList.remove('reading');
  if (failed || !res || !res.fields || res.notBill) {
    drawSteps(0, true); $('#scanMeta').textContent = 'Not read'; $('#take').hidden = true; scanState = 'failed';
    $('#scanErr').textContent = res && res.notBill ? 'Proof AI does not think that photo is an internet bill, so it did not guess. Try a clearer photo of the bill, or pick your plan from the list.' : 'Proof AI could not read that photo. Try again with a sharper photo, or pick your plan from the list.'; $('#scanErr').hidden = false;
    $('#scanActions').hidden = false; $('#billOk').hidden = true; $('#billEdit').hidden = true; return;
  }
  drawSteps(STEPS.length);
  const fl = res.fields, live = res.mode === 'live';
  bill = { planPrice: num(fl.planPrice ?? 0), equipment: num(fl.equipment ?? 0), fees: (fl.fees || []).map((x) => ({ name: String(x.name || ''), amount: num(x.amount ?? 0), junk: !!x.junk, why: x.why ? String(x.why) : '' })), promoEnds: fl.promoEnds ? String(fl.promoEnds) : null, printedTotal: fl.total == null ? null : num(fl.total), provider: fl.provider ? String(fl.provider) : null, plan: fl.plan ? String(fl.plan) : null, mode: res.mode };
  drawFields();
  $('#scanMeta').textContent = live ? 'Read just now · live' : sample ? 'Known sample values · offline mode' : 'Sample values · offline mode';
  $('#scanText').textContent = live ? 'Here is what Proof AI read.' : 'Filling in the fields.';

  // Reveal one value at a time. On a bundled sample, each value also gets a box on its line of the bill.
  // The box positions come with the sample (manifest regions). A photo you upload has none, so it gets no boxes.
  const lines = feeLines(bill.fees, sample ? sample.fields : null);
  const got = { plan: !!fl.plan, planPrice: fl.planPrice != null, equipment: fl.equipment != null, total: fl.total != null, promo: !!fl.promoEnds };
  for (const rowEl of $$('#frows [data-k]')) {
    if (my !== runId) return;
    const k = rowEl.dataset.k;
    rowEl.classList.remove('hid'); rowEl.classList.add('pop');
    if (sample) {
      if (k.startsWith('fee')) { const i = Number(k.slice(3)); if (lines[i] >= 0) addBox(sample, 'fee' + lines[i], bill.fees[i].junk ? 'junk' : '', bill.fees[i].junk ? 'Possible junk fee' : ''); }
      else if (got[k]) addBox(sample, k, k === 'promo' ? 'promo' : '');
    }
    await sleep(REVEAL_GAP);
  }
  if (my !== runId) return;

  // The takeaway, with honest labels.
  const found = 2 + bill.fees.length + 1 + (bill.promoEnds ? 1 : 0) + (bill.plan ? 1 : 0);
  if (live || sample) { takeOn = true; drawTake(); } else $('#scanText').innerHTML = AI.html(res.note || 'Offline mode cannot read a real photo. These are sample values.');
  if (!live && sample) { $('#scanOffNote').textContent = res.note || 'Offline mode: no AI model is connected, so these are the known values of this bundled sample bill, not an AI reading.'; $('#scanOffNote').hidden = false; }
  if (live && sample) {
    // Proof that the model really read the image: its values against the sample's known values, counted for real.
    const c = compare(fl, sample.fields, lines);
    const bad = [...c.checks.filter((x) => !x.ok).map((x) => x.key), ...c.extra];
    bad.forEach((key) => { const fl2 = $(`#frows [data-k="${key}"] .fl`); if (fl2 && !$('.chk', fl2)) fl2.insertAdjacentHTML('beforeend', '<span class="chk">check this</span>'); });
    const m = $('#scanMatch'); m.classList.toggle('part', c.ok !== c.of || c.extra.length > 0);
    m.dataset.ok = c.ok; m.dataset.of = c.of;
    m.innerHTML = `${c.ok === c.of && !c.extra.length ? OKMARK : ''}<span>Matches the sample's known values: ${c.ok} of ${c.of}</span>${c.checks.some((x) => x.key === 'missingFee') ? '<span class="q">A fee on the bill was not read.</span>' : ''}${c.extra.length ? '<span class="q">The model also listed a fee that is not on the sample.</span>' : ''}`;
    m.hidden = false;
  }
  const hit = live || sample ? planFor(sample) : null;
  const use = $('#usePlan');
  if (hit) { use.dataset.plan = hit.id; use.textContent = `Use this plan: ${hit.name}`; use.disabled = false; use.hidden = false; }
  const chips = live ? [`Confidence: ${res.confidence}`, status.model ? `Model: ${status.model}` : null, sample ? 'Based on 1 sample bill' : 'Based on 1 photo', `${found} fields found`]
    : sample ? ['Confidence: none, not an AI reading', 'Known sample values', `${found} fields filled`]
      : ['Confidence: none, sample values', 'Not read from your photo', `${found} fields filled`];
  $('#scanChips').innerHTML = chips.filter(Boolean).map((c) => `<span class="evidence">${esc(c)}</span>`).join('');
  $('#scanNote').textContent = `${AI.note(res.mode)} ${sample ? 'The outlines mark where each value sits on this sample bill. ' : ''}Check each field before you continue.`;
  $('#scanActions').hidden = false; $('#billOk').hidden = false; $('#billEdit').hidden = false; $('#billOk').disabled = false; $('#billOk span').textContent = 'Looks right';
  $('#scan').dataset.mode = res.mode;
  scanState = 'done';
}

function scan(f) {
  if (!f.type.startsWith('image/')) { toast('Choose a photo of your bill.'); file.value = ''; return; }
  if (thumbUrl) URL.revokeObjectURL(thumbUrl);
  thumbUrl = URL.createObjectURL(f);
  return runScan({ src: thumbUrl, getDataUrl: () => toDataUrl(f), sample: null });
}
/** A bundled sample goes through the same scan as a photo: fetched, shrunk to a JPEG, and read. */
function useSample(id) {
  const b = manifest.bills.find((x) => x.id === id); if (!b || !state.consent.ai) return;
  const src = 'samples/' + b.file;
  return runScan({ src, getDataUrl: async () => toDataUrl(await (await fetch(src)).blob(), 1400), sample: b });
}

$('#samples').innerHTML = manifest.bills.map((b) => `<div class="scard"><span class="pic"><img src="samples/${esc(b.file)}" alt="${esc(b.title)}, a fictional sample" loading="lazy"></span><div class="sb"><div class="dt">${esc(b.title)}</div><div class="small">${esc(b.blurb)}</div><div class="sa"><button type="button" class="btn primary sm" data-sample="${esc(b.id)}">Use this bill</button><a class="dl" href="samples/${esc(b.file)}" download="${esc(b.file)}">Download</a></div></div></div>`).join('');
$('#samplesBlock').hidden = !manifest.bills.length;
$('#samples').addEventListener('click', (e) => { const b = e.target.closest('[data-sample]'); if (b) { useSample(b.dataset.sample); bring($('#scan')); } });
$('#usePlan').addEventListener('click', () => {
  const use = $('#usePlan'); const hit = allPlans.find((p) => p.id === use.dataset.plan); if (!hit) return;
  choose(hit.id, 'bill'); use.textContent = `Selected: ${hit.name}`; use.disabled = true;
  toast(`${hit.name} is selected below.`);
});

$('#choose').addEventListener('click', () => file.click());
file.addEventListener('change', () => { if (file.files && file.files[0]) scan(file.files[0]); });
$('#billAgain').addEventListener('click', resetScan);
$('#billEdit').addEventListener('click', () => { const first = $('#frows input'); if (first) { first.focus(); first.select(); } });
$('#billOk').addEventListener('click', async () => {
  if (!bill) return;
  // Numbers and fee names only. The photo and its data URL are never part of this object.
  const keep = { planPrice: bill.planPrice, equipment: bill.equipment, fees: bill.fees.map((f) => ({ name: f.name, amount: f.amount, junk: f.junk })), total: total(), promoEnds: bill.promoEnds, source: bill.mode === 'live' ? 'scan' : 'offline sample values', confirmedAt: new Date().toISOString() };
  await Store.update((s) => { s.bill = keep; });
  $('#billOk span').textContent = 'Saved'; $('#billOk').disabled = true;
  toast('Bill details saved on this device. The photo was not saved.');
});

if (!state.consent.ai) { show('scanOff'); $('#photoNote').hidden = true; $('.way.ai').classList.add('disabled'); $('.way.ai .k').textContent = 'Off. You did not agree to Proof AI'; }
else {
  show('scanIdle');
  $('#photoHow').textContent = status.provider === 'local' ? `The photo stays in this page while you check the fields. It is read once by a language model running on this computer (${status.model}), so it does not leave this device, and it is gone when you leave this page.`
    : status.live ? `The photo stays in this page while you check the fields. It is sent once to ${status.label || 'the AI service'} to be read, and it is gone when you leave this page.`
      : 'The photo stays in this page while you check the fields and is gone when you leave. Proof AI is in offline mode, so the photo is not sent anywhere and cannot be read. A bundled sample bill shows its known values. Your own photo gets sample values to edit.';
}
window.addEventListener('pagehide', () => { if (thumbUrl) URL.revokeObjectURL(thumbUrl); });

/* ---------- guided demo shortcut ("Do it for me") ---------- */
// The same buttons a person would press, with pauses. It never sends anything and never runs a speed test.
let filling = false;
window.wfDemoFill = async () => {
  if (filling) return; filling = true;
  try {
    if (state.consent.ai) {
      const ready = () => scanState === 'done' && current && current.id === 'northstar-bill';
      if (!ready()) {
        if (scanState !== 'working') {
          if (scanState !== 'idle') resetScan();
          bring($('#scan')); await sleep(900);
          const b = $('[data-sample="northstar-bill"]'); if (b) b.click();
        }
        for (let i = 0; i < 1100 && scanState === 'working'; i++) await sleep(100);
      }
      if (ready()) {
        await sleep(1100);
        if (!$('#billOk').disabled) { $('#billOk').click(); await sleep(900); }
        const use = $('#usePlan'); if (!use.hidden && !use.disabled && use.dataset.plan === 'ns500') { use.click(); await sleep(900); }
      }
    }
    if (!selected || selected.id !== 'ns500') {
      q.value = ''; q.dispatchEvent(new Event('input', { bubbles: true }));
      bring($('#pick')); await sleep(600);
      const pr = $('[data-provider="northstar"]'); if (pr) pr.click(); await sleep(500);
      const pl = $('[data-plan="ns500"]'); if (pl) pl.click(); await sleep(700);
    }
    if (!selected) return;
    bring($('.fair')); await sleep(1100);
    if (!$('#start').disabled) $('#start').click();
    await sleep(1500);
  } finally { filling = false; }
};
document.documentElement.dataset.ready = '1';
