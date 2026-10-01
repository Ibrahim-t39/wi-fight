# AI presentation references (iOS, from Mobbin)

Category: AI-first apps and AI features inside apps. 14 shipped iOS screens.
Hex values, radii and type sizes are estimates read off the screenshots (points at 1x, screen width 393pt), not values from source code.

---

## 01-perplexity-answer-sources-followups.jpg
App: Perplexity. [Open on Mobbin](https://mobbin.com/screens/e5618f25-4ded-4899-a826-881c4b879a3a)

- Every claim carries an inline source chip: monospace lowercase text (about 12pt) on a light grey pill (#EFEFEC, radius about 6), with a "+2" count for extra sources. No sparkle, no gradient; the citations are the AI marker.
- Under the answer: a row of plain line icons (share, download, rewrite, copy), then a stacked-favicon cluster with "10 sources".
- Follow-up questions are full-width text rows (about 17pt medium, dark teal-black #1F3A3D) each led by a "↳" arrow and split by hairline dividers, not chips.
- Warm off-white page (#FBFAF6); floating pill input "Ask a follow up..." (radius about 28, soft shadow) with mic inside and a separate round new-thread button.

## 02-copilot-chat-home-prompt-chips.jpg
App: Microsoft Copilot. [Open on Mobbin](https://mobbin.com/screens/ef2922b1-15ce-468e-b028-2ed58480b34f)

- Empty state is one large personal greeting, "Hey Sam, how can I help?" (about 32pt semibold, #2B2623), left aligned, on a warm cream-to-peach vertical gradient (#FBF7F2 to #F6E9DF).
- Horizontally scrolling prompt chips sit directly above the composer: white, radius about 12, 15pt text, faint shadow, verb-first labels ("Write a first draft", "Get advice").
- Composer is a large two-row rounded card (radius about 28, translucent white, 1px light border): placeholder on top, then the multicolor Copilot mark plus a "Quick" mode dropdown at left, and "+" and mic at right.
- The only colorful element on screen is the small product mark; AI identity comes from the surface warmth and the greeting.

## 03-cashapp-ai-chat-suggested-prompts.jpg
App: Cash App. [Open on Mobbin](https://mobbin.com/screens/56ff5f1d-e0ad-4657-90e3-ab6ba37081e2)

- Pure black canvas (#000000); suggested prompts are left-aligned, content-width pills stacked vertically just above the input (fill #1C1C1E, radius about 24, 17pt grey text #9A9A9A), each with a small 3D money emoji-style icon.
- Prompts are phrased in the user's own first-person voice about their own data ("Am I spending more this week").
- Input placeholder is a sentence starter, "I want to...", with a circular grey send button (about 36pt) on the right.
- Trust line under the input in tiny monospace grey: "AI can make mistakes, double-check responses."

## 04-strava-athlete-intelligence-card.jpg
App: Strava. [Open on Mobbin](https://mobbin.com/screens/f6b18597-ed12-4014-98bb-7da449d3ad85)

- AI insight is a white card (radius about 16, 1px border #E6E6EA, soft shadow) headed by a small orange brand glyph and a named feature label, "Athlete Intelligence" (about 14pt bold). A named feature replaces the generic sparkle.
- Body is two to three lines of plain, congratulatory language at about 19pt regular (#1A1A1A), larger than ordinary body text, so the insight reads as the headline of the screen.
- One full-width pill CTA, "Say More" (fill #FC5200, white 15pt bold, height about 36, fully rounded), expands the summary into detail.
- A black tooltip bubble above the card (radius about 8, white 14pt) announces the AI feature on first view.

## 05-binance-ai-tldr-insight-card.jpg
App: Binance. [Open on Mobbin](https://mobbin.com/screens/2d2a3770-9b50-4408-9adc-336faea190bd)

- The AI card has a thin gradient border (blue #7AA7FF through lilac to peach #FFC59A) and a very faint tinted fill (#F8FAFF); radius about 12. Everything else on the page is flat white.
- Header row: gradient 4-point sparkle glyph, bold "TLDR" label, and a right-aligned grey freshness stamp, "Updated 1 h ago".
- Content is one lead sentence then a numbered list of three reasons, each starting with a short topic label ("Market Correction:"), about 14pt with generous line height.
- Disclaimer inside the card under a hairline: about 11pt grey, "The information in this Binance AI Report could be inaccurate." Below the card, claims carry a small "10+ posts" source chip.

## 06-oura-daily-summary.jpg
App: Oura. [Open on Mobbin](https://mobbin.com/screens/b506181e-1d58-4d54-bcda-0bee5d476e50)

- Dark UI (#0F0D12). The summary card is marked by a soft purple radial glow at its top edge (#4A2D5E fading to #1E1823), radius about 24, no border and no "AI" badge.
- Title "Daily summary" (about 22pt regular, white) with a timestamp underneath, "14 min ago" (about 13pt, grey #A6A0AD), showing the text is freshly generated.
- Body is second-person, coach-like prose (about 16pt, line height about 24) that explains the data and ends with one concrete suggestion.
- The chart ("Recent days") sits below the prose, so explanation comes before data. A floating circular sparkle button (bottom right, about 44pt, dark fill) opens the AI advisor from any screen.

## 07-visible-score-summary-evidence.jpg
App: Visible. [Open on Mobbin](https://mobbin.com/screens/21e71f6b-c03e-46f7-ab80-01c217ffa35d)

- Verdict first: a segmented arc gauge with a large numeral (about 40pt) and a two-word verdict, "Looking stable", then a two-line plain explanation centered below. Navy background (#1E1F4B), mint accent (#C5F0B5).
- "Your score summary" is a stack of evidence rows (fill #2A2C63, radius about 12): a round direction-arrow icon, one plain sentence per factor, and a chevron to expand.
- An expanded row shows the measured value on a horizontal range bar with the normal range marked ("HRV 53" between 52 and 73), so each sentence is backed by a visible number.
- Single full-width pill button "Done" (pale blue #D6ECFA, dark text, height about 52).

## 08-lovi-analysis-validation-evidence.jpg
App: Lovi. [Open on Mobbin](https://mobbin.com/screens/65dd1ac4-1957-4540-bed0-dba067ffb1e2)

- "Based on your skin profile" header lists the inputs the AI used as an icon row (goal, concern, type), so the user sees what the conclusion rests on.
- Evidence card (white, radius about 20, 1px border #ECECF0) shows three cropped photos (radius about 14) with the regions named beneath in blue link text.
- Agreement is shown as a green pill with a check icon, "Good alignment with the analysis" (fill #7AC943, white 13pt, fully rounded), plus a thin slider scale from "Not Present" to "Aligns" with a marker.
- A plain-language paragraph follows (about 15pt) and tells the user they can change the goal later, which keeps the user in control.

## 09-raycast-tool-step-loading.jpg
App: Raycast. [Open on Mobbin](https://mobbin.com/screens/48b8a26f-7d63-40f2-8dc4-7a15edc900af)

- While working, the assistant first states its intent in a sentence ("I'll search for some insights on..."), then shows a tool-step row: white card, radius about 12, 1px border #E5E5EA, red app icon, label "Web Search", and an iOS activity spinner right-aligned.
- The send button turns into a black circular stop button (about 32pt) during generation.
- User message is a grey bubble (#F0F0F3, radius about 14), assistant text has no bubble, about 17pt.
- No shimmer or gradient; progress is communicated by naming the step.

## 10-starling-assistant-reading-state.jpg
App: Starling. [Open on Mobbin](https://mobbin.com/screens/e5acac21-4d71-425b-b4cb-6e5bd5a103b8)

- Header subtitle states the disclosure permanently: "Starling Assistant" (about 15pt semibold) over "Responses generated by AI" (about 13pt grey).
- Loading is a single inline line: small purple sparkle-in-circle glyph plus purple text "Reading your message..." (#7B3FC4, about 15pt). The wording describes the stage in human terms.
- User bubble is tinted mint (#D9F5F0) with teal text; input has a 1.5px teal outline (radius about 24) and a small teal circular send button.

## 11-bond-approve-regenerate.jpg
App: Bond. [Open on Mobbin](https://mobbin.com/screens/94ed850c-3e2c-4363-8660-1c8c42ddcf5e)

- The AI result is one large white card (radius about 28, soft shadow) on a light grey page (#F2F2F4): image strip, bold title (about 22pt), meta row, then a justification paragraph with the key name bolded and a "more" truncation.
- A grey context chip inside the card, "No related memories available" (#F0F0F2, radius about 14, 12pt), is honest about what context the AI did or did not use.
- Two equal pill buttons pinned at the bottom: "Approve" (white, thumbs-up icon) and "Regenerate" (black #111111, white text, refresh icon), each about 56pt tall, fully rounded.
- The original question stays visible as the screen title, "Best matcha place in New York".

## 12-capcut-ai-draft-regenerate-add.jpg
App: CapCut. [Open on Mobbin](https://mobbin.com/screens/faaaa08e-c857-41d4-806a-293f4c296e6b)

- Dark sheet (#1C1C1E) titled "Scripts for you". The draft sits in a lighter panel (#2C2C2E, radius about 12) with a version counter, "Scripts 1/2", and previous/next arrows at bottom right to page between drafts.
- Disclosure inside the draft panel: info icon plus about 11pt grey text, "Script is generated automatically by AI...".
- Thumbs up and thumbs down sit at the bottom left of the draft panel.
- Action bar: a square icon-only regenerate button (dark grey, radius about 10) beside a wide white primary button "Add" (radius about 10, black text, small blue-gradient dot as the AI mark).

## 13-splitwise-receipt-extracted-fields.jpg
App: Splitwise. [Open on Mobbin](https://mobbin.com/screens/ba220c78-9ede-4bd0-ba41-16c6476716fa)

- Title "Confirm items" with the instruction "Add, delete, or modify" (about 20pt), which frames the extraction as a draft for the user to correct.
- A thumbnail of the scanned receipt (about 80 by 110pt, radius about 6) sits beside the extracted totals: Subtotal, TAX, and a bold Grand total with right-aligned amounts.
- Each extracted line item is its own tappable outlined row (white, 1px border #E3E3E8, radius about 10, height about 44) with the name left and the price right; a grey "Add item" row with a purple plus icon follows.
- Full-width purple pill "Next" (#9B51D6, white text, height about 44).

## 14-beside-ai-summary-card.jpg
App: Beside. [Open on Mobbin](https://mobbin.com/screens/ec0028ee-2399-499b-b6a0-1722bc8d1997)

- The "AI Summary" card has a 2 to 3pt blue gradient outline (#6FB6FF to #2B4BFF) with an outer blue glow, white fill, radius about 20. It is the only colored object on a monochrome page.
- Header: small round blue app glyph plus "AI Summary" (about 15pt bold), then a hairline divider.
- Body bullets bold the key data values ("300, 200, and 400") inside regular text.
- A row of round grey action buttons above the card (Invite Team, Copy Link, Email, Copy Text) makes the AI output shareable; a "Transcript" chip at top left links back to the raw source.

---

## Patterns worth borrowing

1. **Home AI insight card (features 1 and 3).** White card, radius 16, named feature label with a small brand glyph in the header (Strava), verdict sentence at about 19pt ("You get 78% of the speed you pay for"), freshness stamp at right ("Updated 1 h ago", Binance), and one pill CTA "Say more" that opens the diagnosis.
2. **Single accent treatment for AI surfaces.** Pick one marker and use it only on AI content: a thin gradient border with a faint tint (Binance, Beside) or a soft top glow on dark (Oura). Keep all non-AI cards flat so the marker stays meaningful.
3. **Diagnosis detail with evidence rows (feature 2).** Verdict gauge and two-word verdict at top, then a stack of expandable rows, one plain sentence each with a direction icon, expanding to the measured value on a range bar against the label's typical speed (Visible). Add an agreement pill and a scale for confidence (Lovi): "High confidence: provider".
4. **"What we looked at" input row (features 1 and 2).** A small icon row above the diagnosis naming the inputs used, for example 14 days, 212 tests, Wi-Fi and wired (Lovi header; Bond's context chip for stating missing data).
5. **Inline evidence chips in explanations (feature 3).** Small monospace grey pills after each claim that link to the underlying data, for example "tue 9pm test" or "label: 300 Mbps" (Perplexity), plus a "12 tests" style count chip.
6. **Assistant chat empty state (feature 5).** Large personal greeting, then suggested prompts written in the user's voice about their own data ("Why is my internet slow at night?"), placed directly above the composer as chips or stacked pills (Copilot, Cash App). One line of small grey disclosure text under the input.
7. **Follow-up questions as rows (feature 5).** After each answer, three "↳" follow-up rows separated by hairlines rather than more chips (Perplexity).
8. **Named-step loading (analyzing states).** A sentence of intent, then step rows with a spinner that name the work: "Reading 212 speed tests", "Comparing to your label" (Raycast). For short waits, one tinted inline line with a small glyph (Starling). Swap the send button for a stop button while running.
9. **Report draft with approve, edit, regenerate (feature 6).** Draft in its own panel with a version counter and paging arrows, an "AI generated" line inside the panel, thumbs feedback, and a bottom bar with an icon-only regenerate next to a dominant approve button (CapCut, Bond). Nothing is sent until approve is tapped.
10. **Bill scan confirmation (feature 7).** Scanned bill thumbnail beside the extracted totals, every extracted field as an editable outlined row (plan price, equipment fee, taxes), an "Add item" row, and a heading that asks the user to confirm or modify (Splitwise).
11. **Plan recommendation card (feature 4).** One large card with the recommended plan as the title, a short justification paragraph with the key fact bolded, a numbered list of three reasons with short topic labels (Binance), and Approve or "Show another" pill buttons (Bond).

## Mobbin notice

None of the nine search results returned an `ai_usage_notice` field, so there is no notice text to reproduce.
