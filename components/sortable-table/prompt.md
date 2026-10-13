# Final prompt — Sortable Data Table

Build a generic typed SortableTable<Row>: React, strict TypeScript, Tailwind CSS, no libraries.

Props: columns (key, header, value(row) to sort by as string/number/Date, cell(row)? to show, sortable = true, align), rows, getRowKey, caption (required; hideCaption hides it visually), initialSort, onSortChange, loading = false, skeletonRows = 5, emptyMessage, stickyFirstColumn = true, locale, announcement text.

- Header buttons cycle ascending → descending → original; aria-sort on that th; polite live region says "Sorted by Plays, descending".
- Stable sort: Intl.Collator (numeric, case-insensitive) for text; numbers and dates numerically.
- Faint ↕ when unsorted; arrow springs in, flips for descending.
- Sorted column tinted amber; row hover tint; first cell is a row header.
- Loading: shimmer skeleton rows, aria-busy, buttons disabled. Empty: one friendly row.
- Narrow: scrolls sideways in a focusable labelled region; first column and caption pinned; tabular-nums.
- Amber focus rings; reduced motion stops all animation.

Look: dark lofi, #1f1b16 surface, #37302a lines, #ece4d6 text, #a2977f mono caps headers, #e0985f amber.

Demo: 10 lofistack radio tracks (title, artist, BPM, m:ss length sorted by seconds, 12.4k plays sorted by number, date added), Data/Loading/Empty switch.
