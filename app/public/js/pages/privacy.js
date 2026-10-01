// Privacy and data: every line on this page is read from the store, and every control writes to it.
import { boot, bind, $, $$, esc, go, toast, download, AI, Store } from '../shell.js';
import { now, fmtDate, fmtTime, fmtWeekday, SCHEDULE } from '../engine.js';
import { openSheet, paintSwitch } from './ui-sheet.js';

const { facts } = await boot({ need: 'plan' });
const S = () => Store.get();
const when = (t) => `${fmtWeekday(t)}, ${fmtDate(t)} at ${fmtTime(t)}`;
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const WARN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 6v7M12 17v.5"/></svg>';
const isPaused = () => { const p = S().settings && S().settings.pausedUntil; return !!p && new Date(p) > now(S()); };
// All messages across saved conversations (the chat page stores them in state.chats).
const allMsgs = () => (S().chats || []).flatMap((c) => c.messages || []).concat(S().chat || []);
const userMsgs = () => allMsgs().filter((m) => m.role === 'user').length;

function paint() {
  const st = S(), enc = Store.isEncrypted(), sent = st.sent || [], set = st.settings || {};
  const method = st.user && st.user.method;
  const signin = method === 'code' ? 'Signed in with an email code, no password stored' : method === 'passkey' ? 'Signed in with a passkey, no password stored' : method === 'sample' ? 'Demo sign-in for sample data, no password stored' : 'Signed in on this device, no password stored';
  const lastSent = sent[sent.length - 1];
  const chk = (ok, text) => `<div class="chk${ok ? '' : ' warn'}"><i>${ok ? CHECK : WARN}</i>${esc(text)}</div>`;
  bind({
    eyebrow: `Account · ${st.user.name || st.user.email || 'you'}`,
    title: enc ? 'Your data is protected' : 'Your data is stored without encryption',
    statusBadgeHtml: `<span class="badge ${enc ? 'good' : 'warn'}"><span class="dot"></span>${enc ? 'All good' : 'Check this'}</span>`,
    encBadge: enc ? 'Encrypted on this device' : 'Stored on this device',
    statusLine: `Checked just now, ${fmtTime(new Date())}. ${sent.length ? `${plural(sent.length, 'report')} left through your own email app, the last on ${when(lastSent.at)}.` : 'Nothing has left your account.'}`,
    checksHtml: chk(enc, enc ? 'Encrypted on this device' : 'Not encrypted: this browser does not offer the encryption tools') + chk(true, signin) + chk(true, 'Kept in this browser only, not on a Wi-Fight server'),
    disk: Store.rawOnDisk().slice(0, 160) + (Store.rawOnDisk().length > 160 ? '…' : ''),
    diskCap: enc ? 'This is what is saved in your browser. It is encrypted with AES-GCM, so it cannot be read without the key held by this browser.' : 'This is what is saved in your browser. It is not encrypted, because this browser does not offer the encryption tools.',
    diskSize: `First 160 of ${Store.rawOnDisk().length.toLocaleString('en-US')} characters`,
    testsSub: !set.scheduled ? 'Scheduled tests are off.' : isPaused() ? `Paused until ${when(set.pausedUntil)}.` : `${SCHEDULE.length} tests a day. Next test ${facts.nextTest.paused ? 'when the pause ends' : facts.nextTest.label}.`,
    cTests: (st.tests || []).length, cPlan: st.plan ? 1 : 0, cBill: st.bill ? 1 : 0, cChat: userMsgs(), cAcct: st.user ? 1 : 0,
    dlNote: `One file with all ${plural((st.tests || []).length, 'result')} and your plan.`,
    sentNote: sent.length ? `${plural(sent.length, 'report')} opened in your email app.` : 'Nothing has been sent.',
    consentWhen: st.consent && st.consent.at ? `Given on ${when(st.consent.at)}${st.consent.viaSample ? ', when sample data was loaded' : ''}.` : 'No date recorded.',
    consentWhat: `You agreed to: speed tests through M-Lab, which publishes results with the IP address${st.consent && st.consent.ai ? '; and Proof AI reading your results.' : '. You did not agree to Proof AI at sign-up.'}`,
  });
  $('.shieldbig').classList.toggle('warn', !enc);
  $$('[data-switch]').forEach((b) => {
    const on = !!set[b.dataset.switch];
    paintSwitch(b, on);
    const w = $(`[data-word="${b.dataset.switch}"]`); w.textContent = on ? 'On' : 'Off'; w.className = on ? 'on' : 'off';
  });
  const paused = isPaused();
  $('#pause').hidden = paused; $('#resume').hidden = !paused;
  $('#pausenote').textContent = paused ? `Paused until ${when(set.pausedUntil)}` : 'Need a break? Tests start again on their own.';
  $('#pausenote').classList.toggle('strong', paused);
}

/* ---------- switches: saved the moment they change ---------- */
$$('[data-switch]').forEach((b) => { b.onclick = async () => {
  const k = b.dataset.switch;
  await Store.update((s) => { s.settings = { ...(s.settings || {}), [k]: !(s.settings && s.settings[k]) }; });
  paint(); toast(`${b.getAttribute('aria-label')}: ${S().settings[k] ? 'On' : 'Off'}. Saved.`);
}; });
$('#pause').onclick = async () => { const until = new Date(now(S()).getTime() + 24 * 3600 * 1000).toISOString(); await Store.update((s) => { s.settings = { ...(s.settings || {}), pausedUntil: until }; }); paint(); toast('Tests paused for 24 hours'); };
$('#resume').onclick = async () => { await Store.update((s) => { s.settings = { ...(s.settings || {}), pausedUntil: null }; }); paint(); toast('Tests resumed'); };

/* ---------- what we hold: View sheets ---------- */
const kv = (k, v) => `<div class="kv"><span class="k">${esc(k)}</span><span class="v">${esc(v == null || v === '' ? 'None' : v)}</span></div>`;
const done = '<button class="btn sm" data-close style="width:100%;margin-top:16px">Done</button>';
const LOC = { normal: 'Regular', near: 'Near router', far: 'Far room' };
const SRC = { mlab: 'M-Lab', practice: 'Practice', sample: 'Sample' };
const VIEWS = {
  tests: () => { const t = (S().tests || []).slice().sort((a, b) => new Date(b.t) - new Date(a.t));
    return `<div class="h3">Speed results</div><p class="small" style="margin:4px 0 12px">${plural(t.length, 'result')}, newest first. Download, upload in Mbps. Response time in ms.</p>${t.length ? `<div class="vscroll"><table class="vt"><tr><th>When</th><th>Down</th><th>Up</th><th>Resp.</th><th>Where</th><th>Source</th></tr>${t.map((x) => `<tr><td>${fmtDate(x.t)}, ${fmtTime(x.t)}</td><td>${esc(x.down)}</td><td>${esc(x.up == null ? '' : x.up)}</td><td>${esc(x.latency == null ? '' : x.latency)}</td><td>${esc(LOC[x.location || 'normal'] || x.location)}</td><td>${esc(SRC[x.source] || x.source || '')}</td></tr>`).join('')}</table></div>` : '<p class="body">No speed results are stored.</p>'}`; },
  plan: () => { const p = S().plan; return `<div class="h3">Plan and price</div>${p ? kv('Provider', p.provider) + kv('Plan', p.name) + kv('Download on the label', `${p.down} Mbps`) + kv('Upload on the label', `${p.up} Mbps`) + kv('Response time on the label', `${p.latency} ms`) + kv('Price', `$${p.price} a month`) + kv('How it was added', p.source) : '<p class="body">No plan is stored.</p>'}`; },
  photo: () => '<div class="h3">Bill photo</div><p class="body" style="margin-top:8px">Wi-Fight never stores a bill photo. A photo is read once to fill in the bill details, and only the details you confirm are kept.</p>',
  bill: () => { const b = S().bill; return `<div class="h3">Bill details</div>${b ? kv('Plan price', `$${b.planPrice}`) + kv('Equipment', `$${b.equipment}`) + (b.fees || []).map((f) => kv(`Fee: ${f.name}`, `$${f.amount}`)).join('') + kv('Total', `$${b.total}`) + kv('Promo ends', b.promoEnds) : '<p class="body" style="margin-top:8px">No bill details are stored.</p>'}`; },
  chat: () => { const c = allMsgs(); return `<div class="h3">Messages to Proof AI</div><p class="small" style="margin:4px 0 12px">${plural(userMsgs(), 'question')} from you and ${plural(c.length - userMsgs(), 'answer')}.</p>${c.length ? `<div class="vscroll col gap8">${c.map((m) => `<div class="msg"><b>${m.role === 'user' ? 'You' : 'Proof AI'} · ${fmtDate(m.t)}, ${fmtTime(m.t)}</b><div>${AI.html(m.text)}</div></div>`).join('')}</div>` : '<p class="body">No messages are stored.</p>'}`; },
  account: () => { const u = S().user || {}; return `<div class="h3">Name and email</div>${kv('Name', u.name) + kv('Email', u.email) + kv('Sign-in', u.method === 'code' ? 'Email code' : u.method === 'passkey' ? 'Passkey' : u.method === 'sample' ? 'Demo sign-in' : u.method)}<p class="small" style="margin-top:10px">No password is stored.</p>`; },
  sent: () => { const x = S().sent || []; return `<div class="h3">What was sent</div>${x.length ? `<p class="small" style="margin:4px 0 12px">Wi-Fight did not send these itself. Each line is a message it opened in your email app.</p><div class="vscroll col gap8">${x.map((m) => `<div class="msg"><b>${when(m.at)}</b><div>To: ${esc(m.to || 'no address')}</div><div>Subject: ${esc(m.subject)}</div><div>Report fingerprint: <span class="monoi">${esc(String(m.hash || '').slice(0, 4))}…${esc(String(m.hash || '').slice(-4))}</span></div><div>FCC page offered: ${m.fcc ? 'Yes' : 'No'}</div></div>`).join('')}</div>` : '<p class="body" style="margin-top:8px">Nothing has been sent.</p>'}`; },
};
document.addEventListener('click', (e) => { const v = e.target.closest('[data-view]'); if (v && VIEWS[v.dataset.view]) { e.preventDefault(); openSheet(VIEWS[v.dataset.view]() + done); } });

/* ---------- download, delete, withdraw ---------- */
$('#dl').onclick = () => { download('wi-fight-data.json', Store.exportJSON()); toast('Saved as wi-fight-data.json'); };

$('#wipe').onclick = () => {
  const st = S();
  const w = openSheet(`<div class="h3">Delete everything?</div>
    <p class="body" style="margin:8px 0 10px">This removes, from this browser, for good:</p>
    <ul class="dlist">
      <li>${plural((st.tests || []).length, 'speed result')}</li>
      <li>Your plan and price${st.bill ? ', and your bill details' : ''}</li>
      <li>${plural((st.chats || []).reduce((n, c) => n + (c.messages || []).length, 0) + (st.chat || []).length, 'message')} with Proof AI</li>
      <li>Your report draft and the list of what was sent (${(st.sent || []).length})</li>
      <li>Your name, email, settings, and consent record</li>
      <li>The encryption key, so nothing left behind can ever be read</li>
    </ul>
    <p class="small" style="margin:10px 0 16px">Results that M-Lab has already published cannot be taken back. This cannot be undone.</p>
    <div class="col gap8"><button class="btn danger" id="wipe-yes">Delete everything</button><button class="btn ghost" data-close>Keep my data</button></div>`);
  $('#wipe-yes', w).onclick = async () => { $('#wipe-yes', w).disabled = true; await Store.wipe(); go('index.html'); };
};

$('#withdraw').onclick = () => {
  const w = openSheet(`<div class="h3">Withdraw consent?</div>
    <p class="body" style="margin:8px 0 16px">No test of any kind can run without your consent, so all speed tests stop. Your stored results stay on this device until you delete them. You can agree again later.</p>
    <div class="col gap8"><button class="btn" id="withdraw-yes">Withdraw consent</button><button class="btn ghost" data-close>Cancel</button></div>`);
  $('#withdraw-yes', w).onclick = async () => { await Store.update((s) => { s.consent = null; }); go('onboarding-consent.html'); };
};

paint();
document.documentElement.dataset.privacy = '1';
