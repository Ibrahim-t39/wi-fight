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

1. Open the site and press "Start the guided demo". Choose "Start from the beginning". You can also add `?tour=1` to any address.
2. A bar in the corner shows what to say and what to press at each of the 13 stops. Right arrow is next, left arrow is back, H hides the bar.
3. "Do it for me" on the bar does the step for you: it ticks consent, signs in, scans a sample bill, runs the practice test, asks the chat question, and runs the tamper test.
4. The demo jumps ahead in time by loading sample data for day 9 and day 14. Sample data is labelled on every page.

The speed test in the demo is the practice test. It is labelled as not a real measurement. The real M-Lab test is on the same page.

The sample bills in `public/samples/` are fictional. `tools/make-samples.py` draws them. Proof AI reads them from the image like any other photo, and the page checks its answer against the known values of the sample.

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
| `public/samples/` | Fictional sample bills for the bill scan, made by `tools/make-samples.py` |
| `public/js/tour.js` | The guided demo bar |
| `public/samples/` | Fictional sample bills for the bill scan, made by `tools/make-samples.py` |
| `public/js/pages/` | One small script per page |
| `public/data/plans.json` | Fictional providers and plans for the demo |
| `tests/` | Engine tests, an end-to-end browser check, and live model checks |
| `.env.example` | Template for your keys. Copy it to `.env` |
