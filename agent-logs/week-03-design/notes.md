# Week 3 · design to code · working notes (bento-feature-grid)

Raw notes kept while doing the work, in order. The agent log is written from these.

## Step a — the design, drawn first (before any component code)

Files:
- `bento-design.svg` — the mock. Two frames at 1:1 pixel size, side by side: desktop (800 px wide, the
  demo stage on a laptop) at x 40, y 80 and phone (310 px wide, the stage on a 375 px phone) at x 880, y 80.
  Below the desktop frame is a token legend (swatches + specs).
- `bento-design.boxes.json` — every tile rectangle from the mock, relative to its frame
  (the numbers the code is checked against).

How it was drawn: a small script turned the token list below into SVG shapes (rects, text, paths), so every
coordinate is the result of the tokens, not eyeballed. Text in an SVG doesn't wrap by itself, so before drawing
I asked Chromium how the site's font stack breaks each line at each width (Geist is blocked in this sandbox,
so the browser falls back to Inter / DejaVu Sans Mono — the SVG uses the same font stack, so the mock and the
page fall back the same way). Tile boxes don't depend on text: every row is a fixed 168 px.

Content = the demo: "lofistack radio", a pretend lofi music / study app. Six tiles:
| tile | size | content |
|---|---|---|
| Endless lofi radio | lg 2×2 | link, badge "live", now-playing + 28 waveform bars (11 played) |
| Focus timer | tall 1×2 | ring at 72 %, 18:42 |
| Offline mode | sm 1×1 | download icon |
| Sleep timer | sm 1×1 | moon icon, badge "new" |
| Stations for every mood | wide 2×1 | link, 6 station pills ("rain" selected) |
| Keyboard first | wide 2×1 | link, 4 key caps (space / N / F / M) |

### Design tokens

Layout
- Section: no background of its own (sits on the stage surface `#1f1b16`).
- Columns by **container width** (not window): 4 columns at ≥ 768 px, 2 at ≥ 512 px, 1 below.
- Grid gap **12 px**. Row height **168 px** (fixed, so tile boxes never depend on text).
- Spans: `lg` 2 cols × 2 rows · `wide` 2 × 1 · `tall` 1 × 2 · `sm` 1 × 1. On 1 column every tile is
  1 column wide; `lg` keeps 2 rows (it's the hero), `tall` drops to 1 row. Dense packing.
- Desktop 800: column = (800 − 3×12) / 4 = **191 px**; 2 columns = 394. Rows at grid top + 0 / 180 / 360.
- Phone 310: one 310 px column.

Header
- Eyebrow: Geist Mono 11/16, uppercase, letter-spacing 0.2em, amber `#e0985f`.
- 12 px → heading (h2): Geist 600, **28/34** (24/30 under 512 px), letter-spacing −0.01em, `#ece4d6`.
- 12 px → subheading: Geist 400, 15/24, muted `#a2977f`, max width **480 px**.
- Grid starts **32 px** under the subheading (24 px under 512 px).
- Desktop grid top = 16 + 12 + 34 + 12 + 2×24 + 32 = **154 px**. Phone = 16 + 12 + 2×30 + 12 + 3×24 + 24 = **196 px**.

Tile
- Radius **16**, 1 px hairline `#37302a`, fill (raised) `#282219`, padding **20** (content box = tile − 42).
- Inside, top to bottom: visual (fills the free space) → **16** → title Geist 500 **15/20** `#ece4d6`
  (+ amber 14 px arrow 6 px after it when the tile is a link) → **4** → description 13/18 muted, max 3 lines.
- Tiles without a visual: icon chip at the top-left, text pinned to the bottom.
- Icon chip **32×32**, radius 10, amber at 12 % (`rgba(224,152,95,.12)`), 16 px amber line icon.
- Badge: Geist Mono 10/14 uppercase +0.12em, amber on amber 12 %, 18 px high, pill, **16 px** from the
  tile's inner top-right corner.
- Hover: lift 4 px, border goes amber at 45 %, a soft amber spotlight (radius ~260 px, 10 %) follows the
  pointer. Focus (link tiles): 2 px amber outline, 2 px offset. Pressed: back down, 1 % smaller.
- Reveal: tiles fade up 12 px, 70 ms apart, the first time the section scrolls into view.

Palette (all from the brief)
- page `#16130f` · stage/surface `#1f1b16` · tile/raised `#282219` · hairline `#37302a` · hover line `#4a4037`
- text `#ece4d6` · muted `#a2977f` · amber `#e0985f` · amber hover `#f3b983`

Demo visuals (drawn in the mock, built in demo.tsx with Tailwind only)
- Now playing: amber dot + "now playing" mono 11 amber; title 14/20 500; "side b · 1 hr 12 min" mono 11 muted;
  28 rounded bars, 4 px apart, up to 96 px tall, first 11 amber then `#4a4037`; time row mono 10 (12:08 / 1:12:00).
- Focus ring: 100-unit viewBox, r 44, stroke 6, amber arc 72 %, time in mono; up to 140 px, centred vertically.
- Station pills: 22 px high, Geist 12, 10 px side padding, 6 px gaps, wrap; "rain" in amber.
- Key caps: 28 px high, min 28 wide, radius 6, `#4a4037` edge with a 2 px bottom, mono 11; label mono 10 under it.

## Step b — code built from the design

`components/bento-feature-grid/component.tsx` + `demo.tsx`, written with the SVG open as the reference.
Every token became a Tailwind class (or one prop):
- 12 gap → `gap-3` · 16 radius → `rounded-2xl` · 20 padding → `p-5` · 1 px hairline → `border border-[#37302a]`
- 168 rows → `rowHeight` prop (default 168) → `grid-auto-rows` (inline style, since it's a prop)
- columns → `grid-cols-1 @lg:grid-cols-2 @3xl:grid-cols-4` (@lg = 512 px, @3xl = 768 px container)
- spans → lg `row-span-2 @lg:col-span-2` · wide `@lg:col-span-2` · tall `@lg:row-span-2` · sm nothing;
  `grid-flow-row-dense` for back-filling
- header: `text-[11px]/4 tracking-[0.2em]` → `mt-3 text-[24px]/[30px] @lg:text-[28px]/[34px]` →
  `mt-3 max-w-[480px] text-[15px]/6` → grid `mt-6 @lg:mt-8`
- tile text: visual `flex-1` → `mt-4` → `text-[15px]/5 font-medium` → `mt-1 text-[13px]/[18px] line-clamp-3`
- badge `absolute top-4 right-4 … px-2 py-0.5 text-[10px]/[14px]` (18 px high) · icon chip `size-8 rounded-[10px]`
- demo visuals: bars `h-24 gap-1 flex-1` · ring `h-full max-h-[140px] aspect-square my-auto` ·
  pills `h-[22px] px-2.5 gap-1.5` · caps `h-7 min-w-7 px-2 border-b-2` + `gap-1` label, `gap-4` between keys

## Step c — verify against the design

Tools (all Playwright + Chromium, 1× pixels):
- `bento-verify.mjs` opens the real component page, sets the demo stage's inner width to exactly 800 / 310 px,
  waits for the reveal to finish, reads every tile's `getBoundingClientRect()` relative to the section and
  compares it with `bento-design.boxes.json`; then screenshots exactly the section box.
- The SVG is rasterised by Chromium at 1× and clipped to each frame.
- `bento-compose.py` (PIL) makes side-by-side, 50 % overlay and a difference image.
- `bento-shift.py` finds, for named regions, the dx/dy shift that best lines the code up with the mock.
- `bento-inner.mjs` measures the boxes INSIDE the tiles (title line, description, badge, icon chip, ring,
  every pill, every key cap, bars) to check them against the mock's coordinates too.
Screenshots use reduced motion so the waveform bars stand still at their drawn heights.

### Round 1 — first build, forced 800 / 310 px
Tile boxes, code vs design (x, y, w, h relative to the section):
| tile | desktop 800 | phone 310 |
|---|---|---|
| radio (lg) | 0,154 394×348 → Δ 0 | 0,196 310×348 → Δ 0 |
| focus (tall) | 406,154 191×348 → Δ 0 | 0,556 310×168 → Δ 0 |
| offline (sm) | 609,154 191×168 → Δ 0 | 0,736 310×168 → Δ 0 |
| sleep (sm) | 609,334 191×168 → Δ 0 | 0,916 310×168 → Δ 0 |
| stations (wide) | 0,514 394×168 → Δ 0 | 0,1096 310×168 → Δ 0 |
| keys (wide) | 406,514 394×168 → Δ 0 | 0,1276 310×168 → Δ 0 |
Section 800×682 and 310×1444, grid top 154 / 196 — all equal to the mock. **12 of 12 boxes at 0 px.**

Inner boxes also equal to the mock to 0.01 px, e.g. radio title line 21,421 (mock 21,421), badge "live"
332.11,171 44.89×18 (mock same), ring 427,211 140×140 (mock same), pill row 1 at y 544 with x 21 / 70.27 /
150.47 / 203.27 / 285.53 (mock same), key caps at y 546, x 427 / 494.13 / 539.17 / 584.23 (mock 427 /
494.12 / 539.17 / 584.23).

Why it matched first time: every token was picked as a value Tailwind can say exactly (12 = gap-3, 20 = p-5,
16 = rounded-2xl…), rows are fixed so no box depends on text, and the mock's line breaks were measured in the
same browser before drawing. **No code change needed for the boxes.**

Pixel diff still showed something: 7,835 px (1.44 %) differ on desktop, 9,462 px (2.11 %) on phone (threshold
40/255). The diff image is only text outlines. Shift search, code vs mock:
heading 0 / description 0 / tile icons 0 / bars 0 / ring 0 · subheading −1 px · titles −1 px ·
"now playing" −1 px · pills −1 px · key caps −1 px · badges −2 px · time row −2 px (all vertical, x always 0).
Cause, tested on its own: the same text in the same line box, drawn by HTML vs by SVG
`dominant-baseline="central"` → SVG glyphs land 0 px lower at 28 px and 13 px, 1 px lower at 15, 11 and 10 px.
So the mock's way of placing text is off by up to a pixel (plus rounding), not the code — every line box
matches. Left as is (rule: fix the code, not the design; the boxes are right). Small mono text also looks a
little thinner in HTML (hinted) than in the SVG (unhinted).

### Round 2 — the real page widths, normal motion (no forced width)
The live stage is 798 px wide at a 1280 px window (not 800) and 309 px at 375 px (not 310):
desktop tiles radio 0,154 393×348 (Δw −1) · focus 405,154 190.5×348 (Δx −1, Δw −0.5) · offline / sleep
607.5 190.5 (Δx −1.5, Δw −0.5) · stations 393 wide (Δw −1) · keys 405 393 (Δx −1, Δw −1); phone all tiles
309 wide (Δw −1), every y and h Δ 0. Worst difference 1.5 px — inside ±2 px. No change.
Line breaks at 309 px still match the mock (checked side by side).

### Round 3 — states (things a still mock can't show)
Interaction tests on the page (`bento-interact.mjs`):
- Reveal (window 1280×240 so the grid starts below the fold): opacity 0 on all 6 tiles before scrolling;
  120 ms after scrolling 0.30, 0, 0, 0, 0, 0 (stagger running); settled 1 × 6, translate 0.
- Hover: lift exactly 4.00 px, border amber at 45 %, spotlight variables follow the pointer (40 px, 60 px),
  spotlight opacity 1.
- **Bug found: link tiles had NO focus ring.** Keyboard Tab reached the 3 link tiles but computed
  `outline-style: none`. Cause: Tailwind v4's `outline-none` sets `--tw-outline-style: none`, and
  `focus-visible:outline-2` uses that variable, so the ring never draws. Fix: dropped `outline-none`
  → now `solid 2px #e0985f`, offset 2 px. (The reference magnetic-button and the site's own focus style use
  the same pattern and show no ring either — reported, not changed: outside this task's folders.)
- Reduced motion: all tiles visible at load, `transition-property: none`, waveform animation none, no lift,
  spotlight `display: none`.
- 2 columns (container 562 px): lg 562×348 · tall 275×348 · sm 275×168 ×2 beside it · wide 562×168 ×2.
- No console errors or warnings.

### Final — after the fixes, forced 800 / 310 px again
All 12 tile boxes Δ 0 (unchanged by the focus fix). Pixel diff 1.44 % / 2.11 % — text-placement only, as above.
Images: `bento-compare-desktop.png`, `bento-compare-phone.png` (design | code), `bento-overlay-desktop.png`,
`bento-overlay-phone.png` (50 % blend), `bento-diff-desktop.png`, `bento-diff-phone.png` (what differs).

Scripts used (kept outside the repo, in `/home/claude/tools/`): `bento-draw-design.mjs` (tokens → SVG),
`bento-measure-text.mjs` (line breaks for the mock), `bento-raster-svg.mjs`, `bento-verify.mjs`,
`bento-inner.mjs`, `bento-compose.py`, `bento-shift.py`, `bento-interact.mjs`.
