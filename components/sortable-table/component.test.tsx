// Spec-first tests for SortableTable: written from prompt.md and the SortableTableProps JSDoc.
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SortableTable, { compareValues, type SortableColumn, type SortableTableProps, type SortState } from "./component";

interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  plays: number;
  added: Date;
}

// Chosen so each kind of comparison gives a different order than the naive one:
// "no. 9" < "no. 12" only with numeric collation, "apple" < "Banana" only case-insensitively,
// 100 < 900 < 3150 only numerically, and two rows tie on BPM (72) and on artist ("Sleepy Ferns").
const TRACKS: Track[] = [
  { id: "a", title: "tape loop no. 12", artist: "Sleepy Ferns", bpm: 68, plays: 3150, added: new Date(2026, 9, 1) },
  { id: "b", title: "Night Bus Home", artist: "Kōhī Club", bpm: 84, plays: 48900, added: new Date(2026, 6, 2) },
  { id: "c", title: "tape loop no. 9", artist: "Sleepy Ferns", bpm: 70, plays: 900, added: new Date(2026, 8, 3) },
  { id: "d", title: "apple jam", artist: "mellow fox", bpm: 72, plays: 12400, added: new Date(2025, 11, 30) },
  { id: "e", title: "Banana Beat", artist: "Paper Moon", bpm: 72, plays: 100, added: new Date(2026, 0, 15) },
];
const ORIGINAL = TRACKS.map((t) => t.title);

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

const COLUMNS: SortableColumn<Track>[] = [
  { key: "title", header: "Title", value: (t) => t.title },
  { key: "artist", header: "Artist", value: (t) => t.artist },
  { key: "bpm", header: "BPM", value: (t) => t.bpm, align: "right" },
  { key: "plays", header: "Plays", value: (t) => t.plays, cell: (t) => compact.format(t.plays).toLowerCase(), align: "right" },
  { key: "added", header: "Added", value: (t) => t.added, cell: (t) => t.added.toISOString().slice(0, 10), align: "right" },
];

function renderTable(props: Partial<SortableTableProps<Track>> = {}) {
  const user = userEvent.setup();
  const utils = render(
    <SortableTable<Track> columns={COLUMNS} rows={TRACKS} getRowKey={(t) => t.id} caption="Top tracks" {...props} />,
  );
  return { user, ...utils };
}

/** Titles in display order, read from the row headers (the first cell of each body row). */
const order = () => screen.getAllByRole("rowheader").map((c) => c.textContent);
const sortButton = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name}`) });
const headerCell = (name: string) => sortButton(name).closest("th") as HTMLElement;
const liveRegion = (root: HTMLElement) => root.querySelector<HTMLElement>('[aria-live="polite"], [role="status"]');
const bodyRows = () => document.querySelectorAll("tbody tr");

describe("SortableTable — structure and accessibility", () => {
  it("is a table named by its required caption", () => {
    renderTable();
    expect(screen.getByRole("table", { name: "Top tracks" })).toBeInTheDocument();
    expect(screen.getByText("Top tracks").closest("caption")).not.toBeNull();
  });

  it("hideCaption hides the caption visually but keeps it as the table's name", () => {
    renderTable({ hideCaption: true });
    expect(screen.getByRole("table", { name: "Top tracks" })).toBeInTheDocument();
    expect(screen.getByText("Top tracks").closest("caption")).toHaveClass("sr-only");
  });

  it("makes the first cell of every row a row header", () => {
    renderTable();
    expect(order()).toEqual(ORIGINAL);
    for (const cell of screen.getAllByRole("rowheader")) expect(cell.tagName).toBe("TH");
  });

  it("wraps the table in a focusable region named by the caption (or regionLabel)", () => {
    const { unmount } = renderTable();
    expect(screen.getByRole("region", { name: "Top tracks" })).toHaveAttribute("tabindex", "0");
    unmount();
    renderTable({ regionLabel: "Tracks, scroll sideways" });
    expect(screen.getByRole("region", { name: "Tracks, scroll sideways" })).toBeInTheDocument();
  });

  it("renders sortable headers as buttons and sortable: false headers as plain text", () => {
    const columns: SortableColumn<Track>[] = [COLUMNS[0], { ...COLUMNS[1], sortable: false }];
    renderTable({ columns });
    expect(sortButton("Title")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Artist/ })).toBeNull();
    expect(screen.getByRole("columnheader", { name: "Artist" })).not.toHaveAttribute("aria-sort", "ascending");
  });

  it("shows cell(row) for display while sorting by value(row)", () => {
    renderTable();
    expect(screen.getByText("12.4k")).toBeInTheDocument();
  });

  it("formats default cells (no `cell`) in the given locale", () => {
    const columns: SortableColumn<Track>[] = [COLUMNS[0], { key: "plays", header: "Plays", value: (t) => t.plays }];
    const { unmount } = renderTable({ columns, locale: "en-US" });
    expect(screen.getByText("48,900")).toBeInTheDocument();
    unmount();
    renderTable({ columns, locale: "de-DE" });
    expect(screen.getByText("48.900")).toBeInTheDocument();
  });

  it("formats default Date cells as a date, not Date.toString()", () => {
    const columns: SortableColumn<Track>[] = [COLUMNS[0], { key: "added", header: "Added", value: (t) => t.added }];
    renderTable({ columns, locale: "en-US" });
    const firstRow = bodyRows()[0] as HTMLElement;
    const dateCell = within(firstRow).getAllByRole("cell")[0];
    expect(dateCell.textContent).toMatch(/2026/);
    expect(dateCell.textContent).not.toMatch(/GMT|Coordinated|Standard Time/);
  });
});

describe("SortableTable — sort cycle", () => {
  it("cycles ascending → descending → original order, with aria-sort on that th", async () => {
    const { user } = renderTable();
    expect(headerCell("Plays")).not.toHaveAttribute("aria-sort", "ascending");

    await user.click(sortButton("Plays"));
    expect(order()).toEqual(["Banana Beat", "tape loop no. 9", "tape loop no. 12", "apple jam", "Night Bus Home"]);
    expect(headerCell("Plays")).toHaveAttribute("aria-sort", "ascending");

    await user.click(sortButton("Plays"));
    expect(order()).toEqual(["Night Bus Home", "apple jam", "tape loop no. 12", "tape loop no. 9", "Banana Beat"]);
    expect(headerCell("Plays")).toHaveAttribute("aria-sort", "descending");

    await user.click(sortButton("Plays"));
    expect(order()).toEqual(ORIGINAL);
    const after = headerCell("Plays").getAttribute("aria-sort");
    expect(after === null || after === "none").toBe(true);
  });

  it("puts aria-sort only on the sorted column", async () => {
    const { user } = renderTable();
    await user.click(sortButton("BPM"));
    for (const th of screen.getAllByRole("columnheader")) {
      const value = th.getAttribute("aria-sort");
      if (th === headerCell("BPM")) expect(value).toBe("ascending");
      else expect(value === null || value === "none").toBe(true);
    }
  });

  it("starts a newly clicked column at ascending", async () => {
    const { user } = renderTable();
    await user.click(sortButton("Plays"));
    await user.click(sortButton("Plays")); // Plays descending
    await user.click(sortButton("Title"));
    expect(headerCell("Title")).toHaveAttribute("aria-sort", "ascending");
    expect(order()[0]).toBe("apple jam");
  });

  it("calls onSortChange with the new state, and null when back to original", async () => {
    const onSortChange = vi.fn<(sort: SortState | null) => void>();
    const { user } = renderTable({ onSortChange });
    await user.click(sortButton("Plays"));
    await user.click(sortButton("Plays"));
    await user.click(sortButton("Plays"));
    expect(onSortChange.mock.calls).toEqual([
      [{ key: "plays", direction: "ascending" }],
      [{ key: "plays", direction: "descending" }],
      [null],
    ]);
  });

  it("announces the sort in a polite live region", async () => {
    const { user, container } = renderTable();
    const live = liveRegion(container);
    expect(live).not.toBeNull();
    await user.click(sortButton("Plays"));
    expect(live).toHaveTextContent("Sorted by Plays, ascending");
    await user.click(sortButton("Plays"));
    expect(live).toHaveTextContent("Sorted by Plays, descending");
    await user.click(sortButton("Plays"));
    expect(live).toHaveTextContent("Sort cleared, original order");
  });

  it("uses custom announcement text", async () => {
    const { user, container } = renderTable({
      sortedMessage: (h, d) => `${h} ${d === "ascending" ? "up" : "down"}`,
      unsortedMessage: "back to normal",
    });
    await user.click(sortButton("BPM"));
    expect(liveRegion(container)).toHaveTextContent("BPM up");
    await user.click(sortButton("BPM"));
    await user.click(sortButton("BPM"));
    expect(liveRegion(container)).toHaveTextContent("back to normal");
  });

  it("applies initialSort on first render without calling onSortChange", () => {
    const onSortChange = vi.fn();
    renderTable({ initialSort: { key: "added", direction: "descending" }, onSortChange });
    expect(order()).toEqual(["tape loop no. 12", "tape loop no. 9", "Night Bus Home", "Banana Beat", "apple jam"]);
    expect(headerCell("Added")).toHaveAttribute("aria-sort", "descending");
    expect(onSortChange).not.toHaveBeenCalled();
  });

  it("is keyboard operable: Enter and Space on a header button sort", async () => {
    const { user } = renderTable();
    sortButton("Title").focus();
    await user.keyboard("{Enter}");
    expect(headerCell("Title")).toHaveAttribute("aria-sort", "ascending");
    await user.keyboard(" ");
    expect(headerCell("Title")).toHaveAttribute("aria-sort", "descending");
  });

  it("keeps the sort when rows change", async () => {
    const { user, rerender } = renderTable();
    await user.click(sortButton("Plays"));
    const more = [...TRACKS, { id: "f", title: "zero plays", artist: "x", bpm: 1, plays: 0, added: new Date(2020, 0, 1) }];
    rerender(<SortableTable<Track> columns={COLUMNS} rows={more} getRowKey={(t) => t.id} caption="Top tracks" />);
    expect(order()[0]).toBe("zero plays");
  });
});

describe("SortableTable — comparison rules", () => {
  it("sorts text with a numeric, case-insensitive collator", async () => {
    const { user } = renderTable();
    await user.click(sortButton("Title"));
    expect(order()).toEqual(["apple jam", "Banana Beat", "Night Bus Home", "tape loop no. 9", "tape loop no. 12"]);
  });

  it("sorts dates chronologically", async () => {
    const { user } = renderTable();
    await user.click(sortButton("Added"));
    expect(order()).toEqual(["apple jam", "Banana Beat", "Night Bus Home", "tape loop no. 9", "tape loop no. 12"]);
  });

  it("is a stable sort in both directions (ties keep their original order)", async () => {
    const { user } = renderTable();
    await user.click(sortButton("BPM"));
    // 72 ties: "apple jam" (row d) comes before "Banana Beat" (row e) in the original rows.
    expect(order()).toEqual(["tape loop no. 12", "tape loop no. 9", "apple jam", "Banana Beat", "Night Bus Home"]);
    await user.click(sortButton("BPM"));
    expect(order()).toEqual(["Night Bus Home", "apple jam", "Banana Beat", "tape loop no. 9", "tape loop no. 12"]);
  });

  it("uses the locale for text comparison", async () => {
    interface Word { w: string }
    const words: Word[] = [{ w: "zebra" }, { w: "äpple" }];
    const cols: SortableColumn<Word>[] = [{ key: "w", header: "Word", value: (r) => r.w }];
    const user = userEvent.setup();
    const { unmount } = render(<SortableTable<Word> columns={cols} rows={words} getRowKey={(r) => r.w} caption="Words" locale="en" />);
    await user.click(sortButton("Word"));
    expect(order()).toEqual(["äpple", "zebra"]);
    unmount();
    render(<SortableTable<Word> columns={cols} rows={words} getRowKey={(r) => r.w} caption="Words" locale="sv" />);
    await user.click(sortButton("Word"));
    expect(order()).toEqual(["zebra", "äpple"]); // in Swedish, ä comes after z
  });

  it("compareValues: numbers and dates numerically, text with the collator", () => {
    const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
    expect(compareValues(9, 100, collator)).toBeLessThan(0);
    expect(compareValues(new Date(2026, 0, 2), new Date(2026, 0, 1), collator)).toBeGreaterThan(0);
    expect(compareValues("item 9", "item 10", collator)).toBeLessThan(0);
    expect(compareValues("Apple", "apple", collator)).toBe(0);
  });
});

describe("SortableTable — loading and empty states", () => {
  it("loading: aria-busy, skeletonRows rows (default 5), disabled sort buttons", () => {
    renderTable({ loading: true });
    const table = screen.getByRole("table", { name: "Top tracks" });
    expect(table.closest('[aria-busy="true"]')).not.toBeNull();
    expect(bodyRows()).toHaveLength(5);
    expect(screen.queryByText("apple jam")).toBeNull();
    for (const b of screen.getAllByRole("button")) expect(b).toBeDisabled();
  });

  it("announces loadingMessage when loading starts (Data → Loading)", () => {
    const { container, rerender } = renderTable();
    expect(liveRegion(container)).toHaveTextContent("");
    rerender(<SortableTable<Track> columns={COLUMNS} rows={TRACKS} getRowKey={(t) => t.id} caption="Top tracks" loading />);
    expect(liveRegion(container)).toHaveTextContent("Loading…");
  });

  it("loading respects skeletonRows and clears aria-busy when done", () => {
    const { rerender } = renderTable({ loading: true, skeletonRows: 3 });
    expect(bodyRows()).toHaveLength(3);
    rerender(<SortableTable<Track> columns={COLUMNS} rows={TRACKS} getRowKey={(t) => t.id} caption="Top tracks" />);
    expect(document.querySelector('[aria-busy="true"]')).toBeNull();
    expect(bodyRows()).toHaveLength(TRACKS.length);
    for (const b of screen.getAllByRole("button")) expect(b).toBeEnabled();
  });

  it("empty: one full-width row with the default message", () => {
    renderTable({ rows: [] });
    expect(bodyRows()).toHaveLength(1);
    const cell = screen.getByText("Nothing to show yet.").closest("td, th") as HTMLTableCellElement;
    expect(cell.colSpan).toBe(COLUMNS.length);
  });

  it("empty: shows a custom emptyMessage", () => {
    renderTable({ rows: [], emptyMessage: "No tracks in this playlist." });
    expect(screen.getByText("No tracks in this playlist.")).toBeInTheDocument();
  });
});
