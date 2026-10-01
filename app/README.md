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

1. Open the site and walk through consent, sign-in, and plan setup.
2. Run a speed test. If the classroom network blocks M-Lab, use "Practice test". It is labelled as not a real measurement.
3. Open "Demo data" (bottom of the sidebar, or "More" on a phone) and load "day 9 of 14" or "finished check" so every page has results. Sample data is labelled on every page.
4. Show Dashboard, History, Diagnosis, Ask Proof AI, Verdict, Report, Privacy, and About.

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
| `public/js/ai.js` | Proof AI: live through Claude, or the built-in offline writer |
| `public/js/speedtest.js` | M-Lab ndt7 speed test, with a labelled practice mode |
| `public/js/shell.js` | Shared page setup, navigation, and render helpers |
| `public/js/pages/` | One small script per page |
| `public/data/plans.json` | Fictional providers and plans for the demo |
| `tests/` | Engine tests, an end-to-end browser check, and live model checks |
| `.env.example` | Template for your keys. Copy it to `.env` |
