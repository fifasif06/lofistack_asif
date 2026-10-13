// Spec-first tests for MagneticButton: written from the MagneticButtonProps JSDoc and the behaviour in
// prompt.md (pull zone past the edges, mouse only, bounce back, reduced motion, a real <button>).
// prompt.md describes the original plain-HTML snippet; the React component keeps that behaviour.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MagneticButton, { type MagneticButtonProps } from "./component";

// jsdom has no layout: give the button a 100 × 40 box at (100, 100), and every other element the
// 60 px pull zone around it.
const BUTTON = { x: 100, y: 100, left: 100, top: 100, width: 100, height: 40, right: 200, bottom: 140 };
const ZONE = { x: 40, y: 40, left: 40, top: 40, width: 220, height: 160, right: 260, bottom: 200 };

let realMatchMedia: typeof window.matchMedia;
beforeEach(() => {
  realMatchMedia = window.matchMedia;
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const r = this.closest("button") ? BUTTON : ZONE;
    return { ...r, toJSON: () => r } as DOMRect;
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
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

const renderButton = (props: Partial<MagneticButtonProps> = {}) => render(<MagneticButton {...props}>Hover me</MagneticButton>);
const button = () => screen.getByRole("button", { name: /Hover me/ });

/** All px offsets written as translate in inline styles under the root (0 when at rest). */
function offsets(root: HTMLElement): number[] {
  const styles = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))].map((el) => el.getAttribute("style") ?? "").join(";");
  const out: number[] = [];
  for (const m of styles.matchAll(/translate(?:3d|X|Y)?\s*[:(]\s*([^;)]*)/g)) {
    for (const n of m[1].matchAll(/(-?\d*\.?\d+)px/g)) out.push(parseFloat(n[1]));
  }
  for (const m of styles.matchAll(/--[\w-]+\s*:\s*(-?\d*\.?\d+)px/g)) out.push(parseFloat(m[1]));
  return out;
}
const moved = (root: HTMLElement) => offsets(root).some((n) => Math.abs(n) > 0.5);

function move(x: number, y: number, pointerType = "mouse") {
  fireEvent.pointerMove(button(), { clientX: x, clientY: y, pointerType, pointerId: 1, isPrimary: true });
  fireEvent.pointerEnter(button(), { clientX: x, clientY: y, pointerType, pointerId: 1, isPrimary: true });
  fireEvent.pointerMove(button(), { clientX: x, clientY: y, pointerType, pointerId: 1, isPrimary: true });
  act(() => { vi.advanceTimersByTime(20); });
}

describe("MagneticButton — a real button", () => {
  it("renders a <button type=\"button\"> named by its children", () => {
    renderButton();
    expect(button().tagName).toBe("BUTTON");
    expect(button()).toHaveAttribute("type", "button");
  });

  it("passes through button attributes and extra classes", () => {
    render(
      <MagneticButton type="submit" aria-describedby="hint" data-track="cta" className="extra-class">
        Send
      </MagneticButton>,
    );
    const b = screen.getByRole("button", { name: "Send" });
    expect(b).toHaveAttribute("type", "submit");
    expect(b).toHaveAttribute("aria-describedby", "hint");
    expect(b).toHaveAttribute("data-track", "cta");
    expect(b).toHaveClass("extra-class");
  });

  it("clicks and keyboard (Enter/Space) call onClick", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    renderButton({ onClick });
    await user.click(button());
    button().focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it("is reachable with Tab", async () => {
    const user = userEvent.setup();
    renderButton();
    await user.tab();
    expect(button()).toHaveFocus();
  });

  it("disabled: no clicks", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    renderButton({ onClick, disabled: true });
    expect(button()).toBeDisabled();
    await user.click(button());
    expect(onClick).not.toHaveBeenCalled();
  });

  it("loading: aria-busy, a spinner, and clicks are blocked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    const { container } = renderButton({ onClick, loading: true });
    expect(button()).toHaveAttribute("aria-busy", "true");
    expect(container.querySelector("svg, [class*='animate-spin']")).not.toBeNull();
    await user.click(button());
    button().focus();
    await user.keyboard("{Enter}");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("not loading: no aria-busy=true", () => {
    renderButton();
    expect(button()).not.toHaveAttribute("aria-busy", "true");
  });
});

describe("MagneticButton — magnetic pull", () => {
  it("a mouse in the pull zone pulls the button toward it", () => {
    vi.useFakeTimers();
    const { container } = renderButton();
    expect(moved(container)).toBe(false);
    move(230, 120); // 30 px right of the right edge, level with the centre
    const xs = offsets(container);
    expect(xs.some((n) => n > 0.5)).toBe(true); // toward the cursor (to the right)
  });

  it("bounces back to rest when the pointer leaves", () => {
    vi.useFakeTimers();
    const { container } = renderButton();
    move(230, 120);
    expect(moved(container)).toBe(true);
    const init = { clientX: 300, clientY: 300, pointerType: "mouse", pointerId: 1, isPrimary: true };
    fireEvent.pointerLeave(button(), init);
    fireEvent.pointerOut(button(), init);
    if (button().parentElement) {
      fireEvent.pointerLeave(button().parentElement as HTMLElement, init);
      fireEvent.pointerOut(button().parentElement as HTMLElement, init);
    }
    act(() => { vi.advanceTimersByTime(600); });
    expect(moved(container)).toBe(false);
  });

  it("ignores touch and pen", () => {
    vi.useFakeTimers();
    const { container } = renderButton();
    move(230, 120, "touch");
    expect(moved(container)).toBe(false);
    move(230, 120, "pen");
    expect(moved(container)).toBe(false);
  });

  it("is off with reduced motion", () => {
    vi.useFakeTimers();
    setReducedMotion(true);
    const { container } = renderButton();
    move(230, 120);
    expect(moved(container)).toBe(false);
  });

  it("pull={0} keeps the button still", () => {
    vi.useFakeTimers();
    const { container } = renderButton({ pull: 0, labelPull: 0 });
    move(230, 120);
    expect(moved(container)).toBe(false);
  });

  it("unmounting while pulled leaves no timers or frames", () => {
    vi.useFakeTimers();
    const { unmount } = renderButton();
    fireEvent.pointerMove(button(), { clientX: 230, clientY: 120, pointerType: "mouse" });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
