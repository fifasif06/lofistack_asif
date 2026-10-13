// Spec-first tests for AnimatedBarChart: written from prompt.md and the AnimatedBarChartProps JSDoc.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AnimatedBarChart, { niceScale, niceStep, type AnimatedBarChartProps, type BarDatum } from "./component";

const WEEK: BarDatum[] = [
  { label: "Mon", value: 42 },
  { label: "Tue", value: 58 },
  { label: "Wed", value: 64 },
  { label: "Thu", value: 37 },
  { label: "Fri", value: 91 },
  { label: "Sat", value: 118, shortLabel: "Sa" },
  { label: "Sun", value: 76 },
];

// A controllable IntersectionObserver: records options, observed elements and disconnects,
// and lets a test say "the chart is now on screen".
class FakeIO {
  static all: FakeIO[] = [];
  observed: Element[] = [];
  disconnected = false;
  unobserved: Element[] = [];
  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit,
  ) {
    FakeIO.all.push(this);
  }
  observe(el: Element) { this.observed.push(el); }
  unobserve(el: Element) { this.unobserved.push(el); }
  disconnect() { this.disconnected = true; }
  takeRecords(): IntersectionObserverEntry[] { return []; }
  trigger(isIntersecting: boolean, ratio = isIntersecting ? 1 : 0) {
    const entries = this.observed.map(
      (target) => ({ target, isIntersecting, intersectionRatio: ratio, time: 0 }) as unknown as IntersectionObserverEntry,
    );
    this.callback(entries, this as unknown as IntersectionObserver);
  }
}

let realIO: typeof window.IntersectionObserver;
let realMatchMedia: typeof window.matchMedia;
beforeEach(() => {
  FakeIO.all = [];
  realIO = window.IntersectionObserver;
  realMatchMedia = window.matchMedia;
  window.IntersectionObserver = FakeIO as unknown as typeof window.IntersectionObserver;
});
afterEach(() => {
  window.IntersectionObserver = realIO;
  window.matchMedia = realMatchMedia;
});

function setReducedMotion(reduce: boolean) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

function renderChart(props: Partial<AnimatedBarChartProps> = {}) {
  return render(
    <>
      <button type="button">before</button>
      <AnimatedBarChart title="Minutes listened per day" data={WEEK} unit="minutes" {...props} />
      <button type="button">after</button>
    </>,
  );
}

/** The bars: the focusable elements inside the figure's plot (roving tabindex), not the hidden table. */
const bars = () => {
  const figure = screen.getByRole("figure");
  return Array.from(figure.querySelectorAll<HTMLElement>("[tabindex]")).filter((el) => !el.closest("table"));
};
const bar = (name: string) => {
  const found = bars().find((b) => b.getAttribute("aria-label") === name || b.textContent === name);
  if (found) return found;
  const byName = bars().filter((b) => {
    try {
      expect(b).toHaveAccessibleName(name);
      return true;
    } catch {
      return false;
    }
  });
  if (byName.length !== 1) throw new Error(`No single bar named "${name}"`);
  return byName[0];
};
/** The visual tooltip inside a bar. It is aria-hidden by design (the bar's own name already says the
 *  value), so it's found by its text: value + unit + label, unlike the bar's value label (value only). */
const tooltipIn = (b: HTMLElement, label: string) =>
  Array.from(b.querySelectorAll<HTMLElement>("*")).find((el) => el.textContent?.includes(label)) ?? null;
const anyTooltip = () => WEEK.some((d) => bars().some((b) => tooltipIn(b, d.label) !== null));

/** Smallest inline height inside a bar's subtree (the painted bar, not its full-height hit area). */
const heightOf = (el: HTMLElement) => {
  const hs = [el, ...Array.from(el.querySelectorAll<HTMLElement>("*"))]
    .map((n) => n.style.height)
    .filter((h) => h !== "")
    .map((h) => parseFloat(h));
  return hs.length ? Math.min(...hs) : null;
};

describe("AnimatedBarChart — semantics", () => {
  it("is a figure named by its title, with a figcaption and description", () => {
    renderChart({ description: "lofistack radio · this week" });
    const figure = screen.getByRole("figure", { name: /Minutes listened per day/ });
    expect(figure.tagName).toBe("FIGURE");
    expect(figure.querySelector("figcaption")).toHaveTextContent("Minutes listened per day");
    expect(screen.getByText("lofistack radio · this week")).toBeInTheDocument();
  });

  it("names each bar like “Wed: 64 minutes”", () => {
    renderChart();
    expect(bars()).toHaveLength(WEEK.length);
    expect(bar("Wed: 64 minutes")).toHaveAccessibleName("Wed: 64 minutes");
    expect(bar("Sat: 118 minutes")).toBeInTheDocument(); // full label in the name, not the shortLabel
  });

  it("has a visually hidden data table with category and value columns", () => {
    renderChart({ categoryLabel: "Day" });
    const table = screen.getByRole("table");
    expect(table.closest(".sr-only")).not.toBeNull();
    expect(within(table).getByRole("columnheader", { name: "Day" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "minutes" })).toBeInTheDocument(); // valueLabel defaults to unit
    expect(within(table).getAllByRole("row")).toHaveLength(WEEK.length + 1);
    expect(within(table).getByText("Wed")).toBeInTheDocument();
    expect(within(table).getByText("64")).toBeInTheDocument();
  });

  it("table defaults: “Category” and “Value” when no unit; valueLabel overrides", () => {
    const { unmount } = render(<AnimatedBarChart title="Plays" data={WEEK} />);
    expect(screen.getByRole("columnheader", { name: "Category" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Value" })).toBeInTheDocument();
    unmount();
    render(<AnimatedBarChart title="Plays" data={WEEK} valueLabel="Plays" />);
    expect(screen.getByRole("columnheader", { name: "Plays" })).toBeInTheDocument();
  });

  it("formatValue formats the hidden table values (default: thousands separators)", () => {
    const big: BarDatum[] = [{ label: "Jan", value: 12400 }];
    const { unmount } = render(<AnimatedBarChart title="Plays" data={big} />);
    expect(within(screen.getByRole("table")).getByText((12400).toLocaleString())).toBeInTheDocument();
    unmount();
    render(<AnimatedBarChart title="Plays" data={big} formatValue={(n) => `${n / 1000}k`} />);
    expect(within(screen.getByRole("table")).getByText("12.4k")).toBeInTheDocument();
  });

  it("includes the keyboard hint for screen readers", () => {
    renderChart();
    expect(screen.getByText("Use the left and right arrow keys to move between bars.")).toBeInTheDocument();
  });

  it("updates names and table when data changes", () => {
    const { rerender } = renderChart();
    const next = WEEK.map((d) => (d.label === "Wed" ? { ...d, value: 29 } : d));
    rerender(<AnimatedBarChart title="Minutes listened per day" data={next} unit="minutes" />);
    expect(bar("Wed: 29 minutes")).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("29")).toBeInTheDocument();
  });
});

describe("AnimatedBarChart — scale", () => {
  it("default max: a nice round top at or just above the largest value, round ticks", () => {
    renderChart(); // largest 118, 4 steps → 0 · 50 · 100 · 150
    for (const t of ["0", "50", "100", "150"]) expect(screen.getAllByText(t).length).toBeGreaterThan(0);
    expect(screen.queryByText("200")).toBeNull();
  });

  it("max fixes the top of the scale", () => {
    renderChart({ max: 200 });
    expect(screen.getAllByText("200").length).toBeGreaterThan(0);
    expect(screen.queryByText("250")).toBeNull();
  });

  it("niceStep rounds up to 1, 2, 2.5 or 5 × a power of ten", () => {
    expect(niceStep(1)).toBe(1);
    expect(niceStep(1.3)).toBe(2);
    expect(niceStep(2.2)).toBe(2.5);
    expect(niceStep(3)).toBe(5);
    expect(niceStep(7)).toBe(10);
    expect(niceStep(29.5)).toBe(50);
    expect(niceStep(0.03)).toBeCloseTo(0.05);
  });

  it.each([
    [118, 4],
    [7, 4],
    [0.3, 3],
    [1234, 5],
    [99, 4],
    [100, 4],
  ])("niceScale(%d, %d): top ≥ largest, ticks from 0 evenly spaced and round", (largest, tickCount) => {
    const { top, ticks } = niceScale(largest, tickCount);
    expect(top).toBeGreaterThanOrEqual(largest);
    expect(ticks[0]).toBe(0);
    expect(ticks[ticks.length - 1]).toBeCloseTo(top, 9);
    const step = ticks[1] - ticks[0];
    expect(top - largest).toBeLessThan(step + 1e-9); // "at or just above": less than one step of headroom
    const mantissa = step / 10 ** Math.floor(Math.log10(step));
    expect([1, 2, 2.5, 5]).toContain(Number(mantissa.toPrecision(6)));
    for (let i = 1; i < ticks.length; i++) expect(ticks[i] - ticks[i - 1]).toBeCloseTo(step, 9);
    for (const t of ticks) expect(String(t).length).toBeLessThan(10); // no 0.30000000000000004
  });

  it("niceScale with a fixed top keeps that top", () => {
    expect(niceScale(118, 4, 200).top).toBe(200);
  });
});

describe("AnimatedBarChart — keyboard and tooltip", () => {
  it("is one Tab stop", async () => {
    const user = userEvent.setup();
    renderChart();
    await user.tab();
    expect(screen.getByRole("button", { name: "before" })).toHaveFocus();
    await user.tab();
    expect(bar("Mon: 42 minutes")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
    expect(bars().filter((b) => b.tabIndex === 0)).toHaveLength(1);
  });

  it("arrows, Home and End move between bars (roving tabindex)", async () => {
    const user = userEvent.setup();
    renderChart();
    bar("Mon: 42 minutes").focus();
    await user.keyboard("{ArrowRight}");
    expect(bar("Tue: 58 minutes")).toHaveFocus();
    await user.keyboard("{End}");
    expect(bar("Sun: 76 minutes")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(bar("Sat: 118 minutes")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(bar("Mon: 42 minutes")).toHaveFocus();
    expect(bar("Mon: 42 minutes")).toHaveAttribute("tabindex", "0");
    expect(bar("Sun: 76 minutes")).toHaveAttribute("tabindex", "-1");
  });

  it("Tab back into the chart returns to the bar last focused", async () => {
    const user = userEvent.setup();
    renderChart();
    bar("Mon: 42 minutes").focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    await user.tab();
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(bar("Wed: 64 minutes")).toHaveFocus();
  });

  it("focus shows a tooltip with the exact value and unit; Escape hides it", async () => {
    const user = userEvent.setup();
    renderChart();
    expect(anyTooltip()).toBe(false);
    bar("Mon: 42 minutes").focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    const tip = tooltipIn(bar("Wed: 64 minutes"), "Wed");
    expect(tip).not.toBeNull();
    expect(tip).toHaveTextContent("64");
    expect(tip).toHaveTextContent("minutes");
    expect(tip?.closest('[aria-hidden="true"]')).not.toBeNull(); // duplicate of the bar's name, so hidden from AT
    await user.keyboard("{Escape}");
    expect(anyTooltip()).toBe(false);
  });

  it("hover shows the tooltip too", async () => {
    const user = userEvent.setup();
    renderChart();
    await user.hover(bar("Fri: 91 minutes"));
    expect(tooltipIn(bar("Fri: 91 minutes"), "Fri")).toHaveTextContent("91");
    await user.unhover(bar("Fri: 91 minutes"));
    expect(anyTooltip()).toBe(false);
  });
});

describe("AnimatedBarChart — grow-in and motion", () => {
  it("waits until a third of the chart is on screen (IntersectionObserver), then grows bars from zero", () => {
    renderChart();
    expect(FakeIO.all).toHaveLength(1);
    const io = FakeIO.all[0];
    const threshold = io.options?.threshold;
    const first = Array.isArray(threshold) ? threshold[0] : threshold;
    expect(first).toBeCloseTo(1 / 3, 1);
    for (const b of bars()) expect(heightOf(b)).toBe(0);

    act(() => io.trigger(true, 0.4));
    const heights = bars().map((b) => heightOf(b) ?? 0);
    expect(Math.min(...heights)).toBeGreaterThan(0);
    // Taller value → taller bar.
    const byValue = WEEK.map((d, i) => [d.value, heights[i]] as const).sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < byValue.length; i++) expect(byValue[i][1]).toBeGreaterThanOrEqual(byValue[i - 1][1]);
    // Only the first time: the observer is done after that.
    expect(io.disconnected || io.unobserved.length > 0).toBe(true);
  });

  // Added after the coverage review: the not-yet-visible entry and the no-IntersectionObserver fallback.
  it("an entry that isn't on screen yet doesn't start the grow-in", () => {
    renderChart();
    act(() => FakeIO.all[0].trigger(false));
    for (const b of bars()) expect(heightOf(b)).toBe(0);
    expect(FakeIO.all[0].disconnected).toBe(false);
  });

  it("without IntersectionObserver the bars simply show", () => {
    // setup.ts defines it non-configurable (can't delete), but writable: an undefined value = "not supported"
    window.IntersectionObserver = undefined as unknown as typeof window.IntersectionObserver;
    renderChart();
    for (const b of bars()) expect(heightOf(b)).toBeGreaterThan(0);
  });

  it("disconnects its IntersectionObserver on unmount", () => {
    const { unmount } = renderChart();
    unmount();
    expect(FakeIO.all.every((io) => io.disconnected)).toBe(true);
  });

  it("animate={false}: bars are at full height without waiting to be seen", () => {
    renderChart({ animate: false });
    for (const b of bars()) expect(heightOf(b)).toBeGreaterThan(0);
  });

  it("reduced motion: no grow-in, bars are at full height immediately", () => {
    setReducedMotion(true);
    renderChart();
    for (const b of bars()) expect(heightOf(b)).toBeGreaterThan(0);
  });
});

describe("AnimatedBarChart — empty state", () => {
  it("shows the friendly empty panel and no bars or table rows", () => {
    renderChart({ data: [] });
    expect(screen.getByText("No data to show yet.")).toBeInTheDocument();
    expect(screen.getByRole("figure", { name: /Minutes listened per day/ })).toBeInTheDocument();
    expect(bars()).toHaveLength(0);
  });

  it("shows a custom emptyMessage", () => {
    renderChart({ data: [], emptyMessage: "Nothing played this week." });
    expect(screen.getByText("Nothing played this week.")).toBeInTheDocument();
  });
});
