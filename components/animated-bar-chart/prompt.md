# Final prompt — Animated Bar Chart

Build an animated column chart: React, strict TypeScript, Tailwind CSS, no chart libraries.

Props: data (label, value, shortLabel? for narrow widths), title, description, max (default: nice round max), tickCount = 4, formatValue, height = 220, unit, highlightMax = false, animate = true, duration = 700ms, stagger = 70ms, barWidth = 24 max, emptyMessage, screen-reader labels.

- First time a third is on screen (IntersectionObserver, cleaned up), bars grow from zero with a stagger; data changes glide to new heights (CSS height transitions).
- Hairline gridlines, round tick labels, unit above the axis, value on each bar; if labels would collide only the largest keeps one.
- highlightMax: largest bar amber, the rest taupe #786c5b.
- Hover or focus: tooltip with exact value and unit, other bars dim; Escape hides it.
- One Tab stop: arrows, Home, End move between bars, each named like "Wed: 64 minutes".
- figure + figcaption and a visually hidden data table.
- Container queries: 7 bars fit at 310px, wider gaps on desktop.
- Reduced motion: no animation. Empty data: friendly empty panel.

Look: dark lofi, amber #e0985f bars with 4px rounded tops, #37302a gridlines, #a2977f mono labels.

Demo: "Minutes listened per day" on lofistack radio with a This week / Last week switch.
