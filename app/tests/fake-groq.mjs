// A stand-in for Groq's OpenAI-compatible API, for testing the Groq code path without a real key.
// Run: node tests/fake-groq.mjs   (listens on 4899). It checks the Authorization header like the real service.
import http from 'node:http';
http.createServer((req, res) => {
  if (req.method === 'GET' && req.url.endsWith('/models')) { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ data: [{ id: 'whisper-large-v3' }, { id: 'openai/gpt-oss-120b' }, { id: 'meta-llama/llama-4-maverick-17b-128e-instruct' }, { id: 'meta-llama/llama-guard-4-12b' }] })); }
  let raw = ''; req.on('data', (c) => (raw += c)); req.on('end', () => {
    if (req.headers.authorization !== 'Bearer test-key') { res.writeHead(401, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: { message: 'Invalid API Key' } })); }
    const b = JSON.parse(raw || '{}');
    const sys = b.messages[0].content, last = b.messages[b.messages.length - 1].content;
    const text = typeof last === 'string' ? last : last.map((x) => x.text || '').join(' ');
    if (b.stream) {
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      const words = `Your evenings are slower. Your evening tests average **390 Mbps** and your daytime tests average 432 Mbps. (history turns received: ${b.messages.length - 1})`.split(' ');
      let i = 0; const t = setInterval(() => { if (i < words.length) res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: (i ? ' ' : '') + words[i++] } }] })}\n\n`); else { clearInterval(t); res.write('data: [DONE]\n\n'); res.end(); } }, 15);
      return;
    }
    let content;
    if (b.response_format && Array.isArray(last)) content = JSON.stringify({ planPrice: 65, equipment: 10, fees: [{ name: 'Network enhancement fee', amount: 5, junk: true, why: 'A company fee, not a tax.' }], total: 80, promoEnds: 'Jan 2027', provider: 'Northstar Fiber', plan: 'Fiber 500', confidence: 'high' });
    else if (b.response_format) content = JSON.stringify(text.includes('INVENT') ? { sentence: 'You get 123456 Mbps.', reasons: [] } : { sentence: 'Your internet is **below the fair line**. You get 389 Mbps, which is 78% of your plan.', reasons: [{ title: 'It lasted.', detail: 'It was below 400 Mbps for 4 days in a row.' }] });
    else content = 'Subject: Speeds below my plan\n\nHello Northstar support,\n\nMy plan lists 500 Mbps for $80 a month and my median was 389 Mbps, which is 78% of the plan. Please fix this or credit my bill.\n\nThe full report is attached.\nJordan';
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ model: b.model, choices: [{ message: { role: 'assistant', content } }] }));
  });
}).listen(4899, () => console.log('fake Groq on 4899'));
