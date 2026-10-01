// Wi-Fight store: all app data lives in this browser only, encrypted at rest.
// Encryption: AES-GCM 256 with a non-extractable key kept in IndexedDB (Web Crypto).
// The key cannot be read out by scripts; only this origin can use it to decrypt.
import { buildSample, SAMPLE_PLAN, SAMPLE_BILL } from './sample.js';

const KEY = 'wf.state.v1';
const DB = 'wf-keys', OS = 'keys', KID = 'state-key';
const blank = () => ({ v: 1, consent: null, user: null, plan: null, bill: null, tests: [], household: { people: 3, devices: 9, uses: ['Online classes', 'Video calls', 'Streaming', 'Some gaming'] },
  settings: { scheduled: true, mobileData: false, aiAnalyze: true, aiBill: true, pausedUntil: null }, chat: [], chats: [], report: null, sent: [], sample: false, startedAt: null, clock: null });

let state = blank();
let cryptoKey = null;
let encrypted = false;

const idb = () => new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(OS); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const idbGet = async (k) => { const db = await idb(); return new Promise((res, rej) => { const q = db.transaction(OS).objectStore(OS).get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); };
const idbPut = async (k, v) => { const db = await idb(); return new Promise((res, rej) => { const tx = db.transaction(OS, 'readwrite'); tx.objectStore(OS).put(v, k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); };
const idbClear = async () => { const db = await idb(); return new Promise((res) => { const tx = db.transaction(OS, 'readwrite'); tx.objectStore(OS).clear(); tx.oncomplete = () => res(); tx.onerror = () => res(); }); };
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function getKey() {
  if (cryptoKey) return cryptoKey;
  if (!(globalThis.crypto && crypto.subtle && globalThis.indexedDB)) return null;
  try {
    cryptoKey = await idbGet(KID);
    if (!cryptoKey) { cryptoKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); await idbPut(KID, cryptoKey); }
    return cryptoKey;
  } catch { return null; }
}

async function save() {
  const json = JSON.stringify(state);
  const key = await getKey();
  if (key) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(json));
    localStorage.setItem(KEY, JSON.stringify({ enc: 'AES-GCM-256', iv: b64(iv), ct: b64(ct) }));
    encrypted = true;
  } else { localStorage.setItem(KEY, JSON.stringify({ enc: 'none', data: json })); encrypted = false; }
}

export const Store = {
  async load() {
    const raw = localStorage.getItem(KEY);
    state = blank();
    if (raw) {
      try {
        const box = JSON.parse(raw);
        if (box.enc === 'AES-GCM-256') {
          const key = await getKey();
          const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, key, unb64(box.ct));
          state = { ...blank(), ...JSON.parse(new TextDecoder().decode(pt)) }; encrypted = true;
        } else if (box.data) state = { ...blank(), ...JSON.parse(box.data) };
      } catch { state = blank(); }
    } else { encrypted = !!(await getKey()); }
    return state;
  },
  get: () => state,
  isEncrypted: () => encrypted,
  /** What is physically stored on disk, to show that it is unreadable. */
  rawOnDisk: () => localStorage.getItem(KEY) || '',
  async update(fn) { const r = fn(state); if (r && typeof r === 'object') state = r; await save(); return state; },
  /** Add a finished speed test. In sample mode the frozen demo clock is used so the new test joins "today". */
  async addTest(t) {
    return this.update((s) => {
      let when = new Date();
      if (s.clock) { when = new Date(new Date(s.clock).getTime() + 60000); s.clock = when.toISOString(); }
      if (!s.startedAt) s.startedAt = when.toISOString();
      s.tests.push({ id: 't' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36), t: when.toISOString(), location: 'normal', source: 'mlab', ...t });
    });
  },
  /** Load the labelled sample two weeks (9 days in, or the finished 14). Keeps consent and sign-in. */
  async loadSample(days = 9) {
    const s = buildSample(days);
    return this.update((st) => { st.tests = s.tests; st.startedAt = s.startedAt; st.clock = s.clock; st.sample = true; st.plan = { ...SAMPLE_PLAN }; st.bill = { ...SAMPLE_BILL }; st.report = null; st.chat = []; st.chats = []; if (!st.consent) st.consent = { mlab: true, ai: true, at: new Date().toISOString(), viaSample: true }; if (!st.user) st.user = { name: 'Jordan', email: 'jordan@example.com', method: 'sample' }; });
  },
  async clearTests() { return this.update((st) => { st.tests = []; st.startedAt = null; st.clock = null; st.sample = false; st.report = null; st.chat = []; st.chats = []; }); },
  /** Everything Wi-Fight holds, as one JSON file the user can keep. */
  exportJSON() { const { clock, ...rest } = state; return JSON.stringify({ exportedAt: new Date().toISOString(), app: 'Wi-Fight prototype', ...rest }, null, 2); },
  /** Delete everything: data, and the encryption key itself. */
  async wipe() { localStorage.removeItem(KEY); try { await idbClear(); } catch {} cryptoKey = null; state = blank(); encrypted = false; },
};
