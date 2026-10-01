# Live web references for Proofband

Captured 2026-09-30 with headless Google Chrome on macOS. Every file listed as kept was opened and looked at before these notes were written. Sizes quoted below are estimates read off the screenshots (1440 px wide desktop, 393 px wide phone at 2x), not values from the sites' CSS.

## How the captures were made (read this before trusting a file)

- Desktop: 1440x900. "tall" files: 1440x2400. Mobile: 393x852 at 2x, iPhone Safari user agent.
- The plain `--screenshot` command worked for most desktop pages. Two problems forced a second method:
  1. Headless Chrome will not make a window narrower than about 500 px, so the first mobile pass laid pages out at about 500 px and cropped the right edge. All mobile files were re-captured through the Chrome DevTools Protocol with real 393 px device emulation. The kept mobile files are the corrected ones.
  2. Some pages (Fing, fast.com) were blank or frozen at zero under `--virtual-time-budget`. They were re-captured with a real 7 to 12 second wait.
- No logins, no cookie banners clicked, no bot checks solved or worked around. Where a site blocked the browser, the file was deleted and listed under Capture failures.
- Privacy edit: the household IP address was painted over in `01-speedtest-desktop.png` and `03-cloudflare-desktop.png`. ISP name and city are still visible in those two files. Nothing else was altered.
- `_preview/` holds downscaled copies of the tall captures plus a 2x zoom of the broadband label (`_preview/17-label-zoom.png`).

## Capture table

| File | URL | View | Usable |
|---|---|---|---|
| 01-speedtest-desktop.png | speedtest.net | desktop | Yes (IP redacted) |
| 01-speedtest-mobile.png | speedtest.net | mobile | Yes, but it shows the "better with the app" interstitial over the test, which is itself the finding |
| 02-fast-desktop.png | fast.com | desktop | Yes (finished result, 400 Mbps) |
| 02-fast-mobile.png | fast.com | mobile | Yes (mid-test, 350 Mbps, grey digits) |
| 03-cloudflare-desktop.png | speed.cloudflare.com | desktop | Partly: page shell visible, results area blurred behind a "Verifying..." human check (IP redacted) |
| 03-cloudflare-mobile.png | speed.cloudflare.com | mobile | Partly: same, "Verify you are human" box |
| 04-mlab-desktop.png | speed.measurementlab.net | desktop | Yes |
| 04-mlab-mobile.png | speed.measurementlab.net | mobile | Yes |
| 05-fing-desktop.png | fing.com | desktop | Yes |
| 05-fing-desktop-tall.png | fing.com | desktop tall | Yes |
| 05-fing-mobile.png | fing.com | mobile | Yes |
| 06-linear-desktop.png | linear.app | desktop | Yes |
| 06-linear-desktop-tall.png | linear.app | desktop tall | Yes |
| 06-linear-mobile.png | linear.app | mobile | Yes |
| 07-vercel-desktop.png | vercel.com | desktop | Yes |
| 07-vercel-desktop-tall.png | vercel.com | desktop tall | Yes |
| 07-vercel-mobile.png | vercel.com | mobile | Yes (subhead caught mid text-scramble animation) |
| 08-perplexity-mobile.png | perplexity.ai | mobile | Partly: header, prompt headline and cookie card only; the input box did not render |
| 09-stripe-desktop.png | stripe.com | desktop | Yes |
| 09-stripe-desktop-tall.png | stripe.com | desktop tall | Yes |
| 09-stripe-mobile.png | stripe.com | mobile | Yes |
| 10-rocketmoney-desktop.png | rocketmoney.com | desktop | Yes |
| 10-rocketmoney-desktop-tall.png | rocketmoney.com | desktop tall | Yes |
| 10-rocketmoney-mobile.png | rocketmoney.com | mobile | Yes |
| 11-monarch-desktop.png | monarch.com | desktop | Yes (thin cookie strip at bottom) |
| 11-monarch-desktop-tall.png | monarch.com | desktop tall | Yes (served a different hero variant than the 900 px capture) |
| 11-monarch-mobile.png | monarch.com | mobile | Yes (cookie strip at bottom) |
| 13-oura-desktop.png | ouraring.com | desktop | Yes (cookie bar covers the bottom 15%) |
| 13-oura-mobile.png | ouraring.com | mobile | Partly: cookie sheet covers the bottom 45%, hero text is clear |
| 14-copilot-desktop.png | copilot.money | desktop | Yes |
| 14-copilot-desktop-tall.png | copilot.money | desktop tall | Yes |
| 14-copilot-mobile.png | copilot.money | mobile | Yes |
| 15-granola-desktop.png | granola.ai | desktop | Yes (cookie card overlaps the bottom edge) |
| 15-granola-desktop-tall.png | granola.ai | desktop tall | Partly: the hero is sized to the 2400 px viewport, so it is mostly empty space |
| 15-granola-mobile.png | granola.ai | mobile | Partly: cookie card covers the button and product visual, headline is clear |
| 16-raycast-desktop.png | raycast.com | desktop | Yes |
| 16-raycast-desktop-tall.png | raycast.com | desktop tall | Yes |
| 16-raycast-mobile.png | raycast.com | mobile | Yes |
| 17-fcc-label-gfiber-desktop-tall.png | fiber.google.com/broadband-labels/ | desktop tall | Yes. Substitute for fcc.gov, which refused the browser. Shows a real, filled-in FCC broadband label |
| 17-fcc-label-gfiber-crop.png | crop of the file above | crop | Yes. The label panel only |
| 18-mercury-desktop.png | mercury.com (own pick) | desktop | Yes |
| 18-mercury-mobile.png | mercury.com | mobile | Yes |
| 19-notion-desktop.png | notion.com (own pick) | desktop | Yes |
| 19-notion-mobile.png | notion.com | mobile | Yes |
| 20-ramp-mobile.png | ramp.com (own pick) | mobile | Yes |

Totals: 44 screenshots kept plus 1 crop. 20 sites attempted in the original list plus 3 own picks. Group B: 10 of 11 listed sites have at least one usable file (Whoop has none; Perplexity has mobile only), plus Mercury, Notion and Ramp (mobile).

## Competitor baseline

### Speedtest by Ookla (`01-speedtest-desktop.png`, `01-speedtest-mobile.png`)
- Shows: black page, a single ringed "GO" button about 200 px wide in the centre, ISP name and server city under it, a Multi/Single connection toggle, and "Results" and "Settings" links. Five ad slots surround the test on desktop (left skyscraper, top banner, two right rectangles, bottom banner), all house ads for Speedtest apps in this capture.
- On mobile the first thing shown is a modal, "Speedtest is better with the app", with an App Store badge. The test is behind a "Continue on the web" link. An ad banner sits at the bottom.
- Does well: one obvious action, instantly recognisable, dark and light toggle in the nav, shows which server will be used.
- Missing versus Proofband: nothing about the plan you pay for, no verdict, no history or proof visible on this screen, no AI, no explanation of what the numbers mean. No privacy statement in view. Ads take more area than the test.

### Fast.com (`02-fast-desktop.png`, `02-fast-mobile.png`)
- Shows: white page, logo, the sentence "Your Internet speed is" and one number, "400 Mbps", in black digits roughly 250 px tall. A refresh ring, a "Show more info" outline button, three round icons (help, Facebook, Twitter), "Powered by Netflix". Test starts by itself on load; digits are grey while it runs.
- Does well: the clearest single-number presentation in the category. No ads, no setup, one sentence a non-expert can read. "Privacy" link is in the top right corner.
- Missing: download only by default, no plan comparison, no verdict, no history, no proof to share beyond social buttons, no AI. A bare number with no "is this good?" answer.

### Cloudflare Speed Test (`03-cloudflare-desktop.png`, `03-cloudflare-mobile.png`)
- Shows: dark dashboard shell. Left panel "Your Internet Speed" with a round START button, right panel "Server Location" listing connection type, server city, network name and IP. Before the test can start it shows the sentence "When you run Speed Test, your IP address will be shared with Cloudflare and processed in accordance with our privacy policy" and a human-verification widget. The metric layout behind it is blurred until the check passes.
- Does well: states the privacy consequence in plain words right next to the start button. Clean two-panel layout with thin 1 px borders. On mobile the panels stack with the start button first.
- Missing: the result content could not be seen in this capture, so no claim about it. On the visible screen there is no plan comparison, verdict or AI. Vocabulary is technical (IPv6, AS number, airport codes). A bot check before a speed test is friction.

### M-Lab Speed Test (`04-mlab-desktop.png`, `04-mlab-mobile.png`)
- Shows: solid purple page, dark purple left rail with logo and three nav items (Measure, About, Contact). Heading "Test Your Speed" in bold white sans, about 48 px. A consent checkbox, "I agree to the data policy, which includes retention and publication of IP addresses", a pill "BEGIN" button that stays disabled until the box is ticked, and an empty ring where the result will draw.
- Does well: the most honest consent of the group; the user must agree before anything runs. Simple, no ads.
- Missing: low contrast (lilac text on purple, a pale disabled button). No plan comparison, verdict, history, proof or AI. The consent text says IP addresses are published, which a household may not want; Proofband can make a stronger privacy promise.

### Fing (`05-fing-desktop.png`, `05-fing-desktop-tall.png`, `05-fing-mobile.png`)
- Shows: a white marketing site, not a test. Mint pill badge "#1 NETWORK SCANNER", headline "Manage your network like a pro" (bold navy, about 60 px, "like a pro" underlined in mint), body copy "Powered by a decade of machine learning...", blue "Download for free" and outline "See it in action" buttons, Trustpilot 4.5 score. Right half: a device-table screenshot on a blue-to-mint gradient block with two floating cards ("Setups need attention"). Below: three stats (15M scans monthly, 450K device models, 30M users) and a "Strengthen your cybersecurity" feature list.
- Does well: the most polished site of the five. Real product UI in the hero, social proof directly under the buttons, floating callout cards that explain the screenshot.
- Missing: the pitch is devices and security, not speed versus plan. No verdict, no label comparison, no shareable report in view. "Machine learning" is one phrase in body copy, not a visible feature. Aimed at "home users and IT professionals", so the tone is technical. Primary mobile call to action is "Get the Mobile App".

## What the best sites do

1. Left-aligned hero, product directly underneath. `06-linear-desktop.png`: headline at about 64 px, medium weight, tight letter spacing, two lines, left aligned at an 80 px margin; one grey 16 px sentence under it; then a full-width product window that starts at 60% of the first screen and bleeds off the bottom. No hero button at all; the only call to action is the white pill "Sign up" in the nav.
2. Two-tone headline instead of headline plus paragraph. `09-stripe-desktop.png` sets the first sentence in near-black and the rest in slate blue at the same size (about 48 px, weight around 400). `06-linear-desktop-tall.png` does the same for its second section (white then grey). The lead sentence carries the message; the grey part is supporting copy that still reads as a headline.
3. One live number as a proof point above the headline. `09-stripe-desktop.png`: "Global GDP running on Stripe: 1.72461273%" in 14 px with ticking digits. `20-ramp-mobile.png`: "US corporate payments processed by Ramp: 0.906151%" in a grey chip, and a bottom ticker "Agents at work today: accounting fields coded 4,722,006".
4. Nav is thin and quiet. Height is 64 to 72 px, links are 14 to 15 px regular weight, the sign-up button is a small pill or 6 px radius rectangle. `16-raycast-desktop.png` floats the nav as a rounded, bordered capsule inset from the page edges. `11-monarch-desktop.png` uses a white rounded bar floating over the photo. On every mobile capture the nav collapses to logo, one button and a two or three line menu icon (`06-linear-mobile.png`, `19-notion-mobile.png`).
5. Backgrounds are either near-black or warm off-white, rarely pure white. Dark: `06-linear-desktop.png` (#08090a-like), `07-vercel-desktop.png` (pure black), `14-copilot-desktop.png` (deep navy), `16-raycast-desktop.png`. Warm light: `11-monarch-desktop.png` (cream), `15-granola-desktop.png` (off-white with olive button), `10-rocketmoney-desktop.png` (white page, hero inside a light grey card with about 40 px radius).
6. Glow and gradient are used once, as a single focal object. `07-vercel-desktop.png`: one black triangle with a soft grainy white halo, nothing else. `09-stripe-desktop.png`: one orange-pink-violet ribbon crossing the top right corner, with the text sitting over it. `16-raycast-desktop-tall.png`: red glow only behind the product window. `05-fing-desktop.png`: one blue-to-mint block behind the screenshot.
7. Product visuals are real UI in a frame, with floating cards for the point. `10-rocketmoney-desktop.png`: a phone showing "$3,298 current spend, $98 below avg. spend" with a small check icon. `10-rocketmoney-desktop-tall.png`: photo of a person plus a floating white card of three line items. `09-stripe-desktop-tall.png`: bento grid of cards, each with a title at the top left, a small expand icon at the top right and a UI mock-up on a gradient at the bottom. `11-monarch-desktop-tall.png`: a full dashboard screenshot with four stat tiles and a chart, 12 px radius and a soft shadow.
8. Buttons are pills or softly rounded, high contrast, one primary. Black pill on light (`10-rocketmoney-desktop.png` "Sign up today"), white pill on dark (`07-vercel-desktop.png` "Deploy now" next to an outlined "Talk to sales"), orange pill with arrow (`11-monarch-desktop.png`), olive pill with a down arrow (`15-granola-desktop.png`), acid yellow rectangle (`20-ramp-mobile.png`). On mobile, primary and secondary buttons become full width and stack (`07-vercel-mobile.png`, `09-stripe-mobile.png`, `19-notion-mobile.png`).
9. AI is shown as work done inside the product, not as a sparkle badge. `06-linear-desktop.png`: the activity feed has rows like "Triage Intelligence added the labels Performance and iOS" and "Linear: Changed 2 files, draft PR awaiting your review" next to human comments. `07-vercel-desktop-tall.png`: a chat panel, "How can I help you today?" with three suggested actions and an input. `15-granola-desktop.png`: "The AI notepad" in an 88 px serif headline, with a plain notes window and a "Transcribing" pill. `14-copilot-desktop.png`: a blue top strip, "Meet your money assistant". `19-notion-desktop.png`: "AI" is a top-level nav item and the sidebar lists named agents. `08-perplexity-mobile.png`: the whole screen is one question, "What do you want to know?".
10. Mobile is a re-ordering, not a shrink. Headlines stay large (36 to 44 px) and wrap to three or four lines (`06-linear-mobile.png`, `15-granola-mobile.png`, `14-copilot-mobile.png`). `09-stripe-mobile.png` drops the long grey sentence and keeps only the first clause. `07-vercel-mobile.png` moves the glow object above the headline and centres the text. `11-monarch-mobile.png` puts the photo first with floating account cards over it, then headline, then button. Desktop product windows are allowed to crop off the right edge rather than shrink to unreadable (`06-linear-mobile.png`, `05-fing-mobile.png`).

Consumer and trust touches worth noting: award laurels in a row under the hero (`11-monarch-desktop-tall.png`, `14-copilot-desktop-tall.png`), a regulatory disclosure in a dark rounded bar pinned inside the hero (`18-mercury-desktop.png`), an email field joined to the button (`18-mercury-desktop.png`, `20-ramp-mobile.png`), and a mixed serif and sans headline for warmth (`11-monarch-desktop.png`, "manage" in sans and "your money" in serif).

The broadband label itself (`17-fcc-label-gfiber-crop.png`, `_preview/17-label-zoom.png`): a narrow white card titled "Broadband Facts", sections separated by thick coloured rules: provider and plan name, Monthly Price, Additional Charges and Terms, Discounts and Bundles, Speeds Provided with Plan (Typical Download Speed, Typical Upload Speed, Typical Latency), Data Included, policy links, Customer Support, and a Unique Plan Identifier. Left label, right-aligned value on every row. Google Fiber surrounds it with hand-written orange annotations and arrows pointing at rows.

## Recommendations for Proofband

1. Make the verdict the hero, in fast.com's scale. One sentence and one huge number, "You get 78% of the speed you pay for", with the number at 160 px or more on desktop. Reference: `02-fast-desktop.png`. Unlike fast.com, put the answer to "is that good?" on the next line.
2. Put a "Broadband Facts" style card next to the measured result. Reuse the label's own row layout (label left, value right, thick rules) so "Typical Download Speed: 300 Mbps" sits beside "Measured: 234 Mbps". People will recognise the format from their provider. Reference: `17-fcc-label-gfiber-crop.png`.
3. Annotate that card with short call-outs and arrows on the landing page, to teach what the label is in five seconds. Reference: `17-fcc-label-gfiber-desktop-tall.png`.
4. Use the Linear hero structure for the landing page: left-aligned two-line headline, one grey sentence, then the real dashboard in a bordered, rounded window that bleeds off the first screen. Reference: `06-linear-desktop.png`. On phones let the window crop at the right edge as in `06-linear-mobile.png`.
5. Show AI as rows of completed work in the dashboard, not as a chat bubble logo. An activity feed with entries such as "Proofband AI: evening speeds drop 40% between 7 and 10 pm, likely congestion" and "Drafted your report to the provider, ready to review". Reference: `06-linear-desktop.png`. Add a chat panel with three suggested questions as the secondary surface. Reference: `07-vercel-desktop-tall.png`.
6. State privacy next to the start button in one plain sentence, and beat the competitors on it. Cloudflare and M-Lab both disclose IP sharing at the point of action (`03-cloudflare-desktop.png`, `04-mlab-desktop.png`); Speedtest shows ads instead (`01-speedtest-desktop.png`). Proofband should say what is stored, that it is not published, and carry no ads. Keep contrast far higher than M-Lab's lilac on purple.
7. Use floating result cards over a soft block to explain the product, consumer-finance style. A card reading "This month: 234 Mbps average, 66 below your plan" with a check or warning icon, as in `10-rocketmoney-desktop.png`, and a stat-tile row plus one chart for the dashboard as in `11-monarch-desktop-tall.png`. A warm off-white background and a pill button suit a household audience better than a black developer look.
8. On mobile, never block the test. Speedtest's app interstitial (`01-speedtest-mobile.png`) is the opening Proofband can exploit: the site is the product. Stack headline, one full-width primary button and the verdict card in the first screen, following `19-notion-mobile.png` and `09-stripe-mobile.png`, and keep one accent glow or gradient at most, as in `07-vercel-mobile.png`.

## Capture failures

- https://www.fcc.gov/broadbandlabels: "Access Denied" (Akamai edge error) on three attempts. Deleted. Replaced by Google Fiber's public broadband label page, which displays a real label.
- https://www.xfinity.com/learn/internet-service/broadband-labels (tried as a second label source): "Access Denied". Deleted.
- A Wikipedia URL guessed for the label returned "no article with this exact name". Deleted.
- https://www.perplexity.ai desktop: Cloudflare "Performing security verification" page on both attempts. Deleted. The mobile capture loaded but only partly.
- https://www.whoop.com desktop: Cloudflare "Sorry, you have been blocked" on both attempts. Deleted. Mobile loaded but a cookie dialog covered the lower half and overlapped the headline. Deleted. No Whoop reference is kept.
- https://ramp.com desktop: the site served headless Chrome a plain-text "Machine Version" page aimed at AI agents (it includes a sign-up bonus offer) instead of the real home page. Not a design reference. Deleted. The mobile capture is the real page and is kept.
- https://speed.cloudflare.com: kept, but the results area is blurred behind a human-verification widget that was not solved.
- https://www.fing.com: first pass was blank (content fades in on real time); fixed on re-capture.
- https://fast.com: first pass hung for 60 seconds under virtual time and then showed "0"; fixed on re-capture with a real 12 second wait.
- All first-pass mobile files were cropped on the right because of the headless minimum window width; all were replaced.
- Cookie banners that could not be dismissed without clicking remain in the Oura, Granola, Monarch and Perplexity captures.
