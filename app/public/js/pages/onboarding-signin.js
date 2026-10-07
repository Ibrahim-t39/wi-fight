// Step 2: sign in. This prototype has no email server and no sign-in server, and the page says so.
// For the class demo any 6 digits are accepted as the code, and the page says so. A real build would email a code and check it on a server.
import { Store, $, $$, go, bind } from '../shell.js';

const state = await Store.load();
if (!state.consent || !state.consent.mlab) { go('onboarding-consent.html'); await new Promise(() => {}); }

const email = $('#email'), emailField = $('#emailfield'), emailErr = $('#emailerr');
const card = $('#codecard'), boxes = $$('#otp input'), codeErr = $('#codeerr'), pkErr = $('#pkerr');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
let pending = null; // { email }, memory only

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

function issue() {
  const addr = validEmail(); if (!addr) return;
  pending = { email: addr };
  card.hidden = false;
  bind({ email: addr });
  const note = $('#demonote');
  note.textContent = 'This is a demo sign-in, so no email is sent in this prototype and any 6 digits work as the code.';
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
  if (boxes.every((b) => b.value)) verify();
};
boxes.forEach((box, i) => {
  box.addEventListener('input', () => {
    $('#otp').classList.remove('bad'); show(codeErr, '');
    const d = box.value.replace(/\D/g, '');
    box.value = d.slice(-1);
    if (d.length > 1) { fill(d, i); return; }
    box.classList.toggle('f', !!box.value);
    if (box.value && i < 5) boxes[i + 1].focus();
    if (boxes.every((b) => b.value)) verify(); // six digits in: continue without another click
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

let verifying = false;
async function verify() {
  if (verifying) return;
  const typed = boxes.map((b) => b.value).join('');
  const fail = (msg) => { $('#otp').classList.add('bad'); show(codeErr, msg); };
  if (!pending) return fail('Ask for a code first.');
  if (typed.length < 6) return fail('Enter all 6 digits.');
  if (!/^\d{6}$/.test(typed)) return fail('The code is 6 digits.');
  verifying = true;
  const addr = pending.email; pending = null;
  await Store.update((s) => { s.user = { name: nameFrom(addr), email: addr, method: 'code' }; });
  go('onboarding-plan.html');
}
$('#verify').addEventListener('click', verify);

// Presenter convenience: put a code into the six boxes, through the same input handlers as typing.
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function typeCode(gap = 0) {
  if (!pending) return false;
  const code = '246810';
  boxes.forEach((b) => { b.value = ''; b.classList.remove('f'); });
  for (let i = 0; i < 6; i++) {
    boxes[i].focus(); boxes[i].value = code[i];
    boxes[i].dispatchEvent(new Event('input', { bubbles: true }));
    if (gap) await pause(gap);
  }
  return true;
}
$('#fillcode').addEventListener('click', () => typeCode(0));

// Guided demo shortcut ("Do it for me"): type the email, ask for a code, enter it, verify. Nothing is sent anywhere.
let filling = false;
window.wfDemoFill = async () => {
  if (filling) return; filling = true;
  try {
    if (!pending) {
      const addr = 'jordan@example.com';
      email.scrollIntoView({ block: 'center', behavior: 'smooth' }); email.focus(); email.value = '';
      for (const ch of addr) { email.value += ch; email.dispatchEvent(new Event('input', { bubbles: true })); await pause(35); }
      await pause(500);
      $('#sendcode').click();
      for (let i = 0; i < 40 && card.hidden; i++) await pause(50);
      if (card.hidden || !pending) return;
      await pause(800);
    }
    await typeCode(140);
    await pause(1500);
  } finally { filling = false; }
};

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
