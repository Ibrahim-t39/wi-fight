# Product blueprint (draft 1)

Team DiJITZ, CS 410. Working title: Speed Test vs. Label Checker. Name and visual design are pending research.

## What the prototype has to prove

From the grading rubric: prototype functionality is 25 points, SDG or AI + cybersecurity is 20. The professor's feedback on the presentation was that AI was not highlighted enough. So the prototype has two jobs:

1. Show the core loop working end to end: consent, add plan, test, compare, verdict, report.
2. Make AI and security visible on screen, not hidden in the backend.

## Design principle: AI is the narrator, not a tab

Every screen that shows a number also shows what the AI makes of that number. AI content is always marked the same way, always shows its evidence, and never acts without approval.

## Screen map

| # | Screen | Requirement | What the user does | AI on this screen | Security on this screen |
|---|---|---|---|---|---|
| 1 | Welcome | | Sees the one-line promise | | |
| 2 | Consent | FR1 | Reads what is and is not collected, agrees | | Plain list of data collected, M-Lab publishes test IP |
| 3 | Secure sign-in | FR1 | Face ID / passkey or email code | | Passkey, no password stored |
| 4 | Plan setup | FR2 | Picks provider and plan, or scans the bill | **Bill scan**: reads a photo, extracts price, fees, promo end date | Photo processed, not stored, unless user opts in |
| 5 | Home | FR4, FR5 | Sees percent of plan speed, day X of 14 | **AI insight card**: one-sentence reading of the week | Lock badge, "encrypted" status |
| 6 | Live test | FR3 | Runs or watches a test | **Live classification**: "this dip looks like a one-off" | |
| 7 | History | FR4 | Sees 14 daily bars against the 80% line | **Anomaly marks**: AI flags real shortfall days vs. ignored dips | |
| 8 | Diagnosis | FR4 | Opens "why" | **Wi-Fi vs. provider** verdict with confidence and evidence list | |
| 9 | Verdict | FR5 | Sees the two-week result | **Plain-language explanation** of the verdict | |
| 10 | Better plans | | Compares local plans | **AI pick** with reasons tied to household use | |
| 11 | Ask DiJITZ (chat) | | Asks a question in plain words | **Assistant** grounded in the user's own test data | States what data the answer used |
| 12 | Report | FR5 | Reviews, edits, approves, exports PDF | **AI draft** of the report and complaint text | **Approve before send**, signed report |
| 13 | Privacy & data | | Pauses tests, exports, deletes data | Toggle AI features on or off | Encryption status, delete everything |

## The seven AI jobs, and how each is real

| AI job | Method | Where it shows |
|---|---|---|
| Separate real shortfalls from one-off dips | Statistics: daily median, robust outlier test, 3-day rule | History, Home |
| Diagnose Wi-Fi vs. provider | Compare near-router and far-room tests, time-of-day pattern | Diagnosis |
| Explain the verdict | Language model, given the numbers | Verdict, Home card |
| Recommend a plan | Rules plus language model reasoning over plan data | Better plans |
| Answer questions | Language model grounded in the user's data | Chat |
| Draft the report | Language model, user edits and approves | Report |
| Read the bill | Vision model, structured output | Plan setup |

## Open decisions (waiting on research)

- App name and logo
- Light vs. dark default, color, type
- Build framework and where the AI calls run
