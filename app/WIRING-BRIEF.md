# Brief: turn the Wi-Fight designs into a working prototype

The 13 designed pages are in `app/public/` as static HTML. Your job is to make your assigned pages **really work**: every number computed from stored tests, every button doing what it says, with honest labels. The goal is a class demo graded on: prototype functionality (25), AI and cybersecurity (20), problem clarity (15), impact and limits (15).

All paths below are under `app/`.

## The server is already running
`http://localhost:4810/` (started with `node server.js`). Do not stop it, do not start another, and do not use port 5173 (another project of the user's lives there). Pages must be opened through `http://localhost:4810/`, not `file://`.

## Read these first
1. `public/js/engine.js`: the statistics. `summarize(state)` returns the `facts` object every page renders from. Read the whole file so you know every field.
2. `public/js/store.js`: encrypted local storage. `Store.get()`, `Store.update(fn)`, `Store.addTest()`, `Store.loadSample(9|14)`, `Store.clearTests()`, `Store.exportJSON()`, `Store.wipe()`, `Store.isEncrypted()`, `Store.rawOnDisk()`.
3. `public/js/ai.js`: Proof AI. `AI.insight`, `AI.verdict`, `AI.answer`, `AI.draft`, `AI.readBill`, `AI.liveRead`, `AI.html`, `AI.note(mode)`, `AI.chips(facts)`, `AI.status()`. Each returns `mode: 'live' | 'offline'`. Live means Claude wrote the words through the server. Offline means the built-in writer did. No AI key is set on this machine, so you will see offline mode. The UI must always show which mode produced the text, using `AI.note(mode)`.
4. `public/js/speedtest.js`: `runSpeedTest(callbacks, { practice, location })`.
5. `public/js/shell.js`: `boot({ need })`, `bind`, `$`, `$$`, `go`, `toast`, `badge`, `statusKind`, `setRing`, `barsHTML`, `xlabelsHTML`, `daysHTML`, `chipsHTML`, `reasonsHTML`, `labelHTML`, `download`, `sha256`, `openDemo`, `closeSheet`. `boot` loads the store, redirects to onboarding when consent, sign-in, or a plan is missing, wires the sidebar, phone tab bar, `[data-href]` links, and the Demo data sheet, and hides every `.sample` element unless sample data is loaded.
6. **The reference page:** `public/dashboard.html` and `public/js/pages/dashboard.js`. Copy this pattern exactly: add `data-b="key"` hooks or ids to the HTML, keep the designed classes and look, and render from `facts` in a small module at `public/js/pages/<page>.js` loaded with `<script type="module" src="js/pages/<page>.js"></script>` before `</body>`.
7. `public/data/plans.json`: fictional providers and plans.
8. `tests/drive.py`: browser driver. Run with `/opt/homebrew/opt/python@3.13/bin/python3.13 tests/drive.py ...`. `shot` saves a screenshot, `text` prints visible text and console errors, `--sample 9 | 14 | fresh | none` seeds state through the real store (`fresh` = signed in with a plan and no tests, `none` = wiped), `--mobile` uses a 393 px phone, `--full` captures the full page. For click-through tests, write your own small Python script in your scratch space that imports `open_page` and `seed` from `tests/drive.py` (add the `tests` folder to `sys.path`).

## Rules
- **Own only your files.** Edit only the HTML pages assigned to you and your own `public/js/pages/*.js` files. Do NOT edit `engine.js`, `store.js`, `ai.js`, `speedtest.js`, `shell.js`, `ds.css`, `server.js`, `sample.js`, `plans.json`, `dashboard.html`, or any page another builder owns. If you need a change in a shared file, do not make it: describe it precisely in your report. Put page-specific CSS in the page's own `<style>` block.
- **No hard-coded results.** Any number about speed, days, money, confidence, plans, or tests must come from `facts`, `recommend()`, the store, or `plans.json`. Remove the static sample numbers from your pages. Pages must also behave sensibly with no tests (`--sample fresh`): show a clear empty state with a button to run a test and a button with the attribute `data-demo` (it opens the Demo data sheet).
- **Sample data honesty.** Keep one `<span class="sample">Sample data</span>` chip near each page title; the shell shows it only when sample data is loaded.
- **No em dashes and no en dashes anywhere**, in HTML, JS strings, or comments. Use commas, periods, or "to". No emoji. Plain language: "provider" not ISP, "response time" not latency, "fair line" for the 80% threshold.
- **Keep the design.** Same classes, spacing, and look as the designed pages. Do not redesign. Both desktop (1440) and phone (393) must still look right, with no horizontal scroll at 393.
- **AI discipline.** Every AI block shows: the text, the evidence chips or sources, and `AI.note(mode)`. Text from `ai.js` goes through `AI.html()` before insertion. Never insert model or user text as raw HTML.
- **Security is real, not decorative.** Follow what your task says exactly.
- **Never run a real M-Lab speed test in automation.** A real test publishes this computer's IP address in M-Lab's public dataset, and the user has not agreed to that. In your scripts use practice mode only (`runSpeedTest(cb, { practice: true })`). Leave the real path wired for the human to try.
- **Do not send anything anywhere.** No emails, no form posts, no network calls other than to `localhost:4810`.
- Use only what the browser provides. No new npm packages, no CDN scripts, no frameworks.

## Verify by driving a real browser (required)
For each page: (1) `text` and `shot` with `--sample 9`, with `--sample 14` where relevant, and with `--sample fresh`, at desktop and `--mobile`; (2) open every screenshot with the Read tool and check it looks like the design and has no overflow, overlap, or leftover static numbers; (3) write a click-through script that performs the page's real interactions and asserts the result (state changed in the store, text changed on screen, navigation happened); (4) confirm `CONSOLE ERRORS: []`. Fix and repeat. Do not report something as working unless your script exercised it.

## Report back (under 400 words)
- Files you created or changed.
- For each page: what now works, and exactly how you verified it (which script, what it asserted).
- Anything that does not work, is faked, or was not verified. Say it plainly.
- Any change you need in a shared file.

## Update: Proof AI now has a real language model

The server now picks a model in this order: Claude (when a key is set), a model running on this computer through Ollama (installed, currently `gemma3:12b`), or none. `AI.status()` returns `{ live, provider: 'claude' | 'local' | null, model, label }`. `AI.note(mode)` already words itself for the provider. New in `ai.js`:
- `AI.chatStream(messages, facts, state, catalog, { onDelta(textSoFar, delta), signal })` : multi-turn streaming chat. Returns `{ text, mode, provider, model, ungrounded, stopped, followups? }`.
- `AI.chatHtml(text)` : safe HTML for chat text (escapes, then **bold**, "- " lists, paragraphs).
- `AI.resetStatus()`.
The store has a new `chats` array for saved conversations.
A local answer takes about 10 seconds and streams as it is written. Tests that wait for a full model answer should allow 90 seconds.

## Update: demo readiness round

The goal of this round: an in-class demo that is quick, easy to follow, and cannot get stuck, with clear "wow" moments for AI and for cybersecurity. Not dumbed down: everything shown must still be real.

New shared pieces (read them, do not edit them):
- `public/js/tour.js`: the guided demo bar, loaded on every page. It shows a "Do it for me" button whenever the page defines `window.wfDemoFill = async () => { ... }`. That function must perform the page's key demo action through the page's own real code paths (the same handlers a click would run), with short pauses so the audience can follow (about 400 to 900 ms between visible steps). It must be safe to call twice. It must never run a real M-Lab speed test, send anything, or open an email app.
- `public/samples/`: fictional sample documents. `manifest.json` lists two bills (`northstar-bill.png`, `pinecrest-bill.png`) with their known `fields`, their `planId`, and `regions` (percent boxes for each line: `plan`, `totalTop`, `planPrice`, `equipment`, `fee0`, `fee1`, `total`, `promo`), plus `northstar-label.png`. Regenerate with `tools/make-samples.py` only if you must; prefer not to.
- `AI.readBill(dataUrl, known)`: pass the manifest `fields` as `known` when the photo is a bundled sample. With a language model connected, the model really reads the image (the local model reads both sample bills correctly in about 6 seconds). With none, the known values are returned and labelled.
- Any element with the attribute `data-tour-start` opens the guided demo's start dialog.

The server is running at http://localhost:4810 with a real local model (`gemma3:4b`). Do not stop or restart it.

## Update: midterm polish round

Read this section last. It overrides anything above that conflicts.

**Why.** The team presents this to a professor and class. The live demo is at most 5 minutes. It is graded on design completeness, a working prototype, and clear use of AI and cybersecurity toward UN Goal 9 (affordable internet, targets 9.c and 9.1). The look must be excellent, and nothing may be overstated.

**Writing rules for anything a user reads.**
- No em dashes or en dashes anywhere. No arrows.
- Avoid staccato copy: strings of two to four word sentences ("Fast. Simple. Honest."). Write full, natural sentences that flow, at about a 9th grade level. Short is good, choppy is not.
- Never claim something the code does not do. Sample data, the simulated speed test, demo sign-in, and the simulated support agent are all labelled as such and must stay labelled.
- The three themes must be easy to see and must not be buried: Proof AI, visible security, and UN Goal 9.

**Naming the AI models.** Do not just say "Groq" or "AI". `public/js/models.js` names the real models from what the server reports:
- `modelStack()` (async) returns `{ live, provider, host, text, photo }`.
- `stackHTML(stack)` returns ready cards (model name, maker, logo, what it does, where it runs).
- `modelChip(id)` returns a small pill with the logo and name. `modelInfo(id)` returns `{ id, name, maker, icon }`.
- Styles `.mchip`, `.mstack`, `.mcard`, `.mico` are in `ds.css`.
On the live site today that is GPT-OSS 120B (OpenAI's open-weight model) for writing, Qwen 3.8 27B (Alibaba Cloud's Qwen family) for reading bill photos, both hosted on Groq. Locally the server is in offline mode, so to see the live look in a test, stub the two endpoints with Playwright:
`page.route('**/api/status', lambda r: r.fulfill(json={'live': True, 'provider': 'groq', 'model': 'openai/gpt-oss-120b', 'label': 'Groq (openai/gpt-oss-120b)'}))` and
`page.route('**/api/models', lambda r: r.fulfill(json={'text': 'openai/gpt-oss-120b', 'photo': 'qwen/qwen3.8-27b', 'available': []}))`.
Never hard-code a model name in a page: always render from `models.js`, and handle offline mode.

**Recent behaviour you must not break.** Guided demo bar (`js/tour.js`, `window.wfDemoFill` per page); sign-in takes any 6 digits; the bill is uploaded by the user from `demo-files/` and recognized by hash; "Start test" runs the simulated test; "Simulate the two weeks" (`data-simulate`); the simulated agent handoff in chat; Log out (`data-logout`). `tests/e2e.py` must still pass (45 checks): run it from a scratch folder because it writes screenshots to the current folder.

**How to work.** Edit only the files you are given. Look before you change: take screenshots at 1440x900 and 393x852 and open them. Fix what a careful designer would flag: uneven spacing, misaligned edges, cramped or orphaned text, weak hierarchy, inconsistent card padding or radius, low contrast, awkward empty space, anything that overflows on a phone. Keep the existing design language (see `design/04-design-direction.md`, `public/css/ds.css`). Do not edit `ds.css`, `shell.js`, `ai.js`, `tour.js`, `models.js`, `engine.js`, `store.js`, or `server.js`; if one needs a change, say so in your report. Finish with: files changed, what you checked and how, what you did not verify, `CONSOLE ERRORS`, and confirm no dashes.
