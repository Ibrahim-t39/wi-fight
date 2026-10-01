// Step 2: sign in. This prototype has no email server and no sign-in server, and the page says so.
// The one-time code lives in this page's memory only. It is never written to the store.
import { Store, $, $$, go, bind } from '../shell.js';

const state = await Store.load();
if (!state.consent || !state.consent.mlab) { go('onboarding-consent.html'); await new Promise(() => {}); }

const email = $('#email'), emailField = $('#emailfield'), emailErr = $('#emailerr');
const card = $('#codecard'), boxes = $$('#otp input'), codeErr = $('#codeerr'), pkErr = $('#pkerr');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CODE_LIFE = 10 * 60 * 1000;
let pending = null; // { code, email, at }, memory only

if (state.user && state.user.email) email.value = state.user.email;

const show = (el, msg) => { el.textContent = msg || ''; el.hidden = !msg; };
const nameFrom = (addr) => { const p = addr.split('@')[0]; return p.charAt(0).toUpperCase() + p.slice(1); };
const validEmail = () => {
  const v = email.value.trim();
  const ok = EMAIL.test(v);
  emailField.classList.toggle('bad', !ok);
  show(emailErr, ok ? '' : v ? 'That does not look like an email address. Check it and try again.' : 'Enter your email address first.');
  if (!ok) email.focus();
  return ok ? v : null;
};
const randomCode = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');

function issue() {
  const addr = validEmail(); if (!addr) return;
  pending = { code: randomCode(), email: addr, at: Date.now() };
  card.hidden = false;
  bind({ email: addr });
  const note = $('#demonote');
  note.textContent = 'Demo sign-in: no email is sent in this prototype. Your code is ';
  const b = document.createElement('b'); b.id = 'democode'; b.textContent = pending.code; note.append(b, '.');
  boxes.forEach((i) => { i.value = ''; i.classList.remove('f'); });
  $('#otp').classList.remove('bad'); show(codeErr, '');
  boxes[0].focus();
  card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
$('#mailform').addEventListener('submit', (e) => { e.preventDefault(); issue(); });
$('#resend').addEventListener('click', issue);
email.addEventListener('input', () => { emailField.classList.remove('bad'); show(emailErr, ''); });

// Six boxes: typing moves forward, Backspace moves back, paste fills them all.
const fill = (digits, from = 0) => {
  digits.slice(0, 6 - from).split('').forEach((d, k) => { boxes[from + k].value = d; });
  boxes.forEach((i) => i.classList.toggle('f', !!i.value));
  boxes[Math.min(5, from + digits.length)].focus();
};
boxes.forEach((box, i) => {
  box.addEventListener('input', () => {
    $('#otp').classList.remove('bad'); show(codeErr, '');
    const d = box.value.replace(/\D/g, '');
    box.value = d.slice(-1);
    if (d.length > 1) { fill(d, i); return; }
    box.classList.toggle('f', !!box.value);
    if (box.value && i < 5) boxes[i + 1].focus();
  });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !box.value && i > 0) { boxes[i - 1].value = ''; boxes[i - 1].classList.remove('f'); boxes[i - 1].focus(); e.preventDefault(); }
    if (e.key === 'ArrowLeft' && i > 0) boxes[i - 1].focus();
    if (e.key === 'ArrowRight' && i < 5) boxes[i + 1].focus();
    if (e.key === 'Enter') verify();
  });
  box.addEventListener('paste', (e) => {
    const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '');
    if (!d) return;
    e.preventDefault(); $('#otp').classList.remove('bad'); show(codeErr, ''); fill(d, d.length >= 6 ? 0 : i);
  });
  box.addEventListener('focus', () => box.select());
});

async function verify() {
  const typed = boxes.map((b) => b.value).join('');
  const fail = (msg) => { $('#otp').classList.add('bad'); show(codeErr, msg); };
  if (!pending) return fail('Ask for a code first.');
  if (typed.length < 6) return fail('Enter all 6 digits.');
  if (Date.now() - pending.at > CODE_LIFE) return fail('That code has run out. Make a new code.');
  if (typed !== pending.code) return fail('That code is not right. Check it and try again.');
  const addr = pending.email; pending = null;
  await Store.update((s) => { s.user = { name: nameFrom(addr), email: addr, method: 'code' }; });
  go('onboarding-plan.html');
}
$('#verify').addEventListener('click', verify);

// Passkey: a real WebAuthn credential made by this device. No server checks it in this prototype.
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
$('#passkey').addEventListener('click', async () => {
  show(pkErr, '');
  const fallback = 'You can still sign in with an email code above.';
  if (!window.PublicKeyCredential || !navigator.credentials || !navigator.credentials.create) return show(pkErr, `This browser cannot make passkeys. ${fallback}`);
  const typed = email.value.trim();
  const addr = EMAIL.test(typed) ? typed : '';
  const btn = $('#passkey'); btn.disabled = true;
  try {
    const cred = await navigator.credentials.create({ publicKey: {
      rp: { id: 'localhost', name: 'Wi-Fight prototype' },
      user: { id: crypto.getRandomValues(new Uint8Array(16)), name: addr || 'wi-fight-user', displayName: addr ? nameFrom(addr) : 'Wi-Fight user' },
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'preferred' },
      timeout: 60000, attestation: 'none',
    } });
    if (!cred) throw new Error('none');
    await Store.update((s) => { s.user = { name: addr ? nameFrom(addr) : '', email: addr || null, method: 'passkey', credentialId: b64url(cred.rawId) }; });
    go('onboarding-plan.html');
  } catch (err) {
    const why = err && err.name === 'NotAllowedError' ? 'The passkey was cancelled or timed out.'
      : err && err.name === 'SecurityError' ? 'Passkeys only work here when the page is opened at localhost.'
      : 'This device could not make a passkey.';
    show(pkErr, `${why} ${fallback}`);
    btn.disabled = false;
  }
});
document.documentElement.dataset.ready = '1';
