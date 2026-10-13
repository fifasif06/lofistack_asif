# Agent Log #3 — Design to code

**Week:** 3 (Oct 6–12, 2026 — done late, on Oct 13–14) · **Kind:** Design to code · **Agent:** Claude (Cowork)
**Task:** Turn a design into a working component, then prove the code matches the design — by measuring, not by eye.
**Component:** [Bento Feature Grid](https://lofistack-asif-gallery.vercel.app/components/bento-feature-grid) · **Design files:** [week-03-design/](week-03-design/)

## The task

Most "design to code" demos stop at "looks about right". I wanted a number: how far is the built section from the design, in pixels, tile by tile? So the design had to exist first, at exact size, and the code had to be checked against it afterwards.

I had no designer for this one, so the agent drew the design too. To keep that honest, the order was strict: **design first and frozen, then code from the design only, then fix the code — never the design — until they match.**

## Workflow

1. **Design first.** The agent wrote down the design tokens (grid gap 12px, rows 168px, 4 / 2 / 1 columns at 768 / 512 px of container width, 16px corners, 20px padding, type sizes, the lofi palette) and drew the section as an SVG at 1:1 pixel size: a desktop frame 800px wide (the demo box on a laptop) and a phone frame 310px wide (the demo box on a 375px phone). Six tiles: a 2×2 "now playing" hero, a tall focus timer, two small tiles, and two wide tiles with station pills and key caps. → [bento-design.svg](week-03-design/bento-design.svg)
2. **Code from the design.** The component and its demo were written with the SVG as the only reference. Every token became a Tailwind class (12 → `gap-3`, 20 → `p-5`, 16 → `rounded-2xl`), and the column count follows the *space the section gets* (container queries), not the window size.
3. **Check by measuring.** A script opened the real page, read every tile's box from the browser, and compared it with the tile boxes in the design file. It also made side-by-side, 50% overlay and difference images. → [compare](week-03-design/bento-compare-desktop.png) · [overlay](week-03-design/bento-overlay-desktop.png) · [difference](week-03-design/bento-diff-desktop.png)
4. **Check what a picture can't show.** Hover lift, the amber spotlight that follows the cursor, keyboard focus, the fade-up on scroll, and "reduce motion".

## Rounds

| Round | What was checked | Result |
|---|---|---|
| 1 | All 12 tile boxes (6 desktop + 6 phone) at exactly 800 / 310px | **12 of 12 match to 0px.** Section 800×682 and 310×1444, same as the design. Boxes inside the tiles (titles, badges, timer ring, every pill and key cap) match to 0.01px. |
| 1 | Pixel difference | 1.44% of pixels differ on desktop, 2.11% on phone — **only text outlines.** Traced to how SVG places text (up to 1px lower than HTML at small sizes), not the layout. Design left as it is. |
| 2 | Real page widths (the live demo box is 798px on a laptop, 309px on a phone — not 800 / 310) | Worst difference 1.5px. Inside the ±2px target. No change. |
| 3 | States | **Bug: link tiles had no keyboard focus ring.** Fixed (details below). Hover lift measured at exactly 4.00px, spotlight follows the pointer, everything visible at once with "reduce motion". |

## What the agent caught

- **The focus ring that never drew.** Keyboard Tab reached the three link tiles, but nothing showed. In Tailwind v4, `outline-none` quietly switches the outline style off, and the focus style borrows that setting. A still design can't show this at all. The same bug was in the site's own links and the magnetic button — found here, fixed everywhere.
- **"Wrong by 1px" that wasn't the code.** The difference image showed text shifted 1–2px. Instead of nudging the code, the agent tested one line of text drawn both ways and showed the SVG draws it lower. Fixing the code would have made it *wrong*.
- **The live demo box isn't 800px.** It is 798px on a 1280px screen and 309px on a phone. Checking only at the design width would have hidden that.

## Result

A live section whose 12 tile boxes match the design to 0px at the design widths and within 1.5px on the real page, plus a design file, overlay and difference images anyone can open. Same section works from 309px to 800px because the grid follows its own width.

## What I learned

- **Pick design values the code can say exactly.** Every token was a value Tailwind has a class for, and rows were a fixed height, so tile boxes couldn't drift with the text. That's why round 1 matched — the work was in the design choices, not in fixing code.
- **Being honest about this:** the agent drew the design itself from those tokens, so a 0px match is partly built in. The useful checks were the ones the design *couldn't* answer — real widths, text placement, and states like focus.
- **Measure, then decide who's wrong.** A difference image tells you *where*, not *which side* is wrong. Testing the text on its own stopped a fix that would have made things worse.
