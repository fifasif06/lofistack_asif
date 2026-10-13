// Sortable Table — React + TypeScript + Tailwind CSS.
// A generic, typed data table: click a column header to sort ascending, then descending, then back to
// the original order. Has loading (shimmer) and empty states, and scrolls sideways on narrow screens.
import { useEffect, useMemo, useRef, useState, type Key, type ReactNode } from "react";

export type SortDirection = "ascending" | "descending";

/** Which column is sorted, and which way. */
export interface SortState {
  /** The `key` of the sorted column. */
  key: string;
  /** "ascending" (A→Z, 0→9, oldest first) or "descending". */
  direction: SortDirection;
}

/** What a column sorts by: text, a number or a date. */
export type SortValue = string | number | Date;

export interface SortableColumn<Row> {
  /** Unique id for the column (used in SortState). */
  key: string;
  /** Header text. Also used in the "Sorted by …" screen-reader announcement. */
  header: string;
  /** The raw value sorting uses — e.g. seconds for a "3:12" length, a count for "12.4k". */
  value: (row: Row) => SortValue;
  /** What the cell shows. Default: value(row) as text (numbers and dates in the table's locale). */
  cell?: (row: Row) => ReactNode;
  /** Whether the header is a sort button. Default true */
  sortable?: boolean;
  /** Text alignment of the header and cells. Default "left" */
  align?: "left" | "right" | "center";
}

export interface SortableTableProps<Row> {
  /** Columns in display order. The first column is the row header and stays pinned when the table scrolls sideways. */
  columns: SortableColumn<Row>[];
  /** Rows in their original order — the order shown when no sort is active. */
  rows: Row[];
  /** Returns a stable, unique key for a row. */
  getRowKey: (row: Row) => Key;
  /** Table caption: names the table for everyone, including screen readers. Required. */
  caption: string;
  /** Hide the caption visually (screen readers still read it). Default false */
  hideCaption?: boolean;
  /** Sort applied on first render. Default: none (original order) */
  initialSort?: SortState;
  /** Called when the user changes the sort; null means back to the original order. Default: none */
  onSortChange?: (sort: SortState | null) => void;
  /** Shows shimmering skeleton rows, sets aria-busy and disables the sort buttons. Default false */
  loading?: boolean;
  /** How many skeleton rows to show while loading. Default 5 */
  skeletonRows?: number;
  /** Shown in one full-width row when `rows` is empty. Default "Nothing to show yet." */
  emptyMessage?: ReactNode;
  /** Accessible name of the sideways-scrolling region. Default: the caption */
  regionLabel?: string;
  /** Screen-reader announcement after a sort. Default (header, direction) => `Sorted by ${header}, ${direction}` */
  sortedMessage?: (header: string, direction: SortDirection) => string;
  /** Screen-reader announcement when the sort is cleared. Default "Sort cleared, original order" */
  unsortedMessage?: string;
  /** Screen-reader announcement when loading starts. Default "Loading…" */
  loadingMessage?: string;
  /** Locale used to compare text and format default cells. Default: the browser's locale */
  locale?: string;
  /** Keep the first column pinned while scrolling sideways. Default true */
  stickyFirstColumn?: boolean;
}

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;

// The sorted column's tint is a background *image*, so it layers over the opaque cell colour
// (and the row-hover colour) instead of replacing it.
const TINT = "bg-[image:linear-gradient(rgb(224_152_95/0.07),rgb(224_152_95/0.07))]";

const defaultSorted = (header: string, direction: SortDirection) => `Sorted by ${header}, ${direction}`;

/** Compares two sort values: numbers and dates numerically, everything else as text. */
export function compareValues(a: SortValue, b: SortValue, collator: Intl.Collator): number {
  const na = typeof a === "number" ? a : a instanceof Date ? a.getTime() : null;
  const nb = typeof b === "number" ? b : b instanceof Date ? b.getTime() : null;
  if (na !== null && nb !== null) return na - nb;
  return collator.compare(String(a), String(b));
}

/** Header click cycle: ascending → descending → original order. */
function nextSort(current: SortState | null, key: string): SortState | null {
  if (!current || current.key !== key) return { key, direction: "ascending" };
  if (current.direction === "ascending") return { key, direction: "descending" };
  return null;
}

export default function SortableTable<Row>({
  columns,
  rows,
  getRowKey,
  caption,
  hideCaption = false,
  initialSort,
  onSortChange,
  loading = false,
  skeletonRows = 5,
  emptyMessage = "Nothing to show yet.",
  regionLabel,
  sortedMessage = defaultSorted,
  unsortedMessage = "Sort cleared, original order",
  loadingMessage = "Loading…",
  locale,
  stickyFirstColumn = true,
}: SortableTableProps<Row>) {
  const [sort, setSort] = useState<SortState | null>(initialSort ?? null);
  const [announcement, setAnnouncement] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);
  const firstHeaderRef = useRef<HTMLTableCellElement>(null);

  // Keep the pinned first column from covering whatever gets keyboard focus: scroll padding the
  // width of that column makes the browser stop short of it when it scrolls a header into view.
  useEffect(() => {
    const region = regionRef.current;
    const first = firstHeaderRef.current;
    if (!region || !first || !stickyFirstColumn) return;
    const update = () => {
      region.style.scrollPaddingLeft = `${first.offsetWidth}px`;
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(first);
    return () => observer.disconnect();
  }, [stickyFirstColumn]);

  // Announce loading when it starts, and drop a stale "Sorted by…" so it isn't re-read afterwards.
  const [wasLoading, setWasLoading] = useState(loading);
  if (loading !== wasLoading) {
    setWasLoading(loading);
    setAnnouncement(loading ? loadingMessage : "");
  }

  const collator = useMemo(() => new Intl.Collator(locale, { numeric: true, sensitivity: "base" }), [locale]);

  const sortedRows = useMemo(() => {
    const column = sort && columns.find((c) => c.key === sort.key);
    if (!sort || !column) return rows;
    const dir = sort.direction === "ascending" ? 1 : -1;
    // Read each value once, and break ties by original position so equal rows never swap (stable sort).
    return rows
      .map((row, index) => ({ row, index, value: column.value(row) }))
      .sort((a, b) => compareValues(a.value, b.value, collator) * dir || a.index - b.index)
      .map((entry) => entry.row);
  }, [rows, columns, sort, collator]);

  const onHeaderClick = (column: SortableColumn<Row>) => {
    const next = nextSort(sort, column.key);
    setSort(next);
    setAnnouncement(next ? sortedMessage(column.header, next.direction) : unsortedMessage);
    onSortChange?.(next);
  };

  const empty = !loading && rows.length === 0;
  const inactive = loading || rows.length === 0;

  // Pinned cells need an opaque background so scrolled content slides underneath them.
  const pinned = (index: number, layer: string) =>
    stickyFirstColumn && index === 0
      ? `sticky left-0 ${layer} ${scrolled ? "shadow-[8px_0_10px_-8px_rgba(0,0,0,0.75)]" : ""}`
      : "";

  const formatDefault = (value: SortValue) =>
    value instanceof Date
      ? value.toLocaleDateString(locale)
      : typeof value === "number"
        ? value.toLocaleString(locale)
        : value;

  return (
    <div className="@container w-full font-sans text-[#ece4d6]">
      {loading && (
        <style>{"@keyframes ls-tbl-shimmer{from{background-position:100% 0}to{background-position:-100% 0}}"}</style>
      )}
      <div
        ref={regionRef}
        role="region"
        aria-label={regionLabel ?? caption}
        tabIndex={0}
        onScroll={(e) => setScrolled(e.currentTarget.scrollLeft > 0)}
        className="overflow-x-auto rounded-xl border border-[#37302a] bg-[#1f1b16] outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-[#e0985f]"
      >
        <table
          aria-busy={loading || undefined}
          className="w-full border-separate border-spacing-0 text-[13px] tabular-nums @md:text-sm"
        >
          <caption
            className={
              hideCaption
                ? "sr-only"
                : "border-b border-[#37302a] px-3 py-3 text-left text-[15px] font-semibold @md:px-4"
            }
          >
            {/* Sticky inside the caption so the title stays put while the table scrolls sideways. */}
            <span className={hideCaption ? "" : "sticky left-3 @md:left-4"}>{caption}</span>
          </caption>

          <thead>
            <tr>
              {columns.map((column, ci) => {
                const sortable = column.sortable ?? true;
                const active = sort?.key === column.key;
                const align = column.align ?? "left";
                return (
                  <th
                    key={column.key}
                    ref={ci === 0 ? firstHeaderRef : undefined}
                    scope="col"
                    aria-sort={active ? sort.direction : undefined}
                    className={`border-b border-[#37302a] bg-[#1f1b16] px-3 py-2 font-mono text-[11px] font-normal tracking-[0.08em] whitespace-nowrap uppercase @md:px-4 ${ALIGN[align]} ${
                      active ? `text-[#e0985f] ${TINT}` : "text-[#a2977f]"
                    } ${pinned(ci, "z-[2]")}`}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        disabled={inactive}
                        onClick={() => onHeaderClick(column)}
                        className={`group/sort -mx-2 inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 tracking-[inherit] uppercase transition-colors duration-150 outline-none select-none hover:bg-[#282219] focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-[#e0985f] active:bg-[#37302a] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent ${
                          active ? "hover:text-[#f3b983]" : "hover:text-[#ece4d6]"
                        } ${align === "right" ? "flex-row-reverse" : ""}`}
                      >
                        {column.header}
                        <SortIcon direction={active ? sort.direction : null} />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading
              ? Array.from({ length: skeletonRows }, (_, ri) => (
                  <tr key={ri} aria-hidden="true">
                    {columns.map((column, ci) => (
                      <td
                        key={column.key}
                        className={`border-b border-[#37302a] bg-[#1f1b16] px-3 py-3.5 @md:px-4 ${pinned(ci, "z-[1]")}`}
                      >
                        <span
                          className={`block h-2.5 min-w-8 rounded-full bg-[linear-gradient(90deg,#282219_25%,#37302a_50%,#282219_75%)] bg-[length:200%_100%] motion-safe:[animation:ls-tbl-shimmer_1.4s_ease-in-out_infinite] ${
                            column.align === "right" ? "ml-auto" : column.align === "center" ? "mx-auto" : ""
                          }`}
                          // Vary the bar widths a little so the skeleton reads like real text.
                          style={{ width: `${48 + ((ri * 17 + ci * 29) % 40)}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : empty
                ? (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-12 text-center text-[#a2977f]">
                        <span className="inline-flex flex-col items-center gap-2">
                          <svg viewBox="0 0 24 24" className="size-6 text-[#4a4037]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M9 18V5l11-2v13" />
                            <circle cx="6" cy="18" r="3" />
                            <circle cx="17" cy="16" r="3" />
                          </svg>
                          {emptyMessage}
                        </span>
                      </td>
                    </tr>
                  )
                : sortedRows.map((row) => (
                    <tr key={getRowKey(row)} className="group">
                      {columns.map((column, ci) => {
                        const Cell = ci === 0 ? "th" : "td";
                        const active = sort?.key === column.key;
                        return (
                          <Cell
                            key={column.key}
                            scope={ci === 0 ? "row" : undefined}
                            className={`border-b border-[#37302a] bg-[#1f1b16] px-3 py-3 whitespace-nowrap transition-colors duration-150 group-last:border-b-0 group-hover:bg-[#282219] @md:px-4 ${
                              ALIGN[column.align ?? "left"]
                            } ${ci === 0 ? "font-medium" : "font-normal"} ${active ? TINT : ""} ${pinned(ci, "z-[1]")}`}
                          >
                            {column.cell ? column.cell(row) : formatDefault(column.value(row))}
                          </Cell>
                        );
                      })}
                    </tr>
                  ))}
          </tbody>
        </table>
      </div>
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

/** Faint up/down chevrons when unsorted; a single arrow that flips when sorted. */
function SortIcon({ direction }: { direction: SortDirection | null }) {
  return (
    <span aria-hidden="true" className="relative inline-block size-3.5 shrink-0">
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`absolute inset-0 size-full transition-opacity duration-200 motion-reduce:transition-none ${
          direction ? "opacity-0" : "opacity-45 group-hover/sort:opacity-90 group-focus-visible/sort:opacity-90"
        }`}
      >
        <path d="M5 6.5 8 3.5l3 3M5 9.5l3 3 3-3" />
      </svg>
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`absolute inset-0 size-full transition-[opacity,rotate,scale] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none ${
          direction ? "scale-100 opacity-100" : "scale-50 opacity-0"
        } ${direction === "descending" ? "rotate-180" : "rotate-0"}`}
      >
        <path d="M8 13V3.5M4 7.5l4-4 4 4" />
      </svg>
    </span>
  );
}
