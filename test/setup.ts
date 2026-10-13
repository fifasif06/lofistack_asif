// Runs before every test file: adds DOM matchers (toBeInTheDocument, toHaveAttribute…)
// and fills in the few browser features jsdom doesn't have.
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// The brief requires "no console errors or warnings" (React key/act/nesting warnings land here).
// Any console.error / console.warn during a test fails that test. jsdom's own "Not implemented: …"
// notices are about jsdom, not the component, so they are let through.
// Registered before cleanup: after-hooks run in reverse order, so this check runs after unmount.
const consoleProblems: string[] = [];
const realError = console.error;
const realWarn = console.warn;
beforeEach(() => {
  consoleProblems.length = 0;
  const record = (kind: string, real: (...args: unknown[]) => void) => (...args: unknown[]) => {
    const text = args.map((a) => (a instanceof Error ? a.message : String(a))).join(" ");
    if (/Not implemented/.test(text)) return;
    consoleProblems.push(`${kind}: ${text}`);
    real(...args);
  };
  console.error = record("console.error", realError);
  console.warn = record("console.warn", realWarn);
});
afterEach(() => {
  console.error = realError;
  console.warn = realWarn;
  if (consoleProblems.length > 0) {
    const list = consoleProblems.splice(0).join("\n");
    throw new Error(`Console errors/warnings during the test:\n${list}`);
  }
});

afterEach(() => cleanup());

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
if (!("IntersectionObserver" in window)) {
  Object.defineProperty(window, "IntersectionObserver", { writable: true, value: NoopObserver });
}
if (!("ResizeObserver" in window)) {
  Object.defineProperty(window, "ResizeObserver", { writable: true, value: NoopObserver });
}

// React Testing Library ends every userEvent call with `await setTimeout(0)` and only advances that
// timer when it detects *Jest* fake timers (`typeof jest !== "undefined"`). Under Vitest's fake timers
// the timeout never fires and the test hangs. This shim lets RTL advance Vitest's clock instead.
Object.defineProperty(globalThis, "jest", {
  configurable: true,
  value: { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) },
});

// jsdom has PointerEvent but no pointer capture, and no scrollIntoView. No-op stand-ins
// (drag code calls these; there is no layout to scroll anyway).
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = function setPointerCapture() {};
  Element.prototype.releasePointerCapture = function releasePointerCapture() {};
  Element.prototype.hasPointerCapture = function hasPointerCapture() { return false; };
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}
