// Spec-first tests for ShrinkNavbar: written from prompt.md and the ShrinkNavbarProps JSDoc.
// jsdom has no container queries, so the bar links and the menu button both exist in the DOM;
// the menu panel's copies of the links are told apart by living inside the aria-controls element.
import { createRef, type MouseEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShrinkNavbar, { type ShrinkNavbarProps } from "./component";

const LINKS = [
  { label: "Listen", href: "#listen" },
  { label: "Focus", href: "#focus" },
  { label: "Stations", href: "#stations" },
  { label: "Pricing", href: "#pricing" },
];

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function renderNav(props: Partial<ShrinkNavbarProps> = {}) {
  const user = userEvent.setup();
  const utils = render(
    <>
      <ShrinkNavbar brand={<span>lofistack radio</span>} links={LINKS} {...props} />
      <button type="button">outside</button>
    </>,
  );
  return { user, ...utils };
}

const menuButton = (name = "Menu") => screen.getByRole("button", { name });
const panel = () => document.getElementById(menuButton().getAttribute("aria-controls") ?? "") as HTMLElement;
/** Links in the bar itself (not in the menu panel). */
const barLinks = () => screen.getAllByRole("link").filter((a) => !panel()?.contains(a));

describe("ShrinkNavbar — landmarks and links", () => {
  it("is a header (banner) with a nav landmark named “Main” and the brand", () => {
    renderNav();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getAllByRole("navigation", { name: "Main" }).length).toBeGreaterThan(0);
    expect(screen.getByText("lofistack radio")).toBeInTheDocument();
  });

  it("renders every link with its href", () => {
    renderNav();
    const bar = barLinks();
    for (const l of LINKS) expect(bar.find((a) => a.textContent === l.label)).toHaveAttribute("href", l.href);
  });

  it("marks the activeHref link with aria-current=\"page\" (and only that one)", () => {
    renderNav({ activeHref: "#stations" });
    for (const a of screen.getAllByRole("link")) {
      if (a.getAttribute("href") === "#stations") expect(a).toHaveAttribute("aria-current", "page");
      else expect(a).not.toHaveAttribute("aria-current");
    }
  });

  it("calls onNavigate(href, event); the handler can preventDefault", async () => {
    const onNavigate = vi.fn((_href: string, e: MouseEvent<HTMLAnchorElement>) => e.preventDefault());
    const { user } = renderNav({ onNavigate });
    await user.click(barLinks().find((a) => a.textContent === "Pricing") as HTMLElement);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate.mock.calls[0][0]).toBe("#pricing");
    expect(onNavigate.mock.calls[0][1].defaultPrevented).toBe(true);
  });

  it("CTA without href is a button that calls onClick; with href it is a link", async () => {
    const onClick = vi.fn();
    const { user, unmount } = renderNav({ cta: { label: "Start listening", onClick } });
    const ctas = screen.getAllByRole("button", { name: "Start listening" });
    await user.click(ctas[0]);
    expect(onClick).toHaveBeenCalledTimes(1);
    unmount();
    renderNav({ cta: { label: "Start listening", href: "/signup" } });
    expect(screen.getAllByRole("link", { name: "Start listening" })[0]).toHaveAttribute("href", "/signup");
  });

  it("label and menuLabel rename the nav landmark and menu button; className goes on the header", () => {
    renderNav({ label: "Site", menuLabel: "Open navigation", className: "my-header" });
    expect(screen.getAllByRole("navigation", { name: "Site" }).length).toBeGreaterThan(0);
    expect(menuButton("Open navigation")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toHaveClass("my-header");
  });
});

describe("ShrinkNavbar — menu", () => {
  it("menu button has aria-expanded and aria-controls pointing at the panel", async () => {
    const { user } = renderNav();
    expect(menuButton()).toHaveAttribute("aria-expanded", "false");
    expect(panel()).not.toBeNull();
    await user.click(menuButton());
    expect(menuButton()).toHaveAttribute("aria-expanded", "true");
    expect(within(panel()).getAllByRole("link")).toHaveLength(LINKS.length);
  });

  it("Escape closes the menu and returns focus to the menu button", async () => {
    const { user } = renderNav();
    await user.click(menuButton());
    within(panel()).getAllByRole("link")[0].focus();
    await user.keyboard("{Escape}");
    expect(menuButton()).toHaveAttribute("aria-expanded", "false");
    expect(menuButton()).toHaveFocus();
  });

  it("an outside click closes the menu and refocuses the button", async () => {
    const { user } = renderNav();
    await user.click(menuButton());
    await user.click(document.body);
    expect(menuButton()).toHaveAttribute("aria-expanded", "false");
    expect(menuButton()).toHaveFocus();
  });

  it("choosing a link in the menu closes it and calls onNavigate", async () => {
    const onNavigate = vi.fn((_href: string, e: MouseEvent<HTMLAnchorElement>) => e.preventDefault());
    const { user } = renderNav({ onNavigate });
    await user.click(menuButton());
    await user.click(within(panel()).getByRole("link", { name: "Focus" }));
    expect(onNavigate.mock.calls[0][0]).toBe("#focus");
    expect(menuButton()).toHaveAttribute("aria-expanded", "false");
  });

  // Added after the coverage review: the CTA's copy inside the menu (narrow widths) wasn't exercised.
  it("the CTA inside the menu runs its onClick, closes the menu and refocuses the menu button", async () => {
    const onClick = vi.fn();
    const { user } = renderNav({ cta: { label: "Start listening", onClick } });
    await user.click(menuButton());
    await user.click(within(panel()).getByRole("button", { name: "Start listening" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(menuButton()).toHaveAttribute("aria-expanded", "false");
    expect(menuButton()).toHaveFocus();
  });

  it("tabbing out of the menu closes it", async () => {
    const { user } = renderNav();
    await user.click(menuButton());
    const items = within(panel()).getAllByRole("link");
    items[items.length - 1].focus();
    await user.tab();
    expect(panel().contains(document.activeElement)).toBe(false);
    expect(menuButton()).toHaveAttribute("aria-expanded", "false");
  });

  // Not in prompt.md (which says an outside click refocuses the menu button); this is the behaviour the
  // component documents in a code comment: clicking another control keeps that control's focus.
  it("clicking another control outside keeps that control's focus", async () => {
    const { user } = renderNav();
    await user.click(menuButton());
    await user.click(screen.getByRole("button", { name: "outside" }));
    expect(menuButton()).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "outside" })).toHaveFocus();
  });
});

describe("ShrinkNavbar — scrolling", () => {
  /** A scroll box with a fake geometry: 1000 px of content in a 600 px window. */
  function scrollBox() {
    const el = document.createElement("div");
    let top = 0;
    Object.defineProperty(el, "scrollTop", { configurable: true, get: () => top, set: (v: number) => { top = v; } });
    Object.defineProperty(el, "scrollHeight", { configurable: true, value: 1000 });
    Object.defineProperty(el, "clientHeight", { configurable: true, value: 600 });
    document.body.appendChild(el);
    const ref = createRef<HTMLElement>();
    (ref as { current: HTMLElement | null }).current = el;
    const scrollTo = (y: number) => {
      top = y;
      fireEvent.scroll(el);
    };
    return { el, ref, scrollTo };
  }
  const frame = () => act(() => { vi.advanceTimersByTime(20); });
  // Markup minus CSS custom properties (the progress variable may change on every scroll).
  const headerHTML = () => screen.getByRole("banner").outerHTML.replace(/--[\w-]+\s*:\s*[^;"]*;?\s*/g, "");
  const cssVars = () => {
    const styles = [screen.getByRole("banner"), ...Array.from(screen.getByRole("banner").querySelectorAll<HTMLElement>("*"))]
      .map((el) => el.getAttribute("style") ?? "")
      .join(";");
    return Array.from(styles.matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g), (m) => [m[1], m[2].trim()] as const);
  };

  it("adds one passive scroll listener to the scroll container and removes it on unmount", () => {
    vi.useFakeTimers();
    const box = scrollBox();
    const add = vi.spyOn(box.el, "addEventListener");
    const remove = vi.spyOn(box.el, "removeEventListener");
    const { unmount } = render(<ShrinkNavbar brand="b" links={LINKS} scrollContainer={box.ref} />);
    const scrollAdds = add.mock.calls.filter((c) => c[0] === "scroll");
    expect(scrollAdds).toHaveLength(1);
    const opts = scrollAdds[0][2];
    expect(typeof opts === "object" && opts !== null && opts.passive).toBe(true);
    unmount();
    expect(remove.mock.calls.some((c) => c[0] === "scroll" && c[1] === scrollAdds[0][1])).toBe(true);
    box.el.remove();
  });

  it("shrinks past shrinkAt (default 24) and grows back above it", () => {
    vi.useFakeTimers();
    const box = scrollBox();
    render(<ShrinkNavbar brand="b" links={LINKS} scrollContainer={box.ref} />);
    const tall = headerHTML();
    box.scrollTo(10);
    frame();
    expect(headerHTML()).toBe(tall); // under shrinkAt: nothing changes
    box.scrollTo(100);
    frame();
    const compact = headerHTML();
    expect(compact).not.toBe(tall);
    box.scrollTo(200);
    frame();
    expect(headerHTML()).toBe(compact); // still shrunk: no change
    box.scrollTo(0);
    frame();
    expect(headerHTML()).toBe(tall);
    box.el.remove();
  });

  it("uses tallHeight / compactHeight in px", () => {
    vi.useFakeTimers();
    const box = scrollBox();
    render(<ShrinkNavbar brand="b" links={LINKS} scrollContainer={box.ref} tallHeight={90} compactHeight={50} />);
    expect(headerHTML()).toContain("90px");
    box.scrollTo(100);
    frame();
    expect(headerHTML()).toContain("50px");
    box.el.remove();
  });

  it("writes scroll progress to a CSS variable (0 → 0.5 → 1)", () => {
    vi.useFakeTimers();
    const box = scrollBox();
    render(<ShrinkNavbar brand="b" links={LINKS} scrollContainer={box.ref} />);
    const progress = () => cssVars().map(([, v]) => parseFloat(v)).filter((n) => !Number.isNaN(n));
    box.scrollTo(200); // 200 / (1000 − 600)
    frame();
    expect(progress().some((n) => Math.abs(n - 0.5) < 1e-6 || Math.abs(n - 50) < 1e-6)).toBe(true);
    box.scrollTo(400);
    frame();
    expect(progress().some((n) => Math.abs(n - 1) < 1e-6 || Math.abs(n - 100) < 1e-6)).toBe(true);
    box.el.remove();
  });

  it("is rAF-throttled: many scroll events in one frame → one frame scheduled", () => {
    vi.useFakeTimers();
    const box = scrollBox();
    render(<ShrinkNavbar brand="b" links={LINKS} scrollContainer={box.ref} />);
    const raf = vi.spyOn(window, "requestAnimationFrame");
    for (let y = 1; y <= 10; y++) box.scrollTo(y * 10);
    expect(raf).toHaveBeenCalledTimes(1);
    frame();
    box.el.remove();
  });

  it("listens to the window by default", () => {
    vi.useFakeTimers();
    const add = vi.spyOn(window, "addEventListener");
    render(<ShrinkNavbar brand="b" links={LINKS} showProgress={false} />);
    expect(add.mock.calls.filter((c) => c[0] === "scroll")).toHaveLength(1);
    const tall = headerHTML();
    Object.defineProperty(window, "scrollY", { configurable: true, value: 100 });
    Object.defineProperty(window, "pageYOffset", { configurable: true, value: 100 });
    document.documentElement.scrollTop = 100;
    fireEvent.scroll(window);
    frame();
    expect(headerHTML()).not.toBe(tall);
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    Object.defineProperty(window, "pageYOffset", { configurable: true, value: 0 });
    document.documentElement.scrollTop = 0;
  });

  it("unmounting with a scroll frame pending leaves no timers", () => {
    vi.useFakeTimers();
    const box = scrollBox();
    const { unmount } = render(<ShrinkNavbar brand="b" links={LINKS} scrollContainer={box.ref} />);
    box.scrollTo(100);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    box.el.remove();
  });
});
