// Spec-first tests for SpringBottomSheet: written from prompt.md and the SpringBottomSheetProps JSDoc.
// The spring runs on requestAnimationFrame; Vitest's fake timers fake rAF and performance.now, so
// advancing the clock steps the physics.
import { StrictMode, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SpringBottomSheet, { type SpringBottomSheetProps } from "./component";

type HarnessProps = Partial<Omit<SpringBottomSheetProps, "open" | "onClose">> & {
  onClose?: () => void;
  initiallyOpen?: boolean;
};

/** The sheet as an app would use it: an opener button and state that onClose turns off. */
function Harness({ onClose, initiallyOpen = false, ...props }: HarnessProps) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open play queue
      </button>
      <SpringBottomSheet
        title="Play queue"
        description="lofistack radio · 12 tracks"
        footer={<button type="button">Shuffle</button>}
        {...props}
        open={open}
        onClose={() => {
          onClose?.();
          setOpen(false);
        }}
      >
        <ul>
          <li>
            <button type="button">Rainy Window</button>
          </li>
          <li>
            <button type="button">Late Bus Home</button>
          </li>
        </ul>
      </SpringBottomSheet>
    </>
  );
}

let realMatchMedia: typeof window.matchMedia;
beforeEach(() => {
  vi.useFakeTimers();
  realMatchMedia = window.matchMedia;
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
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

const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
const setup = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

async function openSheet(props: HarnessProps = {}) {
  const user = setup();
  const utils = render(<Harness {...props} />);
  await user.click(screen.getByRole("button", { name: "Open play queue" }));
  advance(1500); // let the opening spring settle
  return { user, ...utils, dialog: screen.getByRole("dialog") };
}

/** Clicks outside the sheet panel: the dialog's sibling backdrop, or its wrapper if there's no sibling. */
function backdropOf(dialog: HTMLElement): HTMLElement {
  const parent = dialog.parentElement as HTMLElement;
  const sibling = Array.from(parent.children).find((el) => el !== dialog) as HTMLElement | undefined;
  return sibling ?? parent;
}

describe("SpringBottomSheet — dialog semantics", () => {
  it("renders nothing while closed", () => {
    render(<Harness />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("is a modal dialog, portalled to body, labelled by its title and described by its description", async () => {
    const { dialog, container } = await openSheet();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Play queue");
    expect(dialog).toHaveAccessibleDescription("lofistack radio · 12 tracks");
    expect(container.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it("without a description it has no dangling aria-describedby", async () => {
    const { dialog } = await openSheet({ description: undefined });
    const ids = dialog.getAttribute("aria-describedby");
    if (ids) for (const id of ids.split(/\s+/)) expect(document.getElementById(id)).not.toBeNull();
    expect(dialog).toHaveAccessibleDescription("");
  });

  it("shows the content and the pinned footer", async () => {
    await openSheet();
    expect(screen.getByRole("button", { name: "Rainy Window" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Shuffle" })).toBeInTheDocument();
  });

  it("has a close button (closeLabel, default “Close”) and a handle button (handleLabel, default “Resize sheet”)", async () => {
    const onClose = vi.fn();
    const { user } = await openSheet({ onClose });
    expect(screen.getByRole("button", { name: "Resize sheet" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("uses custom closeLabel and handleLabel", async () => {
    await openSheet({ closeLabel: "Close play queue", handleLabel: "Drag to resize" });
    expect(screen.getByRole("button", { name: "Close play queue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Drag to resize" })).toBeInTheDocument();
  });
});

describe("SpringBottomSheet — focus management", () => {
  it("moves focus into the sheet when it opens", async () => {
    const { dialog } = await openSheet();
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("traps Tab and Shift+Tab inside the sheet", async () => {
    const { user, dialog } = await openSheet();
    for (let i = 0; i < 8; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    for (let i = 0; i < 8; i++) {
      await user.tab({ shift: true });
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it("Escape calls onClose; the sheet animates out, unmounts and focus returns to the opener", async () => {
    const onClose = vi.fn();
    const { user } = await openSheet({ onClose });
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    advance(2000);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Open play queue" })).toHaveFocus();
  });

  it("stays mounted while the closing spring runs (animates out, not instant)", async () => {
    const { user } = await openSheet();
    await user.keyboard("{Escape}");
    advance(16);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("SpringBottomSheet — backdrop", () => {
  it("backdrop click closes (closeOnBackdrop default true)", async () => {
    const onClose = vi.fn();
    const { user, dialog } = await openSheet({ onClose });
    await user.click(backdropOf(dialog));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("backdrop click does nothing with closeOnBackdrop={false}", async () => {
    const onClose = vi.fn();
    const { user, dialog } = await openSheet({ onClose, closeOnBackdrop: false });
    await user.click(backdropOf(dialog));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("clicks inside the sheet don't close it", async () => {
    const onClose = vi.fn();
    const { user } = await openSheet({ onClose });
    await user.click(screen.getByRole("button", { name: "Rainy Window" }));
    await user.click(screen.getByText("Play queue"));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("SpringBottomSheet — body scroll lock", () => {
  it("locks body scroll while open and restores the previous values after closing", async () => {
    document.body.style.overflow = "auto";
    document.body.style.paddingRight = "3px";
    const { user } = await openSheet();
    expect(document.body.style.overflow).toBe("hidden");
    await user.keyboard("{Escape}");
    advance(2000);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("auto");
    expect(document.body.style.paddingRight).toBe("3px");
  });

  it("restores body scroll when unmounted while open", async () => {
    const { unmount } = await openSheet();
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.paddingRight).toBe("");
  });

  it("works under StrictMode (double effects don't leave the lock on)", async () => {
    const user = setup();
    render(
      <StrictMode>
        <Harness />
      </StrictMode>,
    );
    await user.click(screen.getByRole("button", { name: "Open play queue" }));
    advance(1500);
    expect(document.body.style.overflow).toBe("hidden");
    await user.keyboard("{Escape}");
    advance(2000);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).toBe("");
    expect(screen.getByRole("button", { name: "Open play queue" })).toHaveFocus();
  });
});

describe("SpringBottomSheet — snap points via the handle", () => {
  it("Enter and Space on the handle cycle through the snap points (onSnapChange)", async () => {
    const onSnapChange = vi.fn<(i: number) => void>();
    const { user } = await openSheet({ onSnapChange, snapPoints: [0.3, 0.6, 0.9] });
    const handle = screen.getByRole("button", { name: "Resize sheet" });
    handle.focus();
    await user.keyboard("{Enter}");
    advance(1000);
    await user.keyboard(" ");
    advance(1000);
    await user.keyboard("{Enter}");
    advance(1000);
    expect(onSnapChange.mock.calls.map((c) => c[0])).toEqual([1, 2, 0]);
  });

  it("a tap (click) on the handle moves one snap point", async () => {
    const onSnapChange = vi.fn<(i: number) => void>();
    const { user } = await openSheet({ onSnapChange });
    await user.click(screen.getByRole("button", { name: "Resize sheet" }));
    advance(1000);
    expect(onSnapChange.mock.calls.map((c) => c[0])).toEqual([1]);
  });

  it("ArrowUp / ArrowDown on the handle move up and down", async () => {
    const onSnapChange = vi.fn<(i: number) => void>();
    const { user } = await openSheet({ onSnapChange });
    screen.getByRole("button", { name: "Resize sheet" }).focus();
    await user.keyboard("{ArrowUp}");
    advance(1000);
    await user.keyboard("{ArrowDown}");
    advance(1000);
    expect(onSnapChange.mock.calls.map((c) => c[0])).toEqual([1, 0]);
  });

  it("initialSnap picks the opening snap point (Enter from the top wraps to 0)", async () => {
    const onSnapChange = vi.fn<(i: number) => void>();
    const { user } = await openSheet({ onSnapChange, initialSnap: 1 });
    expect(onSnapChange).not.toHaveBeenCalled();
    screen.getByRole("button", { name: "Resize sheet" }).focus();
    await user.keyboard("{Enter}");
    advance(1000);
    expect(onSnapChange.mock.calls.map((c) => c[0])).toEqual([0]);
  });
});

/** Press at points[0], move through the rest (msPerStep apart), release at the last point. */
function drag(target: HTMLElement, points: number[], msPerStep: number) {
  fireEvent.pointerDown(target, { pointerId: 1, button: 0, buttons: 1, clientX: 100, clientY: points[0], pointerType: "mouse", isPrimary: true });
  for (const y of points.slice(1)) {
    advance(msPerStep);
    fireEvent.pointerMove(target, { pointerId: 1, buttons: 1, clientX: 100, clientY: y, pointerType: "mouse", isPrimary: true });
  }
  fireEvent.pointerUp(target, { pointerId: 1, button: 0, clientX: 100, clientY: points[points.length - 1], pointerType: "mouse", isPrimary: true });
}
const steps = (from: number, to: number, n: number) => Array.from({ length: n + 1 }, (_, i) => from + ((to - from) * i) / n);

describe("SpringBottomSheet — dragging the handle", () => {

  it("a fast flick down closes the sheet", async () => {
    const onClose = vi.fn();
    await openSheet({ onClose });
    drag(screen.getByRole("button", { name: "Resize sheet" }), [400, 430, 470, 520], 16); // ~3000 px/s
    advance(16);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("a slow, short drag down springs back instead of closing", async () => {
    const onClose = vi.fn();
    await openSheet({ onClose });
    drag(screen.getByRole("button", { name: "Resize sheet" }), [400, 405, 410, 415, 420], 100); // ~50 px/s, 20 px
    advance(1500);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("a slow drag ending well below the lowest snap point (past closeThreshold) closes", async () => {
    const onClose = vi.fn();
    await openSheet({ onClose });
    // Lowest snap = 0.5 × 768 px = 384 px tall; 0.25 of that is 96 px. Drag 200 px slowly, then hold still.
    const path = Array.from({ length: 21 }, (_, i) => 300 + i * 10);
    drag(screen.getByRole("button", { name: "Resize sheet" }), [...path, 500, 500], 100);
    advance(16);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("SpringBottomSheet — motion and cleanup", () => {
  it("the spring comes to rest: no animation frames keep running once settled", async () => {
    await openSheet();
    advance(3000);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("unmounting mid-animation leaves no timers or frames running and no key listener", async () => {
    const onClose = vi.fn();
    const user = setup();
    const { unmount } = render(<Harness onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Open play queue" }));
    advance(32); // still springing open
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("reduced motion: fades out in about fadeDuration (default 160 ms)", async () => {
    setReducedMotion(true);
    const { user } = await openSheet();
    await user.keyboard("{Escape}");
    advance(300);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("reduced motion: fadeDuration sets the fade length", async () => {
    setReducedMotion(true);
    const { user } = await openSheet({ fadeDuration: 600 });
    await user.keyboard("{Escape}");
    advance(300);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    advance(500);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("can open straight away when mounted with open={true}", () => {
    render(<Harness initiallyOpen />);
    advance(1500);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
  });
});

// ---- Added after the first coverage review (step 5): behaviours the first draft didn't really exercise. ----

describe("SpringBottomSheet — focus trap with real tab order", () => {
  // jsdom has no layout, so getClientRects() is always empty and the trap's "visible focusables" list was
  // empty in the first draft: Tab just parked focus on the sheet. Give elements a box so the real
  // first ↔ last wrap-around runs.
  const withBoxes = () =>
    vi.spyOn(Element.prototype, "getClientRects").mockReturnValue([{ width: 10, height: 10 }] as unknown as DOMRectList);

  it("Tab on the last control wraps to the first; Shift+Tab on the first wraps to the last", async () => {
    withBoxes();
    const { user, dialog } = await openSheet();
    const controls = Array.from(dialog.querySelectorAll<HTMLElement>("button"));
    const first = controls[0];
    const last = controls[controls.length - 1];
    expect(first).toHaveAccessibleName("Resize sheet");
    expect(last).toHaveAccessibleName("Shuffle");
    act(() => last.focus());
    await user.tab();
    expect(first).toHaveFocus();
    await user.tab({ shift: true });
    expect(last).toHaveFocus();
  });

  it("Tab moves through the controls in order without leaving", async () => {
    withBoxes();
    const { user, dialog } = await openSheet();
    const controls = Array.from(dialog.querySelectorAll<HTMLElement>("button"));
    act(() => controls[0].focus());
    for (let i = 1; i < controls.length; i++) {
      await user.tab();
      expect(controls[i]).toHaveFocus();
    }
  });

  it("focus that lands outside some other way is pulled back in", async () => {
    const { dialog } = await openSheet();
    act(() => screen.getByRole("button", { name: "Open play queue", hidden: true }).focus());
    expect(dialog.contains(document.activeElement)).toBe(true);
  });
});

describe("SpringBottomSheet — release snaps to the nearest velocity-projected point", () => {
  // jsdom: innerHeight 768 → snap heights 384 px (0.5) and ≈ 707 px (0.92). Dragging up raises the sheet.
  it("a slow drag up most of the way settles on the top snap point", async () => {
    const onSnapChange = vi.fn<(i: number) => void>();
    await openSheet({ onSnapChange });
    drag(screen.getByRole("button", { name: "Resize sheet" }), [...steps(500, 200, 30), 200, 200], 100);
    advance(1500);
    expect(onSnapChange.mock.calls.map((c) => c[0])).toEqual([1]);
  });

  it("a short but fast flick up goes to the top snap point (velocity is projected)", async () => {
    const onSnapChange = vi.fn<(i: number) => void>();
    await openSheet({ onSnapChange });
    drag(screen.getByRole("button", { name: "Resize sheet" }), steps(500, 440, 3), 16); // 60 px in 48 ms ≈ 1250 px/s
    advance(1500);
    expect(onSnapChange.mock.calls.map((c) => c[0])).toEqual([1]);
  });

  it("the same 60 px drag done slowly falls back to the lower snap point", async () => {
    const onSnapChange = vi.fn<(i: number) => void>();
    await openSheet({ onSnapChange });
    drag(screen.getByRole("button", { name: "Resize sheet" }), [...steps(500, 440, 6), 440, 440], 100);
    advance(1500);
    expect(onSnapChange).not.toHaveBeenCalled();
  });

  it("the click that ends a drag on the handle doesn't also count as a tap", async () => {
    const onSnapChange = vi.fn<(i: number) => void>();
    await openSheet({ onSnapChange });
    const handle = screen.getByRole("button", { name: "Resize sheet" });
    drag(handle, [...steps(500, 200, 30), 200, 200], 100);
    fireEvent.click(handle, { detail: 1 });
    advance(1500);
    expect(onSnapChange.mock.calls.map((c) => c[0])).toEqual([1]);
  });

  it("dragging past the top rubber-bands: the sheet never gets taller than the screen", async () => {
    const { dialog } = await openSheet();
    const handle = screen.getByRole("button", { name: "Resize sheet" });
    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, buttons: 1, clientX: 100, clientY: 700, pointerType: "mouse", isPrimary: true });
    advance(50);
    fireEvent.pointerMove(handle, { pointerId: 1, buttons: 1, clientX: 100, clientY: -1500, pointerType: "mouse", isPrimary: true });
    const h = parseFloat(dialog.style.height);
    expect(h).toBeGreaterThan(0.92 * 768);
    expect(h).toBeLessThanOrEqual(768);
  });

  it("the header drags too (not only the handle); a press on the close button does not start a drag", async () => {
    const onClose = vi.fn();
    await openSheet({ onClose });
    drag(screen.getByRole("button", { name: "Close" }), [400, 430, 470, 520], 16);
    advance(16);
    expect(onClose).not.toHaveBeenCalled();
    drag(screen.getByText("Play queue"), [400, 430, 470, 520], 16);
    advance(16);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("SpringBottomSheet — parent in control", () => {
  it("if the parent keeps it open after onClose, the sheet springs back and settles", async () => {
    const onClose = vi.fn();
    const user = setup();
    render(
      <SpringBottomSheet open onClose={onClose} title="Play queue">
        <p>content</p>
      </SpringBottomSheet>,
    );
    advance(1500);
    await user.keyboard("{Escape}");
    drag(screen.getByRole("button", { name: "Resize sheet" }), [400, 430, 470, 520], 16);
    expect(onClose).toHaveBeenCalledTimes(2);
    advance(3000);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0); // came to rest
  });

  it("re-opening while it is closing keeps it mounted and working", async () => {
    const onClose = vi.fn();
    const { user } = await openSheet({ onClose });
    await user.keyboard("{Escape}");
    advance(40); // mid-close
    await user.click(screen.getByRole("button", { name: "Open play queue", hidden: true }));
    advance(2000);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.body.style.overflow).toBe("hidden");
    expect(dialog.contains(document.activeElement)).toBe(true);
    await user.keyboard("{Escape}");
    advance(2000);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
