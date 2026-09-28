# Final prompt — Skeleton Screen Loader

Build a skeleton screen loader as one self-contained block of plain HTML, CSS and JavaScript (no frameworks, no libraries, no audio files) that I can paste into a GoHighLevel custom code element.

Loading behavior:
- Show a placeholder card with the exact same shape as the real card: an image block (4:3), a title line, a shorter subtitle line, and a row with a small circle and a short line.
- Every placeholder block has a soft shimmer — a faint light band sweeping left to right on a ~1.4s loop, done in CSS only.
- Pretend to load for about 2.2 seconds, then swap to the real card with a short fade-and-rise (~400ms).
- Add a small "replay loading" button under the card that restarts the whole thing (and stops any music playing).
- Put both states in the HTML and toggle them with the `hidden` attribute (include a CSS rule so `hidden` always wins over the page builder's styles).

Play button and 5-second radio clip:
- On the real card's artwork, add a round amber play button (inline SVG play icon, switching to a pause icon while playing) next to the label "side b · 5 sec preview".
- Clicking it plays a 5-second original lofi clip generated live with the Web Audio API — nothing to download or host. The clip: jazzy chords Dm9 → G13 → Cmaj9 → Am7 (1.25s each) on a soft electric-piano tone (sine + a little triangle + a quiet octave), a tiny strum between notes, a slow "tape wobble" that bends the pitch a few cents, a round sine bass on each chord's root, a lazy swung drum beat at 72 BPM (soft kick, noise snare, quiet hi-hats with late off-beats), steady quiet tape hiss and random soft vinyl pops.
- Run everything through a warm low-pass filter and a limiter so it never clips; fade in quickly and fade out over the last second.
- A thin amber progress line fills along the bottom of the artwork over the 5 seconds. Clicking again stops it early. When it ends, the button resets.
- Only create the audio when the button is clicked (browsers block sound before a click). Give the button an `aria-label` that changes between "Play 5-second lofistack radio clip" and "Stop clip".

Accessibility: the card sets `aria-busy` while loading and `aria-live="polite"` so screen readers hear the change. Turn animations off if the visitor has "reduce motion" on.

Safety with the page builder: prefix every class with `ls-`, wrap the script in a function, and guard against wiring it twice.

Style: warm dark lofi palette — deep brown card (#282219), cream text (#ece4d6), muted tan secondary text (#a2977f), amber accent (#e0985f). The real card is a pretend "lofi radio" playlist: "rainy window study mix", "1 hr 12 min · tape hiss included", station "lofistack radio".
