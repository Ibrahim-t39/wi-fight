# Streaming / media UI references

Source: Mobbin, iOS screens, collected 2026-09-30. Images are 1179x2676 (3x of a 393pt-wide iPhone).
All hex values, point sizes and radii below are visual estimates read from the screenshots, not measured values. Each image carries a Mobbin attribution strip at the bottom that is not part of the app UI.

## Saved screens

### 01-spotify-wrapped-share-card.jpg
App: Spotify (Wrapped 2025) — [mobbin](https://mobbin.com/screens/6b681412-559a-4fbf-af3e-1e97b4207e84)
- Light, warm off-white page (~#F0EEE9), not dark: the share card is the only saturated object. Card is a square-cornered (0 radius) portrait slab about 195pt wide, with a 1pt black outline and a black/white checker border behind the photo.
- Color variants per card in a horizontal pager (mustard ~#E0A800, lilac ~#8C7CF0); next card peeks about 40pt from the right edge; 4 page dots below.
- Data layout inside the card: two columns of small 11pt labels over ranked lists, then two hero stats ("12,775", "K-Pop") at about 20pt heavy weight. Brand mark bottom-left, URL bottom-right in tiny caps.
- Single black pill "Share" button (about 72x36pt, full radius, white 15pt bold label) centered under the pager.

### 02-apple-music-replay-year-stat.jpg
App: Apple Music (Replay '24) — [mobbin](https://mobbin.com/screens/920b2af5-cd88-482d-b480-4f0a6c1a288b)
- Full-bleed modal sheet (top corners about 38pt) on a blurred multi-stop gradient: royal blue ~#2B5BD7 at top, through teal/green ~#5E9E8A at left-middle, to near-black navy ~#0B1220 at bottom-right.
- Story-style segmented progress bar across the top (about 6 thin segments), circular translucent blue close button top-right.
- Hero number "2024" about 80pt, semibold, white, left-aligned, tight tracking. Below it a 2x2 grid of stats: 13pt semibold label, 20pt medium value, 13pt dimmed secondary line.
- Band of overlapping album artwork across the upper third implies a horizontal parallax animation. Two 36pt circular translucent buttons in the bottom corners (sound, share).

### 03-spotify-ai-dj-listening-ring.jpg
App: Spotify (AI DJ) — [mobbin](https://mobbin.com/screens/5a62608d-754f-4449-94e5-49e8e1ca215c)
- Flat saturated cobalt background (~#0D55C0) edge to edge, no gradient, no cards.
- One central element: a closed ring about 235pt in diameter, stroke about 18pt, Spotify green (~#1ED760) with a slightly lighter blue inner shadow ring, giving a soft 3D feel.
- Status word "Listening..." about 22pt bold white, centered roughly 130pt below the ring; text button "Cancel" 15pt bold; fine-print disclosure about AI use in 12pt at 70% white.
- Chrome is minimal: chevron-down top-left, "DJ" 13pt bold title, ellipsis top-right.

### 04-spotify-ai-dj-working-ring.jpg
App: Spotify (AI DJ) — [mobbin](https://mobbin.com/screens/553f1975-c606-498b-9d5d-e8e3fc881425)
- Same cobalt background; the ring is now broken into 4 round-capped arc segments with uneven gaps, clearly a rotating/breathing "thinking" state.
- Status label changes to "Working on it..." (22pt bold); transport controls underneath are dimmed to about 40% white while the AI is busy.
- Shows the state-machine idea: same shape, different stroke treatment per state (solid = listening, dashed = working).

### 05-spotify-ai-dj-onboarding.jpg
App: Spotify (AI DJ permission primer) — [mobbin](https://mobbin.com/screens/0831a00e-8379-44a1-8992-f3e79dcd3cdb)
- Top 40% is an illustration panel: gradient from deep navy ~#0A1A5C to teal ~#1FB8A6, with the green ring drawn as a twisted ribbon and a few white star sparkles. Bottom 60% is pure black (#000000).
- Headline about 20pt bold white, centered. Two explainer rows: small line icon + 16pt semibold title + 15pt regular body at ~70% white.
- Primary CTA is a green pill (~#1ED760, about 118x48pt, full radius) with black bold label; secondary "Not now" is a plain white bold text button beneath.

### 06-digg-daily-now-playing-gradient.jpg
App: Digg (Digg Daily AI audio briefing) — [mobbin](https://mobbin.com/screens/7cadb759-d12f-4b67-a7e3-2b6396e366a1)
- Vertical gradient background: dark navy ~#0A1E4A at top, bright blue ~#1E63D8 around 25% height, falling to near-black navy ~#0A1428 at the bottom.
- Story-style segmented progress (6 segments) at the very top, with a sparkle icon next to the title to mark AI-generated content.
- Square artwork about 160pt with about 12pt radius and a soft drop shadow, centered. Category label in bold 15pt, headline in 17pt medium, both left-aligned.
- Thin 2pt scrubber with a 12pt blue thumb, time labels in 15pt; play/pause is a 40pt filled blue circle. "UP NEXT" row separated by a hairline.

### 07-mindvalley-player-central-circle.jpg
App: Mindvalley — [mobbin](https://mobbin.com/screens/9ab36e2e-1a22-43a4-b8bf-6f341c736e35)
- Pure black background (#000000). Single circular artwork about 235pt diameter in warm orange, centered in the upper half.
- Below it, a strict centered stack: title 18pt semibold, artist 15pt regular, countdown "9:49" 17pt bold, then one 84pt white circular pause button with black glyph.
- A small dark-gray capsule chip (~#1C1C1E, about 88x44pt, full radius) at the bottom holds the timer option. No tab bar, no scrubber: the screen is one focus object plus one action.

### 08-moonly-player-glass-controls.jpg
App: Moonly — [mobbin](https://mobbin.com/screens/7da9d94d-dc40-4f54-b78d-329263982cad)
- Full-screen animated radial artwork (concentric rings and wedges in plum ~#5B2A6E, sage ~#4F6B45, sand ~#B89A62) with visible grain, on a deep purple base ~#2A1040.
- Controls are frosted-glass circles: 84pt center pause, 68pt skip buttons, each with a thin warm-gold 1pt rim and background blur.
- Speed picker is a translucent dark popover (about 22pt radius, heavy blur, 17pt rows, checkmark on the selected row). Scrubber sits in a glass capsule at the bottom with a thick 6pt white track.

### 09-apple-tv-home-carousels-floating-tabbar.jpg
App: Apple TV — [mobbin](https://mobbin.com/screens/042cc95c-d884-46d1-aa9d-909ef705b100)
- Pure black page. Section headers 20pt bold white with a gray chevron. Three stacked horizontal carousels with different card shapes: wide editorial cards (about 240x235pt), score cards (about 240x150pt), and tall poster tiles (about 100x150pt). All use about 16pt radius.
- Cards use image-then-blurred-footer treatment: text sits on a darkened, blurred extension of the photo instead of a flat panel.
- Tab bar is a floating glass capsule (about 280x64pt, full radius, dark translucent with a faint light rim), inset about 20pt from the edges, with a separate 64pt circular search button to its right. Active tab has a lighter inner pill.

### 10-peacock-home-carousels-floating-tabbar.jpg
App: Peacock — [mobbin](https://mobbin.com/screens/ab7e8632-1a14-48e2-ae9d-4b71f6aa41ed)
- Near-black background (~#0B0B0D). Top nav is text-only category links (17pt medium) beside the logo, no bar background.
- Hero carousel of tall cards (about 220x320pt, about 12pt radius) with strong color gradients (slate gray, purple ~#7A2BD0) and a "NEW" white badge on the section label.
- Floating tab bar: dark translucent capsule about 345x52pt, icon-only, active tab marked by a short yellow underline (~#F5C518) under a white icon; the profile avatar occupies the last slot.

### 11-tubi-home-pill-tabbar.jpg
App: Tubi — [mobbin](https://mobbin.com/screens/9a804881-b9ae-47eb-9958-599d190b1224)
- Very dark violet-black background (~#0D0716). Filter chips at top: selected chip is solid white with black text, unselected are dark translucent capsules.
- Content is grouped inside a raised container card (~#1A1722, about 20pt radius) holding a bold 17pt section title, a circular chevron button, and a mixed grid of one wide and several tall tiles (about 10pt radius).
- Floating pill tab bar with labels (about 345x60pt); the active tab gets a filled lighter capsule and bright yellow icon + label (~#F5E13C). A 48pt yellow circular FAB (cast) floats above it at right.

### 12-spotify-video-quality-sheet.jpg
App: Spotify — [mobbin](https://mobbin.com/screens/601da1d4-14f3-4219-b50c-11cf8c71548a)
- Bottom sheet over a dimmed (about 60% black) video. Sheet is dark gray ~#1F1F1F with about 16pt top radius and a 36pt grabber.
- Each option is two lines: 16pt semibold title (e.g. "High (720p)") and 13pt gray explanation written in terms of the user's connection ("Best quality for a faster connection"). Selected row shows a white checkmark at right; no radio buttons.
- An info note at the bottom sits in a slightly lighter rounded box (~#2A2A2A, 10pt radius) with an (i) icon.

### 13-airbuds-daily-stats-card.jpg
App: Airbuds Widget — [mobbin](https://mobbin.com/screens/37122d58-9f4b-44e7-9327-ba3609ab8726)
- Near-black page (~#151515) with a faint dot grid and a violet glow (~#5B2BD6) bleeding from behind the card at mid-height.
- Card is pure black, about 345x560pt, about 32pt radius, with a thin gradient stroke running violet to mint green (~#7C4DFF to ~#3DF5A0) on the top edge.
- Inside: tiny all-caps kicker, logo, date in two lines (violet light weight over white bold, about 20pt), a 130pt circular photo with a 3pt gradient ring, then "TODAY'S STATS" and two outlined stat tiles (about 150x70pt, 14pt radius, 1pt dark-gray stroke) with 26pt extra-bold wide numerals over 12pt labels.

### 14-soundcloud-settings-mini-player.jpg
App: SoundCloud — [mobbin](https://mobbin.com/screens/e0773335-b737-4842-abb5-883f0ef027ba)
- Near-black background (~#121212). Settings rows are 15pt bold white titles with 13pt gray explanatory paragraphs beneath; toggles use SoundCloud orange (~#FF5500) when on.
- Floating mini player: full-radius capsule (about 375x62pt) with a 1pt lighter stroke, containing a 30pt white circular play button, two-line title, cast icon and orange heart. It floats above the tab bar with about 8pt gap.
- Tab bar is flat, 4 items, icon + 11pt label, active item white and inactive gray.

## Patterns worth borrowing

1. Live speed test = "one object, one word" screen (Spotify AI DJ 03/04, Mindvalley 07). Flat or near-flat saturated background, a single ring about 60% of screen width, the live Mbps number inside or directly under it, one status word ("Testing download..."), one text button ("Cancel"). Hide the tab bar during the test.
2. Ring as state machine (Spotify AI DJ 03/04). Same ring, different stroke per phase: broken rotating arcs while connecting/measuring, closed solid ring when a phase completes. Dim all other controls to about 40% while the test runs.
3. Hero number typography (Apple Music Replay 02). One number at about 80pt semibold, tight tracking, left-aligned, with a 2x2 grid of small label + value pairs beneath. Maps directly to the Verdict screen: "78%" as the hero, then typical speed, measured median, tests run, days measured.
4. Story-style verdict sequence (Apple Music Replay 02, Digg 06). Segmented progress bar at the top, tap to advance, close button top-right, share button bottom-right. Use for the two-week reveal: one stat per page, ending on the share card.
5. Shareable report card (Spotify Wrapped 01, Airbuds 13). A portrait card that is self-contained and brandable: kicker, hero stat, 2 columns of supporting facts, logo and URL in the footer. Present it in a horizontal pager with color variants and a single pill "Share" button under it. For a dark version, use Airbuds' black card with a thin gradient stroke and outlined stat tiles.
6. Ambient gradient as mood/status (Digg 06, Apple Music 02, Airbuds 13). A dark base with one colored glow rather than colored cards. The glow color could carry the verdict (green good, amber partial, red poor) on Home and Verdict.
7. Floating glass tab bar plus separate circular action (Apple TV 09, Tubi 11, Peacock 10). Capsule tab bar inset from the edges with blur, active tab as an inner pill; a detached circular button beside or above it is a natural home for "Run test now".
8. Floating status capsule above the tab bar (SoundCloud 14). The mini-player pattern fits a persistent "Next scheduled test in 2h" or "Test running: 142 Mbps" capsule on every tab that expands into the full-screen test.
9. Home dashboard as stacked carousels with varied card shapes (Apple TV 09, Tubi 11). Section header + chevron, then a row of 16pt-radius cards; mix one wide card (latest result) with smaller tiles (history days, AI tips). Tubi's raised container card is a good way to group a section.
10. Plain-language option sheets (Spotify 12) and AI permission primer (Spotify 05). Two-line rows where the second line explains the choice in terms of connection quality suit test-frequency and plan-selection settings. The half-illustration, half-black primer with two icon rows and a single colored pill CTA suits onboarding and the AI consent step.

## Mobbin notice

No search result in this session included an `ai_usage_notice` field, so there is no notice text to reproduce.
