# Final prompt — Bento Feature Grid

Build a bento feature section as a React + TypeScript component styled only with Tailwind CSS v4 (no libraries).

Props (typed, JSDoc with defaults): eyebrow?, heading, subheading?, items ({ id, title, description, size? "sm" 1×1 | "wide" 2×1 | "tall" 1×2 | "lg" 2×2, default sm; icon?, visual?, href?, badge? }), rowHeight 168, reveal true, stagger 70 ms, className.

Layout: @container section; amber mono 11px caps eyebrow, h2 28/34 (24/30 when narrow), muted 15/24 subheading max 480px. A list grid with 12px gaps, fixed rows, dense flow and container-query columns: 1 below 512px, 2 from 512px, 4 from 768px. Spans start at 2 columns; lg stays 2 rows tall on 1 column.

Tile: 16px radius, 1px #37302a border on #282219, 20px padding; icon in a 32px amber-tint chip, decorative visual (aria-hidden) filling the free space, h3 15px, 13px muted description clamped to 3 lines, badge pill top-right. Hover: lift 4px, border #e0985f at 45%, soft amber spotlight following the pointer via CSS variables set on pointermove. Tiles with href are links named by their title (+ badge) with an arrow, a 2px amber focus-visible outline and a pressed state.

Reveal: an IntersectionObserver fades tiles up 12px, staggered, once (cleaned up; focus also reveals). Reduced motion: no reveal, lift or spotlight.
