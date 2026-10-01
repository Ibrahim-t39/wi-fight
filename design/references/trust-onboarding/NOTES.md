# Trust, onboarding, setup and export references (Mobbin, iOS)

Collected 2026-09-30 for "DiJITZ Speed Test vs. Label Checker". All sizes are estimates in points on a 393pt-wide iPhone canvas, read off the screenshots; hex values are eyeballed, not sampled. Treat them as starting values.

## Saved references

### 01-perplexity-consent-shield.jpg
Perplexity - [mobbin](https://mobbin.com/screens/4597c7ea-99cf-40b1-81fa-9b0546b885db)
- Modal sheet (grabber, round 40pt close button top-left) on warm off-white (~#FBFAF6). Hero is a ~40pt outlined shield-with-keyhole glyph centred in three faint concentric rings (~170pt across, teal at about 5 to 10 percent opacity).
- Two-line centred headline, ~24pt regular weight ("Private by design. Personalized by nature."), then a ~16pt grey (~#5E6B6B) centred sub-line.
- Three promise rows, left-aligned: ~22pt outline icon (lock, shield, branch-with-x), ~15pt body in grey, ~16pt gap between rows, no dividers, no card. One inline underlined link ("See all models.").
- Footer: ~13pt grey "By continuing, you agree to our Privacy policy" directly above a full-width pill button, ~46pt tall, muted teal (~#3F7C85), white ~16pt label "I consent".

### 02-monzo-shared-information-consent.jpg
Monzo - [mobbin](https://mobbin.com/screens/ae9c6069-35d6-4377-9573-a9b3fb1f633b)
- Soft blue-to-green tinted gradient background (~#EEF6F4 to #DCEBF5 at top right). Round white 40pt back button. Left-aligned bold ~26pt navy headline (~#0F1B33) and ~16pt grey sub-line.
- White card, ~24pt corner radius, with a small bold ~14pt caption "Shared information" and four rows ~54pt tall: 32pt rounded-square filled icon tile (~8pt radius, steel blue ~#3E7FA8, white glyph), ~16pt label, and a 20pt blue "i" info button on the right. Hairline dividers inset to the text edge.
- Trust microcopy sits directly under the card in ~12pt grey: "We encrypt the information we get from your bank. You'll be asked to renew access every 90 days and can remove an account at any time."
- Two stacked pill buttons, ~48pt tall: "Accept all & Continue" and "Reject optional & Continue", both disabled (grey ~#E3E7E6) until the user scrolls, with a "Scroll to continue" hint above. Accept and reject have equal visual weight.

### 03-copilot-permissions-list.jpg
Microsoft Copilot - [mobbin](https://mobbin.com/screens/0cd130d9-7007-475a-9379-c65d6bea2a05)
- No card at all: rows sit straight on a vertical gradient (pale blue ~#CFE4EE at top to warm beige ~#EDE6E0 at bottom).
- Headline ~28pt medium, left-aligned, two lines; body ~16pt. Sub-line says "You can change these settings anytime in the app."
- Three rows: ~20pt outline icon, bold ~17pt title, ~15pt regular explanation of the benefit to the user written in first person ("I can give you better local answers if I know where you're at"). ~22pt gap between rows.
- Single full-width pill button, ~54pt tall, near-black (~#1B1A19), white ~17pt label "Continue", pinned ~40pt above the home indicator.

### 04-worldapp-deleted-vs-kept-data.jpg
World App - [mobbin](https://mobbin.com/screens/3ddecd96-2103-42d0-ae79-3c673ac1e205)
- Centred ~28pt semibold headline and ~17pt grey sub-line ("you are always in full control over your personal information").
- Two stacked cards that state both sides: card 1 is white with a hairline border, a 32pt teal circle icon, title "App User Data" and caption "This data will be deleted", then a divider and a plain bulleted list of the exact items. Card 2 is filled grey (~#F3F3F3) with a grey lock circle, "Blockchain Data / This data will not be deleted", and its bullets are dimmed grey.
- Card radius ~20pt, ~20pt inner padding, bullets ~14pt with ~26pt line spacing. The colour difference (teal active vs grey locked) carries the collected / not-collected distinction without any red.

### 05-applehealth-private-and-secure.jpg
Apple Health - [mobbin](https://mobbin.com/screens/faf8920d-c937-418e-8318-8b56d352b38c)
- White sheet with ~36pt top corners over a tinted backdrop; 44pt round back button.
- ~90pt gradient heart (pink ~#F0507A to red-orange ~#F0483A) with a white padlock inside: the product's own symbol plus a lock, rather than a generic shield.
- Bold ~21pt black headline immediately followed by three ~20pt grey (~#8A8A8E) paragraphs, each one a single plain claim: encrypted on device when locked; cannot be read by anyone, including Apple; you can turn off sharing at any time.
- Blue "i" circle plus "Learn more..." link, then a ~50pt pill button, system blue (~#3B82F6), white label "Continue".

### 06-coinbase-signin-passkey-email.jpg
Coinbase - [mobbin](https://mobbin.com/screens/c1de9b34-0a2d-49d0-844b-122b25d5aebd)
- Left-aligned ~26pt semibold title "Sign in to Coinbase", bold ~14pt field label above the field.
- Email field ~56pt tall, ~8pt radius, 2pt blue focus border (~#0052FF), grey placeholder. Primary pill "Continue" ~56pt tall, same blue, white label.
- "OR" divider with hairlines either side, then three secondary pills (~56pt tall, light grey fill ~#EEF0F3, black label left-aligned, glyph right-aligned): "Sign in with Passkey" (person-plus-key glyph), Google, Apple.
- Shown in an in-app browser sheet with the lock glyph and domain in the address bar, which itself works as a trust cue.

### 07-uber-passkey-faceid-sheet.jpg
Uber - [mobbin](https://mobbin.com/screens/d4fe252b-ce72-4c90-89b1-a42f71b9ba70)
- App screen behind: black title "Verify with a passkey", one full-width grey row button "Continue with a passkey" with passkey glyph left and chevron right (~56pt tall, ~10pt radius), then two small grey chips for fallbacks: "Send code via SMS" and "More options".
- System passkey sheet on top: "Sign In" title with passkey glyph, 44pt blue Face ID glyph, bold ~20pt "Use Face ID to sign in?", one-line explanation, compact blue "Continue" button (~44pt tall, ~10pt radius) and a blue text link "Other Sign In Options".
- Useful as the exact native sheet we should mock up rather than redrawing our own biometric dialog.

### 08-monzo-provider-search-list.jpg
Monzo - [mobbin](https://mobbin.com/screens/b7ea82da-c192-41bb-8281-b03e73abe20a)
- Centred ~17pt semibold nav title with a round white back button; full-width white search pill ~44pt tall with magnifier and "Search" placeholder.
- One tall white card (~24pt radius) holding the list. Rows ~56pt tall: 32pt logo tile with ~6pt radius, ~17pt name, ~12pt grey caption underneath listing what that provider offers, grey chevron right. Dividers inset to the text.
- Same pale blue-green gradient background as reference 02, so the list card reads as the only solid surface.

### 09-n26-plan-radio-cards.jpg
N26 - [mobbin](https://mobbin.com/screens/18e7cded-bc1d-474d-817e-30906f3d6e5a)
- Sheet opens with three benefit rows: 44pt pale-teal circle (~#D9EBE8) holding a dark teal outline icon, ~16pt title, ~13pt grey caption.
- Section title "Choose your phone plan" then radio cards ~84pt tall, ~10pt radius. Unselected: 1pt grey border, white fill, empty 22pt radio. Selected: 2pt teal border (~#1F7A6C), very light teal fill, filled radio.
- Inside each card: small grey size label ("Medium") over a bold value ("30 GB") on the left; price right-aligned in bold with "/month" in small grey below and a struck-through old price above.
- Full-width "Continue" button ~50pt tall, ~8pt radius (not a pill), solid teal, pinned to the bottom over the scrolling list.

### 10-klarna-plan-radio-cards.jpg
Klarna - [mobbin](https://mobbin.com/screens/2913d96b-f3bc-4491-ba77-06871c3c6469)
- Radio cards ~76pt tall, ~14pt radius: radio left, bold ~16pt title ("3GB - Small"), ~13pt grey validity line, price right-aligned. Selected card has a 2pt near-black border; the recommended card is filled lavender (~#EDE7FB) with a purple "Recommended" pill badge (~#7B4FD6, white ~12pt text).
- A fourth outlined pill row "See all available plans >" at the same width as the cards.
- Explicit consent checkbox (22pt square, ~4pt radius) with ~13pt text and underlined bold links, then small print, then a ~52pt near-black pill button (~#0B051D) "Continue to checkout".

### 11-cashapp-confirm-info-edit-rows.jpg
Cash App - [mobbin](https://mobbin.com/screens/72e44691-f3f0-415d-bfb1-6cab65a4ceb8)
- Pure white, no cards. Round 44pt close button top-left. ~26pt bold two-line headline "Confirm your info before we create your form".
- Summary rows ~64pt tall: bold ~15pt label over ~14pt regular value, and on the right a small grey "Edit" pill (~56x30pt, fill ~#EDEDED, bold ~13pt). No dividers; spacing alone separates rows.
- Last row is an explicit affirmative control: "E-sign your form" with a filled black 22pt checkbox.
- Black pill button ~52pt tall, white label "Create form". The label names the outcome, not "Submit".

### 12-howwefeel-security-data-controls.jpg
How We Feel - [mobbin](https://mobbin.com/screens/6311eeb6-c9dd-4c75-b2b8-b95b19ce5744)
- True-black background, white serif ~28pt page title "Security & Data", serif ~22pt section headings "Verification" and "Data", grey ~15pt sans helper text.
- Rows ~44pt tall with hairline dividers: 22pt outline icon, ~16pt label, and either an iOS switch (green ~#34C759 when on) or a right arrow. Rows: Face ID / Passcode, iCloud Sync, Download my data, Import data.
- Destructive action is separated at the very bottom as an outlined pill (~52pt tall, 1pt white border, no fill) "Delete all my data", with ~12pt grey consequence text: "All data you generated will be deleted from your device and the server. This cannot be undone." No red is used.

### 13-withings-review-report-before-share.jpg
Withings Health Mate - [mobbin](https://mobbin.com/screens/dd65c67f-9b15-41fa-8e33-6c7fe30a70c6)
- Sheet on warm grey (~#F1EFEC). Centred ~20pt medium title "Review your Report" and ~15pt sub-line "Here's what you will be sharing. Tap to zoom in."
- The actual PDF page is shown as a white page thumbnail (~320pt wide, soft shadow, no radius) with its real header band, name, date range and page footer.
- Bottom bar on white with a hairline top border: two equal-width buttons, ~46pt tall, ~12pt radius: outlined "Close" left, solid black "Share" right.

### 14-indrive-pdf-preview-export-actions.jpg
inDrive - [mobbin](https://mobbin.com/screens/e7ce7ac5-22ca-4d50-9bcf-8aaddf7da919)
- Full document preview on light grey (~#F2F2F2), white page with thin shadow, close "x" top-right.
- Bottom white tray with ~24pt top radius and three evenly spaced actions: 44pt light grey circle with a dark glyph, ~15pt label beneath: Download, Share, Mail.
- The tray keeps the document visible while choosing where it goes, which is what we want before a report leaves the phone.

### 15-oportun-welcome-headline.jpg
Oportun - [mobbin](https://mobbin.com/screens/404693d9-e018-4f5f-be9b-0beff043ae16)
- Top 55 percent is a flat-colour geometric illustration (lilac, mint, salmon, sky blue circles and arcs around a seated person on a phone) on white.
- Left-aligned heavy ~36pt black headline in two lines with tight leading, then ~16pt grey (~#5A5A5A) three-line supporting paragraph.
- Two equal-width buttons side by side, ~52pt tall, ~12pt radius: outlined "Log in" (2pt black border) and solid black "Sign up".

## Also reviewed, not saved
- Onboarding flows: [lululemon](https://mobbin.com/flows/68559489-94dd-47cd-b157-c17687bef70f) (notification pre-prompt with three icon rows, "Stop notifications anytime if you change your mind", primary button plus "Not Now"), [ZARA](https://mobbin.com/flows/c7461e71-6158-43bc-8419-7a877100e9fc) (thin segmented progress bar, "You can change this later in the Settings section of the app"), [Turo](https://mobbin.com/flows/468fe59a-69ba-4e7f-a8fb-8c0ddc48bf71) (illustrated pre-prompt, then the system alert, with a "Later" escape top-right).
- [ANZ Plus "The data we need"](https://mobbin.com/screens/9edc9609-f246-4083-9440-9e67e9031a88): per-category consent card with a toggle and an expandable bullet list of exact fields, plus a retention line ("collected and used on an ongoing basis for 12 months").
- [Microsoft Copilot privacy settings](https://mobbin.com/screens/73beaf82-f229-4cca-979c-49f374063995): toggles with helper text, "View, export or delete history" row, and a separated "Delete my account" pill with consequence text.
- [Zopa "Check your details"](https://mobbin.com/screens/a5f2f215-16fc-42f4-b11c-601c7e12d165): grouped summary rows with "Update" links and "Yes, that's correct" / "Not right now" buttons.
- [Zopa "Choose your provider"](https://mobbin.com/screens/5c462f32-1851-4edc-acd8-6d5c661df048): 3-segment progress line with dots above a provider search.

## Patterns worth borrowing

1. **Welcome**: Oportun layout (15). Illustration in the top half, heavy ~36pt left-aligned headline, ~16pt grey paragraph, two side-by-side ~52pt buttons (outlined "Log in", solid "Get started").
2. **Consent, what we collect**: Monzo card (02). White ~24pt-radius card on a tinted background, ~54pt rows with a 32pt filled icon tile, label, and an "i" button that opens a one-sentence explanation. Rows for us: speed results, IP address seen by M-Lab, plan and bill details.
3. **Consent, what we do not collect**: World App two-card contrast (04). Active-colour card "We collect" and a grey lock card "We never collect", each with a short bulleted list of exact items.
4. **Consent promise block and button**: Perplexity (01). Shield-with-keyhole in concentric rings, three icon-plus-sentence promises (encrypted, never sold, delete any time), and a button whose label is the act itself ("I consent"). Add Monzo's equal-weight decline button (02) so refusing is as easy as accepting.
5. **Secure sign-in**: Coinbase stack (06). One email field and primary "Continue" for the email code, "OR" divider, then a grey "Sign in with Passkey" pill with the passkey glyph. Follow with the native Face ID passkey sheet as in Uber (07), and keep Uber's small fallback chips.
6. **Provider picker**: Monzo list (08). Search pill on top, single white card of ~56pt rows with a 32pt logo tile, name, grey caption (for us: connection type, e.g. "Fiber, cable"), and chevron. Zopa's 3-segment progress line above it.
7. **Plan picker with label values**: N26 radio card (09). Label and bold value on the left (plan name, typical download speed), price right-aligned with "/month" beneath; selected state is a 2pt accent border plus a light tint. Klarna's pill badge (10) can mark "Your current plan".
8. **Privacy and data controls**: How We Feel (12). Section headings, ~44pt icon rows with switches (Face ID, Pause tests) and arrow rows (Download my data), and the delete action isolated at the bottom as an outlined pill with one line of consequence text.
9. **Review and approve before sending**: Cash App rows (11). Label over value with a grey "Edit" pill on each row, an explicit checkbox as the last row, and an outcome-named primary button ("Send report to provider").
10. **Share / export with PDF preview**: Withings (13) for the framing sentence and the real page thumbnail with Close / Share, combined with inDrive's bottom tray (14) of three circular actions (Download, Share, Mail).

### Plain-language consent microcopy patterns
- State the reader's control in the first sentence: "Here's what you will be sharing." (Withings), "you are always in full control over your personal information" (World App).
- One claim per sentence, no legal nouns: "This data cannot be read by anyone, including Apple, without your permission and it is never sold to a third party." (Apple Health)
- Say how to undo it, right where consent is given: "You can change these settings anytime in the app." (Copilot), "can remove an account at any time" (Monzo), "You can disconnect your health data or delete it at any time." (Perplexity)
- Name the exact items and the reason next to each: "Device ID - For identifying devices" (Weverse style), "Required for display in My Accounts" (ANZ Plus).
- State both sides: "This data will be deleted" / "This data will not be deleted" (World App).
- Give a time limit where there is one: "You'll be asked to renew access every 90 days" (Monzo), "for 12 months from the date you agree" (ANZ Plus).
- State consequences of destructive actions flatly: "This cannot be undone." (How We Feel)
- Button labels name the act: "I consent", "Create form", "Share", rather than "OK" or "Submit".
- Avoid the weaker pattern seen in several results ("We value your privacy" followed by a paragraph about partners and ads): a headline claim with no specifics reads as legalistic.

## Mobbin notice

None of the search results returned an `ai_usage_notice` field, so there is no notice text to reproduce.
