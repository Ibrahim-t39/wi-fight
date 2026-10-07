// Plans page: the pick and the table come from recommend() in the engine, over data/plans.json.
import { boot, bind, $, $$, esc, toast, badge, statusKind, closeSheet, Store } from '../shell.js';
import { recommend } from '../engine.js';

const { state, facts } = await boot({ need: 'plan' });
const catalog = await (await fetch('data/plans.json')).json();
const plan = facts.plan;
const H = facts.headline;
const bill = state.bill;
const USES = ['Online classes', 'Video calls', 'Streaming', 'Some gaming'];
const money = (n) => `$${Number(n).toLocaleString('en-US')}`;
const cents = (n) => `$${Number(n).toFixed(2)}`;
const num = (n) => Number(n).toLocaleString('en-US');
const people = (n) => `${n} ${n === 1 ? 'person' : 'people'}`;
const SPARK = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.900 5.600a3 3 0 0 0 1.900 1.900L21.400 11.400l-5.600 1.900a3 3 0 0 0-1.900 1.900L12 20.800l-1.900-5.600a3 3 0 0 0-1.900-1.900L2.600 11.400l5.600-1.900a3 3 0 0 0 1.900-1.900z"/></svg>';

// ---------- your plan now ----------
$('#empty').hidden = !!H;
bind({
  nowBadgeHtml: H ? badge(statusKind(H.status), H.statusWord) : '',
  planName: plan.name, planPay: `${money(plan.price)} a month`,
  planLine: H ? `You pay for ${plan.down} Mbps, and over ${H.basis} you got ${H.mbps} Mbps.` : `You pay for ${plan.down} Mbps. There are no tests yet, so Wi-Fight cannot say what you really get.`,
});
if (bill) {
  const fees = (bill.fees || []).map((f) => `<div class="kv"><span class="k row gap8" style="flex-wrap:wrap">${esc(f.name)}${f.junk ? ' <span class="badge warn">Possible junk fee</span>' : ''}</span><span class="v">${cents(f.amount)}</span></div>`).join('');
  $('#bill').innerHTML = `${bill.planPrice != null ? `<div class="kv"><span class="k">Plan price</span><span class="v">${cents(bill.planPrice)}</span></div>` : ''}
    ${bill.equipment ? `<div class="kv"><span class="k">Equipment rental</span><span class="v">${cents(bill.equipment)}</span></div>` : ''}${fees}
    ${bill.total != null ? `<div class="kv total"><span class="k">Total</span><span class="v">${cents(bill.total)}</span></div>` : ''}`;
  if (bill.promoEnds) { $('#promo').hidden = false; bind({ promoText: `Promo price ends ${bill.promoEnds}` }); }
} else {
  $('#bill').innerHTML = `<a class="addbill" href="onboarding-plan.html"><span class="itile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg></span><span><b>Add your bill to check for fees</b><br><span class="small">Wi-Fight lists each charge and flags fees that are not taxes.</span></span></a>`;
}
if (facts.money) {
  $('#lost').hidden = false;
  const m = facts.money;
  if (m.lostMonth > 0) bind({ lostHtml: `<b>About ${money(m.lostMonth)} a month</b> pays for speed you did not receive. That is ${m.pctLost}% of your ${money(m.price)} bill, and it is an estimate.` });
  else { $('#lost').classList.add('fine'); $('#lostIcon').className = 'itile good'; bind({ lostHtml: '<b>You are getting the speed you pay for.</b> None of your bill is paying for speed that did not arrive.' }); }
}

// ---------- pick, household, table ----------
let house = { people: (state.household && state.household.people) || 3, uses: ((state.household && state.household.uses) || USES.slice(0, 3)).slice() };
let skip = 0; // how many times "show another" was pressed
let shown = null;
const billEquip = bill && bill.equipment ? bill.equipment : null;

function render() {
  const r = recommend(facts, catalog, house);
  const cands = r.rows.filter((x) => x.fits === 'yes' && !x.current).sort((a, b) => a.cost24 - b.cost24);
  shown = cands.length ? cands[skip % cands.length] : null;
  const n = r.rows.length;
  const usesText = house.uses.length ? house.uses.map((u) => u.toLowerCase()).join(', ') : 'light use';

  // household controls
  $('#peopleLab').textContent = people(house.people);
  $('#less').disabled = house.people <= 1; $('#more').disabled = house.people >= 8;
  $$('[data-use]').forEach((b) => { const on = house.uses.includes(b.dataset.use); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });

  bind({
    pickMeta: `Based on ${facts.testsCount ? `your ${facts.testsCount} tests, ` : ''}${bill ? 'your bill, ' : ''}your household${facts.testsCount || bill ? ',' : ''} and ${n} plans near you`,
    needLine: `${people(house.people)} with ${usesText}: about ${r.needDown} Mbps download and ${r.needUp} Mbps upload at the same time.`,
    cmpTitle: `Compare all ${n} plans`,
    confChip: `Confidence: ${H ? 'medium' : 'low'}`,
    confText: H ? "Plan details can change, so check the provider's own label before you switch." : "No tests yet, so this uses your household only. Check the provider's label before switching.",
  });

  if (!shown) {
    $('#pickhead').innerHTML = `<div class="col gap8"><div class="pickname">No plan is a full fit</div><span class="badge warn" style="align-self:flex-start;height:28px;font-size:13px;padding:0 11px">Nothing to recommend</span></div>`;
    $('#reasons').innerHTML = `<div><span><b>None of the ${n} plans fully fits.</b> Your household needs about ${r.needDown} Mbps download and ${r.needUp} Mbps upload. See the notes in the table below.</span></div>`;
    $('#whynot').hidden = true; $('#labelBtn').disabled = true; $('#otherBtn').disabled = true;
  } else {
    $('#whynot').hidden = false; $('#labelBtn').disabled = false; $('#otherBtn').disabled = false;
    const diff = plan.price - shown.price, year = diff * 12;
    const save = year > 0 ? `<span class="badge good" style="align-self:flex-start;height:28px;font-size:13px;padding:0 11px">Saves about ${money(year)} a year</span>`
      : year < 0 ? `<span class="badge warn" style="align-self:flex-start;height:28px;font-size:13px;padding:0 11px">Costs about ${money(-year)} a year more</span>`
      : `<span class="badge lock" style="align-self:flex-start;height:28px;font-size:13px;padding:0 11px">Same price as now</span>`;
    $('#pickhead').innerHTML = `<div class="col gap8"><div class="pickname" id="pickName">${esc(shown.name)}</div>${save}</div><div class="num price">${money(shown.price)}<span class="unit">a month</span></div>`;
    const curRow = r.rows.find((x) => x.current);
    const nowEquip = billEquip != null ? `You pay ${money(billEquip)} a month for equipment rental today.` : curRow && curRow.equipmentFee ? `Your plan now lists ${money(curRow.equipmentFee)} a month.` : '';
    $('#reasons').innerHTML = [
      `<b>Enough speed for your household.</b> ${people(house.people)} ${house.people === 1 ? 'needs' : 'need'} about ${r.needDown} Mbps download and ${r.needUp} Mbps upload at once, and this plan lists ${num(shown.down)} and ${num(shown.up)}.`,
      diff > 0 ? `<b>${money(diff)} a month less than you pay now.</b> You would pay ${money(shown.price)} instead of ${money(plan.price)}, which is about ${money(year)} a year.`
        : diff < 0 ? `<b>${money(-diff)} a month more than you pay now.</b> You would pay ${money(shown.price)} instead of ${money(plan.price)}, which is about ${money(-year)} a year more.`
        : `<b>The same price you pay now.</b> It costs ${money(shown.price)} a month, just like your plan today.`,
      shown.equipmentFee ? `<b>Equipment fee of ${money(shown.equipmentFee)} a month listed.</b> ${esc(nowEquip)}` : `<b>No equipment fee listed.</b> ${esc(nowEquip)}`,
    ].map((t) => `<div><span>${t}</span></div>`).join('');
    const ch = r.cheapest;
    let why;
    if (ch.id === shown.id) why = `${esc(shown.name)} is also the cheapest of the ${n} plans over 24 months, at ${money(shown.cost24)}.`;
    else {
      const less = shown.cost24 - ch.cost24;
      const reason = ch.current ? 'it is the plan you are on now, and your tests show it running slow'
        : ch.promoMonths ? `its price goes from ${money(ch.price)} to ${money(ch.afterPromo)} after ${ch.promoMonths} months`
        : ch.up < r.needUp ? `its typical upload speed is ${num(ch.up)} Mbps, and your household needs about ${r.needUp}`
        : ch.down < r.needDown ? `its typical download speed is ${num(ch.down)} Mbps, and your household needs about ${r.needDown}`
        : ch.fits === 'yes' ? 'you asked to see another option' : ch.note.toLowerCase();
      why = `${esc(ch.name)} costs ${money(less)} less over 24 months, but ${esc(reason)}.`;
    }
    $('#whynot').innerHTML = `<b>Why not the cheapest?</b> ${why}`;
  }

  // ----- comparison table -----
  const lowest = Math.min(...r.rows.map((x) => x.price));
  const isRec = (x) => shown && x.id === shown.id;
  const tagOf = (x) => (isRec(x) ? 'Proof AI pick' : x.current ? 'Your plan now' : x.promoMonths ? `Promo for ${x.promoMonths} months` : x.price === lowest ? 'Lowest price' : x.provider);
  const after = (x) => (x.promoMonths ? [money(x.afterPromo), `After ${x.promoMonths} months`] : x.current && bill && bill.promoEnds ? ['Not listed', `Promo ends ${bill.promoEnds}`] : [money(x.price), 'No promo listed']);
  const cost = (x) => (x.promoMonths ? `${money(x.price)} x ${x.promoMonths}, then ${money(x.afterPromo)} x ${24 - x.promoMonths}` : `${money(x.price)} x 24${x.current && bill && bill.promoEnds ? ', if the price holds' : ''}`);
  const fit = (x) => (x.fits === 'yes' ? '<span class="badge good">Yes</span>' : '<span class="badge warn">Partly</span>');
  const row = (label, fn, last = '') => `<div class="lab${last}">${label}</div>` + r.rows.map((x) => `<div class="c${isRec(x) ? ' rec' : ''}${last}">${fn(x)}</div>`).join('');
  const cmp = $('#cmp');
  cmp.style.gridTemplateColumns = `minmax(170px,1.05fr) repeat(${n},minmax(0,1fr))`;
  cmp.innerHTML = '<div class="cap"></div>' + r.rows.map((x) => (isRec(x) ? `<div class="cap rec">${SPARK}Recommended for you</div>` : '<div class="cap"></div>')).join('')
    + '<div class="hd lab" style="justify-content:flex-end"><span class="eyebrow">What you get</span></div>'
    + r.rows.map((x) => `<div class="hd c${isRec(x) ? ' rec' : ''}" data-col="${esc(x.id)}"><span class="name">${esc(x.name)}</span><span class="small">${esc(tagOf(x))}</span><button class="btn ${isRec(x) ? 'primary' : 'ghost'} sm" data-label="${esc(x.id)}">See the label</button></div>`).join('')
    + row('Price now', (x) => `<span class="big">${money(x.price)}</span><small>a month</small>`)
    + row('Price after promo', (x) => { const [a, b] = after(x); return `${esc(a)}<small>${esc(b)}</small>`; })
    + row('Typical download', (x) => `${num(x.down)} Mbps${x.current && H ? `<small>You got ${H.mbps}</small>` : ''}`)
    + row('Typical upload', (x) => `${num(x.up)} Mbps${x.current && facts.upload ? `<small>You got ${facts.upload.mbps}</small>` : ''}`)
    + row('Cost over 24 months<small>Monthly price only</small>', (x) => `<span class="big">${money(x.cost24)}</span><small>${esc(cost(x))}</small>`)
    + row('Fits your household', (x) => `${fit(x)}<small data-fit="${esc(x.id)}">${esc(x.note)}</small>`, ' last');

  // ----- phone cards, recommended first -----
  const order = r.rows.slice().sort((a, b) => Number(isRec(b)) - Number(isRec(a)));
  $('#pcards').innerHTML = order.map((x) => `<div class="pcard${isRec(x) ? ' on' : ''}" data-card="${esc(x.id)}">
      <div class="top"><div class="col gap8">${isRec(x) ? '<span class="badge lock" style="align-self:flex-start">Recommended for you</span>' : `<span class="small">${esc(tagOf(x))}</span>`}<div class="nm">${esc(x.name)}</div></div><div class="pr">${money(x.price)}<small>${x.promoMonths ? `then ${money(x.afterPromo)}` : 'a month'}</small></div></div>
      <div class="pfacts"><div><span>Download</span>${num(x.down)} Mbps</div><div><span>Upload</span>${num(x.up)} Mbps</div><div><span>24 months</span>${money(x.cost24)}</div></div>
      <div class="fit"><span class="badge ${x.fits === 'yes' ? 'good' : 'warn'}">Fits: ${x.fits === 'yes' ? 'yes' : 'partly'}</span><span>${esc(x.note)}</span><button class="btn ghost sm" data-label="${esc(x.id)}" style="margin-left:auto">See the label</button></div>
    </div>`).join('');

  $$('[data-label]').forEach((b) => { b.onclick = () => openLabel(r.rows.find((x) => x.id === b.dataset.label)); });
  return { r, cands };
}

let last = render();

async function saveHouse() {
  skip = 0; $('#otherMsg').hidden = true;
  await Store.update((s) => { s.household = { ...(s.household || {}), people: house.people, uses: house.uses.slice() }; });
  last = render();
}
$('#less').onclick = () => { if (house.people > 1) { house.people -= 1; saveHouse(); } };
$('#more').onclick = () => { if (house.people < 8) { house.people += 1; saveHouse(); } };
$$('[data-use]').forEach((b) => { b.onclick = () => { const u = b.dataset.use; house.uses = USES.filter((x) => (x === u ? !house.uses.includes(u) : house.uses.includes(x))); saveHouse(); }; });

$('#labelBtn').onclick = () => { if (shown) openLabel(last.r.rows.find((x) => x.id === shown.id)); };
$('#otherBtn').onclick = () => {
  const msg = $('#otherMsg');
  if (last.cands.length < 2) {
    msg.hidden = false; msg.textContent = `There is no other full fit. ${last.cands.length ? `${last.cands[0].name} is the only plan of the ${last.r.rows.length} that fully fits your household.` : ''} The others are in the table below with the reason each one falls short.`;
    toast('No other plan fully fits your household.');
    return;
  }
  skip += 1; last = render();
  const i = skip % last.cands.length;
  msg.hidden = false; msg.textContent = `Showing option ${i + 1} of ${last.cands.length} that fully fit, ordered by cost over 24 months.`;
};

/** A plan's listed values in the Broadband Facts layout. */
function openLabel(p) {
  if (!p) return;
  closeSheet();
  const row = (k, v) => `<div class="bf-row" style="grid-template-columns:1.4fr 1fr"><span class="bf-k">${k}</span><span class="bf-p" style="text-align:right">${v}</span></div>`;
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet-back"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Broadband Facts for ${esc(p.name)}">
    <div class="bf" id="planLabel">
      <div class="bf-title">Broadband Facts</div>
      <div class="bf-sub">${esc(p.provider)}<b>${esc(p.name)}</b></div>
      <div class="bf-price"><span>Monthly price</span><b>${cents(p.price)}</b></div>
      ${row('Price after promo', p.promoMonths ? `${cents(p.afterPromo)} after ${p.promoMonths} months` : 'No promo listed')}
      ${row('Equipment fee', p.equipmentFee ? `${cents(p.equipmentFee)} a month` : 'None listed')}
      ${row('Typical download', `${num(p.down)} Mbps`)}
      ${row('Typical upload', `${num(p.up)} Mbps`)}
      ${row('Typical response time', p.latency == null ? 'Not published' : `${num(p.latency)} ms`)}
      ${row('Cost over 24 months', money(p.cost24))}
      ${row('Fits your household', `${p.fits === 'yes' ? 'Yes' : 'Partly'}. ${esc(p.note)}`)}
      <div class="bf-foot">Read the provider's own label before you switch.</div>
    </div>
    <button class="btn ghost sm" id="closeLabel" style="margin-top:14px;width:100%">Close</button></div>`;
  document.body.appendChild(wrap);
  const close = () => { closeSheet(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  $('.sheet-back', wrap).onclick = close;
  $('#closeLabel', wrap).onclick = close;
  $('#closeLabel', wrap).focus();
}
