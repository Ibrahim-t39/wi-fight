// Step 1: consent. Nothing is written to the store until the person presses "I agree, continue".
import { Store, $, $$, go } from '../shell.js';

const state = await Store.load();
const mlab = $('#c-mlab'), ai = $('#c-ai'), agree = $('#agree'), hint = $('#agree-hint');

// Returning visitor: show what they already agreed to.
if (state.consent) { mlab.checked = !!state.consent.mlab; ai.checked = !!state.consent.ai; }

const sync = () => {
  agree.disabled = !mlab.checked;
  hint.textContent = mlab.checked ? (ai.checked ? 'You agreed to M-Lab tests and to Proof AI.' : 'You agreed to M-Lab tests. Proof AI stays off.') : 'Check the M-Lab box to continue.';
};
mlab.addEventListener('change', sync); ai.addEventListener('change', sync); sync();

// The small "i" buttons open a plain-language explanation under the row.
$$('.ibtn').forEach((b) => b.addEventListener('click', () => {
  const box = document.getElementById('info-' + b.dataset.info);
  const open = box.hidden;
  box.hidden = !open; b.setAttribute('aria-expanded', String(open));
}));

agree.addEventListener('click', async () => {
  if (!mlab.checked) return;
  agree.disabled = true;
  const aiOk = ai.checked;
  await Store.update((s) => { s.consent = { mlab: true, ai: aiOk, at: new Date().toISOString() }; s.settings = { ...s.settings, aiAnalyze: aiOk }; });
  go('onboarding-signin.html');
});

// Guided demo shortcut ("Do it for me"): the same clicks a person would make, with pauses so people can follow.
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
let filling = false;
window.wfDemoFill = async () => {
  if (filling) return; filling = true;
  try {
    mlab.closest('label').scrollIntoView({ block: 'center', behavior: 'smooth' }); await pause(500);
    if (!mlab.checked) { mlab.click(); await pause(750); }
    if (!ai.checked) { ai.click(); await pause(750); }
    agree.scrollIntoView({ block: 'center', behavior: 'smooth' }); await pause(450);
    if (!agree.disabled) agree.click();
    await pause(1500);
  } finally { filling = false; }
};
document.documentElement.dataset.ready = '1';
