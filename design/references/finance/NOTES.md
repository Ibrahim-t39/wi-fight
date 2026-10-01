# Finance / fintech UI references

Source: Mobbin, iOS screens. All hex values, radii and point sizes below are visual estimates read off the screenshots (at 1x, 393pt-wide frame), not measured from source files.

## Saved screens

### 01-monzo-trends-balance-line.jpg
Monzo, Trends (balance). [Open on Mobbin](https://mobbin.com/screens/25125eda-5e62-4166-9a68-9b25bcc349b6)
- Background is a very pale mint-to-white wash (~#EEF6F3 to #FFFFFF); chart sits in a white card, radius ~24pt, soft diffuse shadow, no border.
- Hero number top-right of card: ~32pt heavy, with the pence set smaller (~20pt) on the same baseline; caption "End of Day Balance" ~12pt grey (#6B7280). Date label top-left ~17pt bold.
- Line chart: ~2pt stepped line in slate blue (~#4A8DB0), pale blue fill under it, hollow-ring markers at start and at the selected day, dashed vertical scrubber, lighter dashed continuation labelled "EST" for the forecast. Y labels right-aligned outside the plot (max, estimate, 0); only two x labels (start and end date).
- Floating pill tab bar (radius ~32pt, translucent white, shadow) with 5 icon+label items; active item gets a grey-blue pill behind it. Filter chips above the chart ("Balance / Spending / Target") are white pills with icon + 13pt semibold label. Full-width CTA is a 48pt-tall pill in muted blue (#4A8DB0) with white 16pt bold text.

### 02-coinbase-home-balance-chart.jpg
Coinbase, Home. [Open on Mobbin](https://mobbin.com/screens/9cc67605-c277-4edc-816d-010d0d50c0b3)
- Pure white background, single accent blue ~#0052FF, text near-black #0A0B0D. No cards around the chart; it runs edge to edge.
- Hero balance ~28pt bold, left-aligned, with a 36pt circular grey collapse button on the right. No label above it.
- Chart: ~1.5pt blue line with a dotted/halftone blue fill beneath (not a gradient), no axes or grid at all.
- Range selector is plain text (1H 1D 1W 1M 1Y All), ~13pt medium grey; selected item sits in a light blue pill (#E8F0FE, radius ~16pt) with blue text. Bottom has two side-by-side 44pt pill buttons: primary solid blue with white text, secondary light-blue tint with blue text. Tab bar is icon-only, 5 items, active one filled blue.

### 03-cryptocom-overview-dark-balance.jpg
Crypto.com, Accounts overview. [Open on Mobbin](https://mobbin.com/screens/8505ff3c-ef22-46a9-b33e-3ae2bcdd39dc)
- Dark navy background ~#0B1426, cards one step lighter ~#152238, radius ~12pt, no border, no shadow.
- Centered hero: 13pt grey label "Total Balance" with eye icon, then ~30pt number where the dollars are white bold and the cents plus currency code are dimmed grey; below it a 13pt green delta line (~#1DBF8E) "+$0.51 (+2.64%) profit in last 24H".
- Chart: ~1.5pt bright blue line (#1E90FF) with a blue-to-transparent vertical gradient fill; no axes, only min and max values annotated in small grey text at the points themselves.
- Range chips are outlined capsules (1pt border #2A3B55, radius ~16pt, 32pt tall); selected chip has blue border, blue text and a faint blue fill. Underline-style segmented tabs ("Overview / Performance") with a 2pt blue underline on the active one.

### 04-n26-asset-price-delta-range.jpg
N26, investment asset detail. [Open on Mobbin](https://mobbin.com/screens/a677f8e2-e234-49b3-9966-34d12e4ca46f)
- White background with a faint warm grey; accent teal ~#1F7F78; negative red ~#B8414B.
- Hero number ~34pt bold near-black, left-aligned; directly below, a 17pt semibold red delta line with a down triangle, absolute change, dot separator, percent. Timestamp 13pt grey under that.
- Chart: ~2pt dark teal line, no fill, 4 faint dashed horizontal gridlines, no axis labels except the high and low values printed next to the line ends; hollow ring marks the current point.
- Range selector is an iOS-style segmented control: grey track (#E5E5E5, radius ~8pt), selected segment white with teal bold text. Outlined tag chips with icon (radius ~8pt, 1pt grey border). Primary CTA is full-width, 48pt tall, radius ~8pt, solid teal. Standard 5-item tab bar, active item teal.

### 05-copilot-investments-delta-pill.jpg
Copilot Money, Investments. [Open on Mobbin](https://mobbin.com/screens/443f8c14-6129-4010-93fd-34268670cf2f)
- Saturated blue header band (~#1E63D8) with white wordmark and white capsule top tabs (selected = white pill with blue text); body is light grey-blue (#EEF1F6) with white cards, radius ~6pt, light shadow.
- Hero inside card, centered: small green percent with arrow above, then number ~26pt bold with a superscript-style small "$", then 12pt grey caption.
- Chart: ~2pt green line with soft green fill, dotted grey baseline for the "before data" portion, ring marker at the end. Range row below as plain grey text with a light grey pill on the selected one.
- Delta pills: tiny capsules with tinted background (pale red #FDECEC or pale green) and an arrow plus percent in 11pt semibold; used under each mini sparkline tile. Section headers are 13pt bold with a disclosure triangle and an uppercase 10pt grey column label on the right.

### 06-revolut-spent-bar-chart-dark.jpg
Revolut, Analytics (spent). [Open on Mobbin](https://mobbin.com/screens/00858497-3c29-4b4c-a931-2ce62727360f)
- True black background #000000; cards #1C1C1E, radius ~16pt, no border. Accent is a soft blue (~#7C9CF5) used only for links and the average line.
- Hero: 15pt white label "Spent", then ~32pt bold number, then a 13pt line mixing blue ("$3.69 avg. per month") and grey (date range).
- Bar chart: solid white bars ~24pt wide with small 2pt top radius, dotted horizontal lines for max and for the average (the average line and its value are blue), month labels 12pt grey beneath. No y axis line.
- Range selector is a full-width dark capsule track (#1C1C1E, radius ~18pt) with a lighter grey pill (#3A3A3C) on the selected item, plus a separate circular "more" button. Top-right has a 3-icon segmented toggle to switch chart type (line, bar, donut). List rows: 40pt circular icon, 17pt title, 13pt grey subtitle, right-aligned amount with percent below.

### 07-monzo-category-bars-avg-line.jpg
Monzo, Trends category detail. [Open on Mobbin](https://mobbin.com/screens/4790268f-11b6-4f94-b49b-0f3dd208f05e)
- Screen background is a vertical tint gradient keyed to the category (pink ~#E9C6DD at top fading to pale green/white); chart card is white, radius ~24pt, soft shadow.
- Card header: "This month" 17pt bold with 12pt grey date range under it on the left; on the right the hero amount ~30pt heavy with smaller decimals and a 12pt "Spent" caption.
- Bar chart: magenta bars (~#D9459B), ~16pt wide, 3pt top radius; future weeks drawn as pale pink ghost bars; a blue dashed horizontal average line labelled "AVG" with its value on the right in blue. X labels 12pt grey, the current week label highlighted in blue.
- Transaction list below is grouped by uppercase 13pt grey date headers, each row in its own white rounded card (radius ~16pt) with a 36pt rounded-square avatar and a right-aligned amount using big-integer/small-decimal styling.

### 08-cred-spends-summary-dark.jpg
CRED, spends summary. [Open on Mobbin](https://mobbin.com/screens/7f33e880-f2cb-450b-a1bd-90def15a9e64)
- Near-black background ~#0D0D0D, monochrome palette; the only color is a green delta (~#2ECC71). Feels editorial: serif page title (~24pt light, lowercase) over wide-tracked uppercase 10pt grey section labels.
- Hero: label "TOTAL IN MAR '24", then ~24pt bold white number with a green down-arrow comparison line beside it ("from last month"). A second, dimmed grey 24pt number below for the 12-month total.
- Bar chart: dark grey bars (#3A3A3A) with square corners, the current month in solid white; dashed vertical gridlines per month, max and 0 labels on the right, single-letter month labels.
- Stat tiles: square-cornered (radius ~0 to 2pt) tiles with 1pt border #2A2A2A, icon top-left, 12pt grey label, 15pt bold value and an arrow. Primary button is a full-width white rectangle with sharp corners, black 15pt bold text and a long arrow.

### 09-acorns-current-plan-pay-per-month.jpg
Acorns, My subscription. [Open on Mobbin](https://mobbin.com/screens/e2581212-f3f5-44ad-b5b7-30831b131733)
- White background, sections separated by 8pt light grey bands (#F2F2F2) rather than cards. Accent green ~#5FBF3F, secondary purple ~#6B4EE6.
- Headline "You are on the Gold plan" ~28pt bold, two lines; under it the price line "You pay $12/month" in 17pt semibold green; then 14pt body text with bold inline bank name. Illustration bleeds off the right edge.
- List rows: outline icon, 16pt label, then a status capsule (radius ~12pt, 24pt tall): green fill "Active" or purple fill "Activate", white 12pt bold text, followed by a chevron. 1pt hairline dividers inset from the left.

### 10-rocketmoney-subscription-savings.jpg
Rocket Money, Subscription overview (onboarding). [Open on Mobbin](https://mobbin.com/screens/301a0b9c-d67a-4a7b-b154-23a57f864940)
- White background, black text, no accent color on this screen; very quiet. Title ~22pt semibold, 14pt subtitle.
- Finding card: 1pt light grey border, radius ~16pt, no shadow. Top of card is a plain-sentence result with the money figure in bold ("We detected 2 subscriptions costing you a total of $121 a year"), ~17pt. Below it a grey band header "Linked Accounts" (12pt) and rows with logo, 15pt name, 13pt grey type.
- Savings callout sits outside the card as centered 15pt text with the amount in bold ("Save up to $96 annually by canceling just 1 subscription").
- CTA: full-width black pill, ~52pt tall, radius fully rounded, white 16pt medium label, pinned to the bottom with ~20pt side margins.

### 11-plum-bill-tracker-ring.jpg
Plum, Bill Tracker. [Open on Mobbin](https://mobbin.com/screens/71b2faf5-4eb7-4909-a59b-5e2e4bf1d5f4)
- White background, dark navy text (~#1A2B4A), green ~#0E8A6A for "paid", purple (~#5B2ED8) for links and back chevron.
- Progress ring: ~150pt diameter, ~8pt stroke, round caps, green with a small gap at the top; inside it the total in ~22pt bold with a 13pt caption. To the right, a two-item legend with dot bullets, each showing a ~22pt bold value over a 14pt label.
- Section header 20pt bold with a purple "See all" on the right. Bill card: pale grey-blue tint (#F3F6FA), radius ~16pt, no border; a mint "Paid" status capsule top-right, 20pt bold amount, 13pt schedule text.

### 12-revolutbusiness-transaction-detail-rows.jpg
Revolut Business, transaction detail. [Open on Mobbin](https://mobbin.com/screens/6b91daf3-3825-489f-80d5-d7ad703adb99)
- Black background, grouped cards ~#1C1C1E, radius ~16pt, ~8pt gap between groups, 16pt side margins.
- Header: 40pt circular back button (dark grey fill), amount ~28pt bold in grey (pending state), 15pt white title, 13pt grey timestamp; a 44pt circular icon badge on the right.
- Key-value rows: ~48pt tall, label left in 15pt grey (#8E8E93), value right in 15pt white; tappable values in blue (~#6E9BF5) with a copy or info icon. Related rows are grouped 2 to 3 per card (Status/ID, Amount/Fees/Net, Description/From), no dividers inside the card.
- Final "Get help" row is a single-row card with chevron.

### 13-origin-ai-sidekick-insight-cards.jpg
Origin, Spending (AI Sidekick). [Open on Mobbin](https://mobbin.com/screens/5f9407fb-dfbe-45cb-b013-c0eddc1a8da8)
- Off-white background (~#F4F3F0), white cards radius ~24pt with a very light border/shadow. Typography mixes a grotesque sans for content with wide-tracked uppercase monospace for section labels and buttons ("QUESTION OF THE DAY", "ASK SIDEKICK", "HOW IT WORKS").
- AI entry point: card with the mono label, a 20pt question in plain language, then a full-width outlined pill button (1pt dark border, ~48pt tall) with a sparkle icon and mono label.
- "For you" insight carousel: horizontally scrolling inner cards (radius ~16pt, 1pt border), each with a tinted category capsule (pale blue or pale yellow, icon + 12pt label), a ~22pt bold number ("$32/month") and two lines of 14pt explanation.
- Tab bar: 6 items with uppercase mono 9pt labels; active item sits on a light grey rounded-square highlight.

### 14-cashapp-ai-prompt-chips.jpg
Cash App, AI assistant. [Open on Mobbin](https://mobbin.com/screens/56ff5f1d-e0ad-4657-90e3-ab6ba37081e2)
- Pure black screen, almost empty; all content anchored to the bottom above the keyboard zone. Two 40pt circular dark-grey buttons top-left (close) and top-right (history).
- Suggested prompts: left-aligned stack of dark grey bubbles (~#1C1C1E, radius ~22pt, 1pt lighter border), each with a small 3D emoji-like icon and 16pt grey text; they wrap to two lines and hug content width.
- Input: full-width capsule (radius ~24pt, ~48pt tall) with placeholder "I want to..." and a 36pt circular send button inside on the right.
- Disclaimer in 10pt monospace grey beneath the input: "AI can make mistakes, double-check responses."

## Patterns worth borrowing

1. **Hero metric (Home dashboard).** One number dominates: 32 to 40pt bold, small muted 13pt label above, colored delta line below with arrow, absolute and percent ("+2.64% in last 24H"). Dim the secondary part of the number (decimals/unit) as Crypto.com and Monzo do, so "78" is bright and "%" or "Mbps" is muted. From Crypto.com (03), N26 (04), Monzo (01).
2. **Score ring with side legend (Home, Verdict).** ~150pt ring, 8pt stroke, round caps, value centered inside, two-item legend to the right ("Paid for 300 Mbps" / "Getting 234 Mbps"). From Plum (11).
3. **Trend chart with reference line (History).** Bars or a 2pt line, no y axis, 2 to 3 right-aligned value labels, and a dashed horizontal line labelled with its value. Use the dashed line for the provider's "typical speed" from the broadband label; draw future/untested days as pale ghost bars. From Monzo (07) and Revolut (06).
4. **Time range selector (History).** Capsule track with a lighter pill on the selected item (Revolut 06), or outlined chips with accent border on the selected one (Crypto.com 03). 1W / 2W / 1M / All, 32 to 36pt tall, directly under the chart.
5. **Plain-sentence verdict card (Verdict/results).** Bordered card (1pt, radius 16pt) whose first line is a sentence with the number in bold, followed by a centered savings line with the dollar figure bold, and a full-width black pill CTA pinned at the bottom. From Rocket Money (10).
6. **Current plan header (Plan setup, Verdict).** "You are on the X plan" as a 28pt two-line headline with the monthly price directly under it in accent color, then rows with status capsules. From Acorns (09).
7. **Grouped key-value rows (Speed test result detail, Report export).** 2 to 3 rows per rounded card, grey label left, value right, tappable values in accent blue, 8pt gap between groups. Good for download / upload / ping / time / network. From Revolut Business (12).
8. **AI insight card (Home, AI detail).** Card with a small uppercase label, a one-line plain-language question or finding, and an outlined pill button with a sparkle icon; beneath, a horizontal carousel of insight tiles each with a tinted category capsule, a big number and two lines of text. From Origin (13).
9. **AI assistant prompt chips (AI assistant).** Bottom-anchored stack of suggested-question bubbles above a capsule input with an inner circular send button, plus a one-line "AI can make mistakes" disclaimer in tiny type. From Cash App (14).
10. **Delta pill (everywhere a change is shown).** Tiny capsule, tinted background, arrow + percent in 11pt semibold; green tint for good, red tint for shortfall. From Copilot Money (05).

## Mobbin notice

No `ai_usage_notice` field was present in any of the search results returned for this research.
