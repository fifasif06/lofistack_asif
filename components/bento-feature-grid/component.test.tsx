// Spec-first tests for BentoFeatureGrid: written from prompt.md and the BentoFeatureGridProps JSDoc.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import BentoFeatureGrid, { type BentoFeatureGridProps, type BentoItem } from "./component";

const ITEMS: BentoItem[] = [
  { id: "radio", size: "lg", title: "Endless lofi radio", description: "Beats that never loop.", badge: "live", href: "#listen", visual: <span>eq bars</span> },
  { id: "focus", size: "tall", title: "Focus timer", description: "25 on, 5 off." },
  { id: "offline", title: "Offline mode", description: "Save a station.", icon: <svg data-testid="download-icon" /> },
  { id: "sleep", title: "Sleep timer", description: "Fades out slowly.", badge: "new" },
  { id: "stations", size: "wide", title: "Stations for every mood", description: "Rain, tape, café.", href: "#stations" },
];

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
  trigger(isIntersecting: boolean) {
    const entries = this.observed.map(
      (target) => ({ target, isIntersecting, intersectionRatio: isIntersecting ? 1 : 0, time: 0 }) as unknown as IntersectionObserverEntry,
    );
    this.callback(entries, this as unknown as IntersectionObserver);
  }
}

let realIO: typeof window.IntersectionObserver;
beforeEach(() => {
  FakeIO.all = [];
  realIO = window.IntersectionObserver;
  window.IntersectionObserver = FakeIO as unknown as typeof window.IntersectionObserver;
});
afterEach(() => {
  cleanup();
  window.IntersectionObserver = realIO;
});

const renderGrid = (props: Partial<BentoFeatureGridProps> = {}) =>
  render(
    <BentoFeatureGrid
      eyebrow="why lofistack radio"
      heading="Everything you need to settle in"
      subheading="Calm music for long study nights."
      items={ITEMS}
      {...props}
    />,
  );

const tiles = () => within(screen.getByRole("list")).getAllByRole("listitem");

describe("BentoFeatureGrid — content and semantics", () => {
  it("renders the eyebrow, an h2 heading and the subheading", () => {
    renderGrid();
    expect(screen.getByText("why lofistack radio")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Everything you need to settle in" })).toBeInTheDocument();
    expect(screen.getByText("Calm music for long study nights.")).toBeInTheDocument();
  });

  it("eyebrow and subheading are optional", () => {
    render(<BentoFeatureGrid heading="Features" items={ITEMS} />);
    expect(screen.getByRole("heading", { level: 2, name: "Features" })).toBeInTheDocument();
    expect(screen.queryByText("why lofistack radio")).toBeNull();
  });

  it("is a list with one item per tile, in order, each titled by an h3 with its description", () => {
    renderGrid();
    expect(tiles()).toHaveLength(ITEMS.length);
    const h3s = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(h3s).toEqual(ITEMS.map((i) => i.title));
    for (const i of ITEMS) expect(screen.getByText(i.description)).toBeInTheDocument();
  });

  // prompt.md: "links named by their title". The code deliberately adds the badge to the name
  // ("name = title (+ badge)") and uses the description as the accessible description (spec mismatch, c).
  it("tiles with href are links named by their title (+ badge), described by the description; others are not links", () => {
    renderGrid();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    const radio = screen.getByRole("link", { name: "Endless lofi radio live" });
    expect(radio).toHaveAttribute("href", "#listen");
    expect(radio).toHaveAccessibleDescription("Beats that never loop.");
    const stations = screen.getByRole("link", { name: "Stations for every mood" });
    expect(stations).toHaveAttribute("href", "#stations");
    expect(stations).toHaveAccessibleDescription("Rain, tape, café.");
    expect(screen.queryByRole("link", { name: /Focus timer/ })).toBeNull();
  });

  it("hides the decorative visual from screen readers", () => {
    renderGrid();
    expect(screen.getByText("eq bars").closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("shows badges and icons", () => {
    renderGrid();
    expect(screen.getByText("live")).toBeInTheDocument();
    expect(screen.getByText("new")).toBeInTheDocument();
    expect(screen.getByTestId("download-icon")).toBeInTheDocument();
  });

  it("rowHeight sets the fixed row height in px (default 168)", () => {
    const { container, unmount } = renderGrid();
    expect(container.innerHTML).toContain("168px");
    unmount();
    const second = renderGrid({ rowHeight: 200 });
    expect(second.container.innerHTML).toContain("200px");
  });

  it("className is added to the section", () => {
    const { container } = renderGrid({ className: "my-features" });
    expect(container.querySelector("section")).toHaveClass("my-features");
  });

  it("handles an empty items list", () => {
    renderGrid({ items: [] });
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});

describe("BentoFeatureGrid — reveal and spotlight", () => {
  const listHTML = () => screen.getByRole("list").innerHTML;

  it("reveals tiles once when the section scrolls into view (IntersectionObserver, then disconnected)", () => {
    renderGrid();
    expect(FakeIO.all.length).toBeGreaterThan(0);
    const io = FakeIO.all[0];
    expect(io.observed.length).toBeGreaterThan(0);
    const hidden = listHTML();
    act(() => io.trigger(true));
    expect(listHTML()).not.toBe(hidden);
    expect(io.disconnected || io.unobserved.length > 0).toBe(true);
  });

  it("focus also reveals (keyboard users aren't left with invisible tiles)", () => {
    renderGrid();
    const hidden = listHTML();
    act(() => screen.getByRole("link", { name: /^Endless lofi radio/ }).focus());
    expect(listHTML()).not.toBe(hidden);
  });

  it("reveal={false}: tiles are shown without waiting for the observer", () => {
    const shown = renderGrid({ reveal: false });
    const before = shown.container.innerHTML;
    for (const io of FakeIO.all) act(() => io.trigger(true));
    expect(shown.container.innerHTML).toBe(before);
  });

  // Added after the coverage review: the not-yet-visible entry and the no-IntersectionObserver fallback.
  it("stays hidden while the section isn't in view yet", () => {
    renderGrid();
    const hidden = listHTML();
    act(() => FakeIO.all[0].trigger(false));
    expect(listHTML()).toBe(hidden);
  });

  it("without IntersectionObserver the tiles simply show", () => {
    // setup.ts defines it non-configurable (can't delete), but writable: an undefined value = "not supported"
    window.IntersectionObserver = undefined as unknown as typeof window.IntersectionObserver;
    renderGrid();
    // the hidden state is Tailwind's opacity-0 on each tile (jsdom applies no CSS, so check the class)
    expect(tiles().every((t) => !/\bopacity-0\b/.test(t.className))).toBe(true);
  });

  it("disconnects the observer on unmount", () => {
    const { unmount } = renderGrid();
    unmount();
    expect(FakeIO.all.every((io) => io.disconnected)).toBe(true);
  });

  it("pointermove sets CSS variables for the spotlight on the tile", () => {
    renderGrid();
    const tile = tiles()[1];
    const target = within(tile).getByText("Focus timer");
    fireEvent.pointerMove(target, { clientX: 40, clientY: 30, pointerType: "mouse" });
    const styled = [tile, ...Array.from(tile.querySelectorAll<HTMLElement>("*"))].map((el) => el.getAttribute("style") ?? "").join(";");
    expect(styled).toMatch(/--[\w-]+\s*:\s*-?\d/);
  });
});
