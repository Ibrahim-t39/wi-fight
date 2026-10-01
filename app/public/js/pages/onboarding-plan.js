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
  go('dashboard.html');
});

/* ---------- scan your bill with Proof AI ---------- */
const file = $('#billfile'), thumb = $('#thumb');
const STEPS = ['Reading the photo', 'Finding prices and fees', 'Checking fee names'];
let thumbUrl = null, bill = null, runId = 0;
const status = await AI.status();
const show = (id) => ['scanOff', 'scanIdle', 'scanWork'].forEach((k) => { $('#' + k).hidden = k !== id; });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function drawSteps(active, failed = false) {
  $('#aisteps').innerHTML = STEPS.map((s, i) => { const st = i < active ? 'done' : i === active && !failed ? 'run' : 'wait'; return `<span class="aistep" data-step="${st}"><i class="${st === 'done' ? '' : st}">${st === 'done' ? TICK : ''}</i>${s}${st === 'done' ? '<em>Done</em>' : st === 'run' ? '<em class="run">Working</em>' : ''}</span>`; }).join('');
}

function resetScan() {
  runId++;
  if (thumbUrl) { URL.revokeObjectURL(thumbUrl); thumbUrl = null; }
  thumb.removeAttribute('src'); file.value = ''; bill = null;
  $('#scanMeta').textContent = '';
  show('scanIdle');
}

/** Shrink the photo in memory so it is quick to read. Returns a data URL that is used once and then dropped. */
async function toDataUrl(f) {
  const raw = () => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(f); });
  try {
    const bmp = await createImageBitmap(f);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(bmp.width * scale)); c.height = Math.max(1, Math.round(bmp.height * scale));
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); if (bmp.close) bmp.close();
    return c.toDataURL('image/jpeg', 0.85);
  } catch { return raw(); }
}

const num = (v) => { const x = parseFloat(String(v).replace(/[^0-9.]/g, '')); return Number.isFinite(x) ? Math.round(x * 100) / 100 : 0; };
const total = () => Math.round((bill.planPrice + bill.equipment + bill.fees.reduce((a, f) => a + f.amount, 0)) * 100) / 100;

function drawFields() {
  const row = (cls, label, value) => `<div class="frow ${cls}">${label}<div class="fv">${value}</div></div>`;
  const amt = (key, v, name) => `$<input type="text" inputmode="decimal" data-f="${key}" value="${v == null ? '' : Number(v).toFixed(2)}" aria-label="${esc(name)}">`;
  const fees = bill.fees.map((f, i) => row(f.junk ? 'flag' : '', `<label class="fl"><input type="text" data-fee-name="${i}" value="${esc(f.name || '')}" aria-label="Fee name">${f.junk ? '<span class="badge warn">Possible junk fee</span>' : ''}${f.junk && f.why ? `<span class="why">${AI.html(f.why)}</span>` : ''}</label>`, amt('fee' + i, f.amount, `${f.name || 'Fee'} amount`))).join('');
  $('#frows').innerHTML = row('', '<label class="fl" for="f-plan"><span>Plan price</span></label>', amt('planPrice', bill.planPrice, 'Plan price').replace('<input', '<input id="f-plan"'))
    + row('', '<label class="fl" for="f-eq"><span>Equipment rental</span></label>', amt('equipment', bill.equipment, 'Equipment rental').replace('<input', '<input id="f-eq"'))
    + fees
    + row('total', '<div class="fl"><span>Total</span></div>', '<output id="f-total"></output>')
    + row('', '<label class="fl" for="f-promo"><span>Promo price ends</span></label>', `<input class="txt" id="f-promo" type="text" data-f="promoEnds" value="${esc(bill.promoEnds || '')}" placeholder="No promo" aria-label="Promo price ends">`)
    + (bill.printedTotal != null ? '<div class="why" id="f-printed" style="font:500 12px/1.35 var(--body);color:var(--ink-3)"></div>' : '');
  drawTotal();
}
function drawTotal() {
  const t = total(); $('#f-total').textContent = money(t);
  const p = $('#f-printed'); if (p) p.textContent = Math.abs(t - bill.printedTotal) > 0.005 ? `The total printed on the bill was ${money(bill.printedTotal)}. The total above adds up the fields.` : '';
}
$('#frows').addEventListener('input', (e) => {
  const el = e.target; if (!bill) return;
  if (el.dataset.feeName != null) bill.fees[Number(el.dataset.feeName)].name = el.value;
  else if (el.dataset.f === 'promoEnds') bill.promoEnds = el.value.trim() || null;
  else if (el.dataset.f && el.dataset.f.startsWith('fee')) bill.fees[Number(el.dataset.f.slice(3))].amount = num(el.value);
  else if (el.dataset.f) bill[el.dataset.f] = num(el.value);
  drawTotal(); $('#billOk span').textContent = 'Looks right'; $('#billOk').disabled = false;
});

async function scan(f) {
  const my = ++runId;
  if (!f.type.startsWith('image/')) { toast('Choose a photo of your bill.'); file.value = ''; return; }
  if (thumbUrl) URL.revokeObjectURL(thumbUrl);
  thumbUrl = URL.createObjectURL(f); thumb.src = thumbUrl;
  show('scanWork');
  $('#scanText').hidden = true; $('#scanErr').hidden = true; $('#scanActions').hidden = true; $('#frows').innerHTML = ''; $('#scanChips').innerHTML = ''; $('#scanNote').textContent = '';
  $('#scanMeta').textContent = 'Reading now';
  drawSteps(0);
  let res = null, failed = false;
  // The data URL exists only inside this call. It goes to AI.readBill once and is not kept anywhere.
  const reading = toDataUrl(f).then((dataUrl) => AI.readBill(dataUrl)).then((r) => { res = r; }).catch(() => { failed = true; });
  for (let i = 0; i < STEPS.length; i++) { if (my !== runId) return; drawSteps(i); await sleep(650); if (i === STEPS.length - 1) await reading; }
  if (my !== runId) return;
  if (failed || !res || !res.fields) {
    drawSteps(0, true); $('#scanMeta').textContent = 'Not read';
    $('#scanErr').textContent = 'Proof AI could not read that photo. Try again with a sharper photo, or pick your plan from the list.'; $('#scanErr').hidden = false;
    $('#scanActions').hidden = false; $('#billOk').hidden = true; $('#billEdit').hidden = true; return;
  }
  drawSteps(STEPS.length);
  const fl = res.fields;
  bill = { planPrice: num(fl.planPrice ?? 0), equipment: num(fl.equipment ?? 0), fees: (fl.fees || []).map((x) => ({ name: String(x.name || ''), amount: num(x.amount ?? 0), junk: !!x.junk, why: x.why ? String(x.why) : '' })), promoEnds: fl.promoEnds ? String(fl.promoEnds) : null, printedTotal: fl.total == null ? null : num(fl.total), mode: res.mode };
  drawFields();
  const junk = bill.fees.filter((x) => x.junk);
  const junkLine = junk.length === 1 ? `**one ${money(junk[0].amount)} fee looks like a junk fee**` : junk.length ? `**${junk.length} fees look like junk fees**` : 'no fee looks like a junk fee';
  // Live: Claude read the photo. Offline: say plainly that these are sample values, using the note from ai.js.
  const text = res.mode === 'live' ? `I read your bill. You pay **${money(total())} a month**, and ${junkLine}. Check the fields and fix anything I got wrong.` : res.note || 'Offline mode cannot read a real photo. These are sample values.';
  $('#scanText').innerHTML = AI.html(text); $('#scanText').hidden = false;
  const found = 2 + bill.fees.length + 1 + (bill.promoEnds ? 1 : 0);
  const chips = res.mode === 'live' ? [`Confidence: ${res.confidence}`, 'Based on 1 photo', `${found} fields found`] : ['Confidence: none, sample values', 'Not read from your photo', `${found} fields filled`];
  $('#scanChips').innerHTML = chips.map((c) => `<span class="evidence">${esc(c)}</span>`).join('');
  $('#scanNote').textContent = `${AI.note(res.mode)} Check each field before you continue.`;
  $('#scanMeta').textContent = res.mode === 'live' ? 'Read just now · live' : 'Sample values · offline mode';
  $('#scanActions').hidden = false; $('#billOk').hidden = false; $('#billEdit').hidden = false; $('#billOk').disabled = false; $('#billOk span').textContent = 'Looks right';
  // A live read can name the plan. If it matches the catalog, select it and mark it as coming from the bill.
  if (res.mode === 'live' && fl.plan) { const want = String(fl.plan).toLowerCase(); const hit = allPlans.find((p) => p.name.toLowerCase() === want); if (hit) { choose(hit.id, 'bill'); toast(`Proof AI matched your bill to ${hit.name}.`); } }
}

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
  $('#photoHow').textContent = status.live ? 'The photo stays in this page while you check the fields. It is sent once to Claude to be read, and it is gone when you leave this page.' : 'The photo stays in this page while you check the fields and is gone when you leave. Proof AI is in offline mode, so the photo is not sent anywhere and cannot be read. You will get sample values to edit.';
}
window.addEventListener('pagehide', () => { if (thumbUrl) URL.revokeObjectURL(thumbUrl); });
document.documentElement.dataset.ready = '1';
