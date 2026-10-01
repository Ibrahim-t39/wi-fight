// Wi-Fight speed test. Runs M-Lab's open ndt7 test in the browser (the real thing),
// and falls back to a clearly labelled practice test when the network blocks it.
// Security rule enforced here: no test of any kind runs without consent.
import { Store } from './store.js';

export class ConsentError extends Error {}

function loadNdt7() {
  if (window.ndt7) return Promise.resolve(window.ndt7);
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'vendor/ndt7/ndt7.js'; s.onload = () => res(window.ndt7); s.onerror = () => rej(new Error('Could not load the speed test.')); document.head.appendChild(s); });
}

/**
 * Run one test.
 * @param {object} cb   onPhase('locate'|'download'|'upload'|'done'), onDown(mbps), onUp(mbps), onServer(name)
 * @param {object} opt  practice: true forces the practice test. location: 'normal' | 'near' | 'far'.
 * @returns {{down:number, up:number, latency:number|null, source:'mlab'|'practice', server:string|null, location:string}}
 */
export async function runSpeedTest(cb = {}, opt = {}) {
  const st = Store.get();
  if (!st.consent || !st.consent.mlab) throw new ConsentError('You have not agreed to run speed tests yet.');
  const location = opt.location || 'normal';
  if (opt.practice) return practice(cb, location);
  try { return await real(cb, location); }
  catch (e) { if (opt.noFallback) throw e; cb.onFallback && cb.onFallback(String(e.message || e)); return practice(cb, location); }
}

async function real(cb, location) {
  const ndt7 = await loadNdt7();
  let down = null, up = null, latency = null, server = null, failed = null;
  cb.onPhase && cb.onPhase('locate');
  const code = await ndt7.test(
    { userAcceptedDataPolicy: true, downloadworkerfile: 'vendor/ndt7/ndt7-download-worker.js', uploadworkerfile: 'vendor/ndt7/ndt7-upload-worker.js', metadata: { client_name: 'wi-fight-prototype', client_version: '0.1.0' } },
    {
      serverChosen: (s) => { server = (s && s.location && [s.location.city, s.location.country].filter(Boolean).join(', ')) || (s && s.machine) || null; cb.onServer && cb.onServer(server); },
      downloadStart: () => cb.onPhase && cb.onPhase('download'),
      downloadMeasurement: (m) => { if (m.Source === 'client' && m.Data) { down = m.Data.MeanClientMbps; cb.onDown && cb.onDown(down); } },
      downloadComplete: (m) => { if (m.LastClientMeasurement) down = m.LastClientMeasurement.MeanClientMbps; const tcp = m.LastServerMeasurement && m.LastServerMeasurement.TCPInfo; if (tcp && tcp.MinRTT) latency = tcp.MinRTT / 1000; },
      uploadStart: () => cb.onPhase && cb.onPhase('upload'),
      uploadMeasurement: (m) => { if (m.Source === 'client' && m.Data) { up = m.Data.MeanClientMbps; cb.onUp && cb.onUp(up); } },
      uploadComplete: (m) => { if (m.LastClientMeasurement) up = m.LastClientMeasurement.MeanClientMbps; },
      error: (e) => { failed = e; },
    },
  );
  if (down == null || (code !== 0 && down == null)) throw new Error(failed ? String(failed) : 'The test could not finish.');
  cb.onPhase && cb.onPhase('done');
  return { down: Math.round(down), up: up == null ? null : Math.round(up), latency: latency == null ? null : Math.round(latency), source: 'mlab', server, location };
}

// Practice test: used when M-Lab cannot be reached (for example, classroom Wi-Fi that blocks it).
// It animates like a real test and produces a value near the user's recent results. Always labelled.
function practice(cb, location) {
  const st = Store.get();
  const recent = (st.tests || []).filter((t) => (t.location || 'normal') === 'normal').slice(-8).map((t) => t.down).sort((a, b) => a - b);
  const base = recent.length ? recent[Math.floor(recent.length / 2)] : st.plan ? st.plan.down * 0.76 : 180;
  const target = Math.round(base * (location === 'far' ? 0.95 : location === 'near' ? 1.01 : 0.97 + Math.random() * 0.06));
  const upT = st.plan ? Math.round(st.plan.up * 1.08) : 20;
  return new Promise((resolve) => {
    cb.onServer && cb.onServer('Practice mode');
    cb.onPhase && cb.onPhase('download');
    const t0 = performance.now(), D = 4200, U = 2600;
    const tick = () => {
      const e = performance.now() - t0;
      if (e < D) { const p = e / D; cb.onDown && cb.onDown(target * (1 - Math.pow(1 - p, 3)) * (0.97 + 0.06 * Math.sin(e / 140))); requestAnimationFrame(tick); }
      else if (e < D + U) { if (!tick.up) { tick.up = true; cb.onDown && cb.onDown(target); cb.onPhase && cb.onPhase('upload'); } const p = (e - D) / U; cb.onUp && cb.onUp(upT * (1 - Math.pow(1 - p, 3))); requestAnimationFrame(tick); }
      else { cb.onUp && cb.onUp(upT); cb.onPhase && cb.onPhase('done'); resolve({ down: target, up: upT, latency: 28, source: 'practice', server: 'Practice mode', location }); }
    };
    requestAnimationFrame(tick);
  });
}
