# Wi-Fight prototype

Proof of the speed you pay for. Team DiJITZ, CS 410, Alabama A&M University.

## Run it

```
cd app
npm install        # first time only
npm start
```

Then open http://localhost:4810 in a browser. On a phone on the same Wi-Fi, open `http://<this computer's IP>:4810`.

## Turn on the language model

Proof AI's numbers are always computed on your device. The words (chat, report draft, bill reading) come from a language model. The server uses the first one it finds:

| Order | Backend | How to turn it on |
|---|---|---|
| 1 | Claude | Put `ANTHROPIC_API_KEY` in `.env` |
| 2 | Groq | Put `GROQ_API_KEY` in `.env` |
| 3 | A model on this computer | Install Ollama and run `ollama pull gemma3:12b`. No key, and nothing leaves the computer. |
| 4 | None | The built-in writer answers, and every page says "offline mode" |

To add a key:

```
cp .env.example .env
# open .env and paste your key after GROQ_API_KEY=
npm start
```

The terminal prints which backend is live. Keys stay on this server and never reach the browser. Git ignores `.env`, so a key cannot be committed by accident.

If Groq retires a model, change `GROQ_MODEL` or `GROQ_VISION_MODEL` in `.env`.

Every number the model writes is checked against your data. If it writes a number that is not there, short answers are discarded and chat answers get a visible warning.

## Demo in class

The app has a guided demo so a presenter never gets stuck.

1. Press "Guided walkthrough" in the footer of the home page and choose "Start from the beginning". Adding `?tour=1` to any address does the same, and inside the app it is also under Demo in the sidebar.
2. A bar in the corner shows what to say and what to press at each of the 11 stops, and a clock that counts toward a 4 minute target. Right arrow is next, left arrow is back, H hides the bar.
3. "Do it for me" on the bar does the step for you: it ticks consent, signs in, opens the file picker for the bill, runs the simulated test, asks the chat question, and runs the tamper test.
4. The demo jumps ahead in time by loading sample data for day 9 and day 14. Sample data is labelled on every page.

Shortcuts for a live demo, all labelled in the app:

- Sign-in takes any email address and any 6 digits. No email is sent.
- "Simulate the two weeks" (after a test, or under Demo in the sidebar) fast-forwards with sample data.
- In the chat, asking for a person offers a handoff to a support agent. The agent is simulated and says so. The case summary it opens with is built from your own results.

"Start test" runs a simulated test, labelled as not a real measurement, so a demo never uses the presenter's real connection. "Use the real M-Lab test" on the same page runs a real one.

The practice bills are in `demo-files/` at the top of the repo, not on the website. They are fictional. Upload one on the plan step like any photo. Proof AI reads it from the image. If the file is one of those exact files, the page recognizes it, outlines each line, and checks the AI's answer against the known values. `tools/make-samples.py` draws them.

## Check the statistics

```
npm test
```

## What is where

| Path | What it is |
|---|---|
| `server.js` | Serves the app and keeps the AI key off the browser |
| `public/js/engine.js` | The statistics: medians, fair line, one-off dip detection, diagnosis, plan scoring |
| `public/js/store.js` | Local storage, encrypted with AES-GCM |
| `public/js/ai.js` | Proof AI: live through Claude, Groq, or a local model, or the built-in offline writer |
| `public/js/speedtest.js` | M-Lab ndt7 speed test, with a labelled practice mode |
| `public/js/shell.js` | Shared page setup, navigation, and render helpers |
| `public/js/tour.js` | The guided demo bar |
| `public/samples/manifest.json` | Known values and line positions of the practice bills in `../demo-files/` |
| `public/js/pages/` | One small script per page |
| `public/data/plans.json` | Fictional providers and plans for the demo |
| `tests/` | Engine tests, an end-to-end browser check, and live model checks |
| `.env.example` | Template for your keys. Copy it to `.env` |
