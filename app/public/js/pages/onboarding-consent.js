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
document.documentElement.dataset.ready = '1';
