# Final prompt — Skeleton Screen Loader

Build a SkeletonLoader in React + TypeScript (strict) + Tailwind CSS v4. No libraries or audio files.

- Loading shows a placeholder shaped exactly like the card: 4:3 art, title line, shorter subtitle, avatar circle + short line, each with a ~1.4s CSS shimmer. No jump on swap.
- After loadMs (2200) the card fades and rises in (400ms). "replay loading" restarts and stops the music. Optional controlled `loading` (no timer/replay); onLoaded fires on each swap.
- Card art: round amber play/pause button, label "side b · 5 sec preview", amber progress line over 5s.
- Play builds a 5s lofi clip with Web Audio: Dm9 → G13 → Cmaj9 → Am7 e-piano chords, strum, tape wobble, sine bass, swung 72 BPM drums, tape hiss, vinyl crackle, warm low-pass + limiter, fade in/out. Make the AudioContext on click; close on stop, end, unmount.
- Props with defaults: title "rainy window study mix", meta "1 hr 12 min · tape hiss included", station "lofistack radio", initials "lo", art label, clip on/off, labels, width 288, shimmer/fade ms.
- Card has aria-busy + aria-live; play aria-label "Play 5-second lofistack radio clip" / "Stop clip"; hover, active, focus-visible; disabled without Web Audio; reduced motion respected.
- Look: card #282219, border #37302a, text #ece4d6, muted #a2977f, amber #e0985f.
