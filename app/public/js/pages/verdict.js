// Verdict page: the two-week result. Every number comes from facts (the engine) or recommend().
import { boot, bind, $, esc, toast, badge, statusKind, barsHTML, xlabelsHTML, daysHTML, chipsHTML, reasonsHTML, labelHTML, AI } from '../shell.js';
import { recommend, fmtDate } from '../engine.js';
import { pause, bringIntoView } from './ui-sheet.js';

const { state, facts } = await boot({ need: 'plan' });
const plan = facts.plan;
const H = facts.headline;
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
bind({ planHtml: `<b style="color:var(--ink)">${esc(plan.name)}</b> · $${esc(plan.price)} a month` });

/* ---------- guided demo shortcut: three beats down the page ---------- */
let demoing = false;
window.wfDemoFill = async () => {
  if (demoing) return;
  demoing = true;
  const beat = async (el, ms) => { if (!el) return; await bringIntoView(el, 500); el.classList.add('beat'); await pause(ms); el.classList.remove('beat'); };
  try {
    if (!facts.complete) { await beat($('.waitcard'), 1500); return; }
    await beat($('#reveal'), 1900);
    await beat($('.aiwrap'), 2400);
    await beat($('#sharecard'), 1600);
  } finally { demoing = false; }
};

if (!facts.complete) {
  // ---------- in progress ----------
  $('#grid').hidden = true; $('#progress').hidden = false;
  const left = facts.totalDays - facts.daysDone;
  bind({
    eyebrow: H ? `Day ${facts.dayNumber} of ${facts.totalDays} · check in progress` : 'Your two-week check has not started',
    heading: 'Your verdict is on its way',
    waitText: `A fair verdict needs ${facts.totalDays} days of tests, so one slow evening cannot decide it. Wi-Fight keeps testing four times a day until then.`,
    waitDay: `${facts.daysDone} of ${facts.totalDays} days measured`,
    waitLeft: `${plural(left, 'day')} left`,
  });
  $('#pfill').style.width = `${(facts.daysDone / facts.totalDays) * 100}%`;
  $('.pbar').setAttribute('aria-label', `${facts.daysDone} of ${facts.totalDays} days measured`);
  $('#pdays').innerHTML = daysHTML(facts);
  if (!H) { $('#sofar').hidden = true; $('#nosofar').hidden = false; }
  else {
    $('#sofar').classList.add(H.status === 'below' ? 'isbad' : 'isgood');
    bind({
      sfBadgeHtml: badge(statusKind(H.status), `So far: ${H.statusWord.toLowerCase()}`), sfPct: H.pct,
      sfLine: `of the speed you pay for so far, from the median of ${H.basis}.`,
      sfGot: `${H.mbps} Mbps`, sfPaid: `${plan.down} Mbps`, sfBelow: `${facts.daysBelow} of ${facts.daysDone}`,
    });
  }
} else {
  // ---------- complete ----------
  const below = H.status === 'below';
  const range = `${fmtDate(facts.startDate)} to ${fmtDate(facts.endDate)}`;
  const dips = facts.ignored.length;
  bind({
    eyebrow: `Day ${facts.totalDays} of ${facts.totalDays} · check complete`,
    heading: `Your verdict is in${state.user && state.user.name ? ', ' + state.user.name : ''}`,
    statusHtml: badge(statusKind(H.status), H.statusWord), pct: H.pct,
    heroMsg: below ? `That is under the fair line of 80%.` : `Good news. Your provider is delivering what you pay for.`,
    fairLab: `Fair line: 80%, ${facts.fairLine} Mbps`, planLab: `${plan.down} Mbps`,
    paid: plan.down, got: H.mbps, below: facts.daysBelow, ofDays: `of ${facts.daysDone}`, lost: facts.money.lostMonth,
    basis: `Median of ${H.basis}, from ${plural(facts.testsCount, 'test')}. ${plural(dips, 'one-off dip')} ${dips === 1 ? 'was' : 'were'} ignored. The fair line is 80% of your plan, or ${facts.fairLine} Mbps. The dollar figure is an estimate.`,
    scPct: H.pct, scWord: H.statusWord, scGot: H.mbps, scPaid: plan.down, scDays: facts.daysDone,
    scFoot: `wi-fight · ${plural(facts.testsCount, 'test')}${facts.sample ? ' · sample data' : ''}`,
    reportTitle: below ? 'Send a report to your provider' : 'Keep a record of your results',
    reportText: `Proof AI drafts the report from your ${facts.daysDone} days of tests. You read it, edit it, and approve it. Nothing goes to ${plan.provider || plan.name.split(' ')[0]} until you say so.`,
    stripTitle: `All ${facts.totalDays} days`, stripSub: `Daily median download speed, ${range}`,
    stripBadgeHtml: badge(facts.daysBelow ? 'bad' : 'good', `${plural(facts.daysBelow, 'day')} below the fair line`),
    stripNoteHtml: `Dashed outline is your ${esc(plan.down)} Mbps plan. <b style="color:var(--bad)">Red</b> days fell below the fair line. ${plural(facts.daysDone - facts.daysBelow, 'day')} ${facts.daysDone - facts.daysBelow === 1 ? 'was' : 'were'} on plan.`,
    hexDays: facts.daysDone,
    rewardText: `You ran ${plural(facts.testsCount, 'test')} over ${facts.daysDone} days. That is enough proof to stand behind.`,
    rewardBadge: `${facts.daysDone} of ${facts.totalDays} days measured`,
  });
  $('#reveal').classList.add(below ? 'isbad' : 'isgood');
  $('#glow').classList.add(below ? 'bad' : 'good');
  $('#meterFill').style.cssText = `width:${Math.min(100, H.pct)}%;background:var(--${below ? 'bad' : 'good'})`;
  $('#meter').setAttribute('aria-label', `${H.pct} percent of plan speed. The fair line is 80 percent.`);
  $('#gotVal').classList.add(below ? 'bad' : 'good');
  $('#sharecard').classList.add(below ? 'isbad' : 'isgood');
  $('#actReport').classList.toggle('lead', below); $('#recBadge').hidden = !below;
  $('#label').innerHTML = labelHTML(facts);
  $('#bars').innerHTML = barsHTML(facts, facts.days, { values: window.innerWidth > 720 });
  $('#xlabels').innerHTML = xlabelsHTML(facts.days, 'day');

  // ---------- share ----------
  const shareText = `My two-week internet verdict: I got ${H.pct}% of the speed I pay for. Measured ${H.mbps} Mbps, promised ${plan.down} Mbps. ${facts.daysBelow} of ${facts.daysDone} days were below the fair line. ${H.statusWord}. Checked with Wi-Fight${facts.sample ? ' (sample data)' : ''}.`;
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch { /* fall through to the older way */ }
    const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch { ok = false; } ta.remove(); return ok;
  };
  $('#shareBtn').onclick = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'My Wi-Fight verdict', text: shareText }); return; }
      catch (e) { if (e && e.name === 'AbortError') return; }
    }
    toast((await copy(shareText)) ? 'Summary copied. Paste it anywhere to share.' : 'Could not copy on this browser.');
  };
  $('#saveBtn').onclick = async () => {
    const canvas = await drawCard({ pct: H.pct, word: H.statusWord, below, got: H.mbps, paid: plan.down, days: facts.daysDone, foot: `wi-fight · ${plural(facts.testsCount, 'test')}${facts.sample ? ' · sample data' : ''}` });
    canvas.toBlob((blob) => {
      if (!blob) { toast('Could not make the image.'); return; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'wi-fight-verdict.png';
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
      toast('Image saved to your downloads.');
    }, 'image/png');
  };

  // ---------- plans sentence, from recommend() ----------
  try {
    const catalog = await (await fetch('data/plans.json')).json();
    const r = recommend(facts, catalog, state.household);
    const n = r.rows.length;
    bind({ plansText: `Compare ${plural(n, 'plan')} against how your household really uses the internet. ${r.pick ? (r.savingsYear > 0 ? `One could save about $${r.savingsYear} a year.` : `${r.pick.name} fits your household.`) : 'None is a clearly better fit right now.'}` });
  } catch { /* the card keeps its general sentence */ }

  // ---------- Proof AI ----------
  const ai = await AI.verdict(facts, state);
  bind({ aiSentenceHtml: AI.html(ai.sentence), aiReasonsHtml: reasonsHTML(ai.reasons || []), aiChipsHtml: chipsHTML(ai.chips || []), aiNote: AI.note(ai.mode), aiMeta: `Based on tests from ${range} · ${ai.mode === 'live' ? 'live' : 'offline mode'}` });
}

/** Draw the share card with canvas calls only. 320 x 420 design units at 3x. */
async function drawCard(d) {
  const W = 320, Hh = 420, S = 3;
  const DISPLAY = '"Bricolage Grotesque", system-ui, sans-serif', BODY = 'Inter, system-ui, sans-serif';
  try { await Promise.all([`800 96px ${DISPLAY}`, `700 16px ${DISPLAY}`, `600 16px ${BODY}`, `700 12px ${BODY}`, `500 11px ${BODY}`].map((f) => document.fonts.load(f))); } catch { /* system fonts are fine */ }
  const c = document.createElement('canvas'); c.width = W * S; c.height = Hh * S;
  const x = c.getContext('2d'); x.scale(S, S);
  const rr = (l, t, w, h, r) => { x.beginPath(); x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r); x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath(); };
  const text = (s, px, py, font, color, align = 'center', spacing = '0px') => { x.font = font; x.fillStyle = color; x.textAlign = align; x.textBaseline = 'alphabetic'; try { x.letterSpacing = spacing; } catch { /* older browsers */ } x.fillText(s, px, py); };
  const width = (s, font, spacing = '0px') => { x.font = font; try { x.letterSpacing = spacing; } catch { /* older browsers */ } return x.measureText(s).width; };

  // border in the Proof AI gradient, black face
  const g = x.createLinearGradient(0, 0, W, Hh); g.addColorStop(0, '#2747F5'); g.addColorStop(0.55, '#8B5CF6'); g.addColorStop(1, '#2FD9A0');
  rr(0, 0, W, Hh, 30); x.fillStyle = g; x.fill();
  rr(1.5, 1.5, W - 3, Hh - 3, 28.5); x.fillStyle = '#000'; x.fill();
  // glow in the status colour
  x.save(); rr(1.5, 1.5, W - 3, Hh - 3, 28.5); x.clip(); x.translate(W / 2, Hh * 0.4); x.scale(1, 0.74);
  const glow = x.createRadialGradient(0, 0, 0, 0, 0, 190); glow.addColorStop(0, d.below ? 'rgba(229,72,77,.30)' : 'rgba(14,159,110,.32)'); glow.addColorStop(0.7, 'rgba(0,0,0,0)');
  x.fillStyle = glow; x.fillRect(-W, -Hh, W * 2, Hh * 2); x.restore();

  // brand
  const bf = `700 16px ${DISPLAY}`; const bw = width('Wi-Fight', bf, '-0.16px'); const bx = (W - (26 + 8 + bw)) / 2;
  rr(bx, 22, 26, 26, 8); x.fillStyle = '#2747F5'; x.fill();
  x.save(); x.translate(bx + 4.5, 26.5); x.scale(17 / 24, 17 / 24); x.strokeStyle = '#fff'; x.lineWidth = 2.4; x.lineCap = 'round'; x.lineJoin = 'round';
  x.stroke(new Path2D('M4.6 15.5A8 8 0 1 1 19.4 15.5')); x.stroke(new Path2D('m8.3 12.3 2.7 2.7 5-5.6')); x.restore();
  text('Wi-Fight', bx + 34, 41, bf, '#fff', 'left', '-0.16px');

  text('MY TWO-WEEK VERDICT', W / 2 + 0.7, 74, `700 10.5px ${BODY}`, '#8E96AB', 'center', '1.47px');

  // big number
  const nf = `800 96px ${DISPLAY}`, pf = `800 48px ${DISPLAY}`;
  const nw = width(String(d.pct), nf, '-4.8px'), pw = width('%', pf, '-1px'); const nx = (W - (nw + pw)) / 2;
  text(String(d.pct), nx, 160, nf, '#fff', 'left', '-4.8px'); text('%', nx + nw, 160, pf, '#AEB5C6', 'left', '-1px');
  text('of the speed I pay for', W / 2, 190, `600 16px ${BODY}`, '#fff');

  // status word
  const wf = `700 12px ${BODY}`; const ww = width(d.word, wf); const pillW = ww + 32, px0 = (W - pillW) / 2;
  const col = d.below ? '#FF6B6B' : '#3DDC97';
  rr(px0, 204, pillW, 24, 12); x.fillStyle = d.below ? 'rgba(255,107,107,.16)' : 'rgba(61,220,151,.16)'; x.fill();
  x.beginPath(); x.arc(px0 + 13, 216, 3, 0, Math.PI * 2); x.fillStyle = col; x.fill();
  text(d.word, px0 + 22, 220.5, wf, col, 'left');

  // three tiles
  const tw = (W - 40 - 16) / 3, ty = 316, th = 60;
  [[d.got, 'Mbps', 'got'], [d.paid, 'Mbps', 'promised'], [d.days, 'days', 'tested']].forEach(([v, u, lab], i) => {
    const l = 20 + i * (tw + 8);
    rr(l + 0.5, ty + 0.5, tw - 1, th - 1, 14); x.strokeStyle = '#2A3142'; x.lineWidth = 1; x.stroke();
    const vf = `800 22px ${DISPLAY}`, uf = `600 10px ${BODY}`;
    const vw = width(String(v), vf, '-0.44px'), uw = width(u, uf);
    const sx = l + (tw - (vw + 2 + uw)) / 2;
    text(String(v), sx, ty + 30, vf, '#fff', 'left', '-0.44px'); text(u, sx + vw + 2, ty + 30, uf, '#8E96AB', 'left');
    text(lab, l + tw / 2, ty + 47, `500 11px ${BODY}`, '#8E96AB');
  });
  text(d.foot, W / 2, Hh - 19, `600 10.5px ${BODY}`, '#6E768A', 'center', '0.42px');
  return c;
}
