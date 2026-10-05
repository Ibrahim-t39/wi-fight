// Small helpers shared by the chat, report, and privacy pages: a sheet, an accessible switch, and copy to clipboard.
import { $, closeSheet } from '../shell.js';

/** Open a sheet (same look as the Demo data sheet). Returns the wrapper element. */
export function openSheet(html) {
  closeSheet();
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet-back"></div><div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(wrap);
  $('.sheet-back', wrap).onclick = closeSheet;
  wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
  wrap.querySelectorAll('[data-close]').forEach((b) => { b.onclick = closeSheet; });
  const first = wrap.querySelector('button, a[href], input');
  if (first) first.focus({ preventScroll: true });
  return wrap;
}

/** A real toggle: a button with role="switch". The word (On / Off) is drawn by the page. */
export const switchHTML = (key, on, label) => `<button type="button" class="switch${on ? ' on' : ''}" role="switch" aria-checked="${on ? 'true' : 'false'}" aria-label="${label}" data-switch="${key}"></button>`;
export function paintSwitch(el, on) { el.classList.toggle('on', on); el.setAttribute('aria-checked', on ? 'true' : 'false'); }

/** Copy text. Uses the clipboard API, with a fallback for browsers that block it. */
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy'); ta.remove(); return ok;
  } catch { return false; }
}

/** Guided demo helpers: a short pause, and a smooth scroll that keeps tall blocks at the top and small ones centred. */
export const pause = (ms) => new Promise((res) => setTimeout(res, ms));
export async function bringIntoView(el, wait = 600) {
  if (!el) return;
  const tall = el.getBoundingClientRect().height > window.innerHeight * 0.6;
  el.scrollIntoView({ behavior: 'smooth', block: tall ? 'start' : 'center' });
  await pause(wait);
}
