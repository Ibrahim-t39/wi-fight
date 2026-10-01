# Build framework and AI stack research

## Recommendation

Build a mobile-first web app (React + Vite + TypeScript) that installs to the phone's home screen, hosted on a free HTTPS host. Use Supabase for sign-in and the database, plus one Supabase Edge Function that passes requests to the language model. Run the statistics as plain TypeScript inside the app. Use the language model only for language and vision.

The deciding fact: M-Lab's official JavaScript speed-test client runs only in a browser, because it uses Web Workers. It works unmodified in a web app and does not work in React Native.

What this gives up: unattended background tests. iOS does not reliably grant these to any framework.

This differs from the deck, which proposed React Native, FastAPI, and PostgreSQL.

## 1. Framework comparison

| Option | Speed test | Demo in class | Background tests | Verdict |
|---|---|---|---|---|
| Web app (PWA) | Works as-is | A URL or QR code on any phone, plus the laptop | Not available on iOS | Recommended |
| Expo / React Native | Needs a WebView wrapper or native module | Needs a dev build; TestFlight costs $99 | 15-minute minimum, and the OS decides if it runs at all | More work, no gain for the demo |
| Flutter | No official client found | Not installed on this Mac | Same iOS limits | Not a fit |

Charts and animation: Recharts and Framer Motion. PDF export: jsPDF or @react-pdf/renderer. These library picks are the researcher's inference.

How to handle "4 tests a day for 14 days": run tests while the app is open, prompt the user, and load a clearly labelled seeded 14-day dataset for the demo.

## 2. The speed test (M-Lab ndt7)

- Package: `@m-lab/ndt7` 0.1.5, Apache-2.0 licence. Repo: https://github.com/m-lab/ndt7-js
- Server lookup: https://locate.measurementlab.net/v2/nearest/ndt/ndt7 (docs: https://www.measurementlab.net/develop/locate-v2/)
- Consent flag: the test refuses to run unless `userAcceptedDataPolicy: true`. Wire it to the consent screen.
- Limits: 40 tests per client per day. M-Lab recommends at most 4 a day at randomised times, which matches the team's target.
- What users must be told: M-Lab publishes the results, the IP address, the timestamp, and browser and OS details, keeps them indefinitely, and waives copyright. https://www.measurementlab.net/privacy/

## 3. AI stack

Real methods, run locally:

| AI job | Method |
|---|---|
| Shortfall rule | Daily median, then flag 3 days in a row below 80% of the label |
| Anomaly detection | Robust z-score using median absolute deviation over a rolling window; CUSUM for a changepoint |
| Wi-Fi vs. provider | Paired near-router and far-room tests. A big gap points to Wi-Fi. Both low points to the provider. Time-of-day clustering for congestion. |
| Plan recommendation | Rule-based scoring of measured median against plan price |

Language model calls, all through the Edge Function:

- Features: verdict explanation, chat, complaint draft, bill photo extraction with a vision model.
- Grounding: pass the computed statistics as JSON so the model explains numbers and does not invent them.
- Structured output: a JSON schema, for example `{price, fees[], provider, plan, confidence}`.
- Keys: stored as an Edge Function secret. The function checks the user's sign-in token and rate-limits per user.
- Cost: estimated under a cent to about 2 cents per call, under $10 for the semester.
- Fallback: cache the last good response per feature and ship canned responses behind a "demo mode" switch, so the live demo cannot fail.

## 4. Backend

Supabase free tier: 2 projects, 500 MB database. Free projects pause after a week of inactivity, so open it before the demo.

Security that can be shown truthfully:

- Email code or magic-link sign-in.
- Passkeys (in beta since June 2026): https://supabase.com/docs/guides/auth/passkeys
- Row-level security, shown live by user A failing to read user B's rows.
- TLS on every call.
- Data minimisation: no address stored, bill photos deleted after extraction.

## 5. Broadband label data

Hand-enter a small `plans.json` of about 10 to 15 plans, each with a source URL and retrieval date. There is no feed to build on. The FCC's July 2026 order removed the machine-readable requirement.

- FCC: https://www.fcc.gov/broadbandlabels
- Xfinity: https://www.xfinity.com/broadband-labels
- AT&T: https://www.att.com/broadbandlabels/broadband-facts-machine-readable-plans/
- Aggregator: https://broadbandnow.com/broadband-consumer-labels
- Order coverage: https://www.insideglobaltech.com/2026/07/27/fcc-simplifies-broadband-consumer-label-requirements/

## 6. Build order

1. Deployed web app with consent screen, live speed test, plan picker, and the result against the label.
2. Sign-in and row-level security, stored history, seeded 14-day data, charts, and the verdict logic.
3. Edge Function: explanation, chat, bill photo extraction, Wi-Fi vs. provider flow.
4. Complaint draft with approval, PDF export, demo mode, polish, rehearsal.

## Risks and unknowns

- Not verified: Supabase's exact encryption-at-rest wording. Confirm before claiming it on a slide.
- Not verified: the iOS background-task figures, and each Huntsville provider's label values.
- Passkeys are in beta. Keep the email code as the main sign-in.
- A speed test uses significant mobile data. Warn users.
- Classroom Wi-Fi may block WebSockets. Test in the room beforehand.

## Tooling on this Mac

- Installed: Node 22.22.0, npm 10.9.4, yarn, pnpm, Xcode 26.6, CocoaPods, Python 3.12 to 3.14.
- Not installed: Android SDK, Flutter.
