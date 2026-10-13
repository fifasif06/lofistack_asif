// Spec-first tests for TiltProfileCard: written from prompt.md and the TiltProfileCardProps JSDoc.
// jsdom has no layout, so the card's box is stubbed (300 × 400 at the origin) for the tilt tests.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TiltProfileCard, { getInitials, type TiltProfileCardProps } from "./component";

const BOX = { x: 0, y: 0, left: 0, top: 0, width: 300, height: 400, right: 300, bottom: 400 };

let realMatchMedia: typeof window.matchMedia;
beforeEach(() => {
  realMatchMedia = window.matchMedia;
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

const renderCard = (props: Partial<TiltProfileCardProps> = {}) => render(<TiltProfileCard {...props} />);
const followButton = () => screen.getByRole("button", { name: /Follow/ });

/** Every number written in degrees in the card's inline styles (tilt angles). */
function degrees(container: HTMLElement): number[] {
  const styles = [container, ...Array.from(container.querySelectorAll<HTMLElement>("*"))]
    .map((el) => el.getAttribute("style") ?? "")
    .join(";");
  return Array.from(styles.matchAll(/(-?\d*\.?\d+)deg/g), (m) => parseFloat(m[1]));
}
const styleSnapshot = (container: HTMLElement) =>
  [container, ...Array.from(container.querySelectorAll<HTMLElement>("*"))].map((el) => el.getAttribute("style") ?? "").join("|");

function pointer(target: HTMLElement, type: "move" | "leave" | "down" | "up", x: number, y: number, pointerType = "mouse") {
  const init = { clientX: x, clientY: y, pointerType, pointerId: 1, isPrimary: true, bubbles: true };
  if (type === "move") fireEvent.pointerMove(target, init);
  if (type === "down") fireEvent.pointerDown(target, init);
  if (type === "up") fireEvent.pointerUp(target, init);
  if (type === "leave") {
    fireEvent.pointerLeave(target, init);
    fireEvent.pointerOut(target, init);
  }
}

describe("TiltProfileCard — content", () => {
  it("shows the defaults: name, role, three team tags, three stats and “AU” initials", () => {
    renderCard();
    expect(screen.getByRole("heading", { name: "Md Asif-Ud-Doula" })).toBeInTheDocument();
    expect(screen.getByText("Senior Automation Engineer L4")).toBeInTheDocument();
    const tags = screen.getByRole("list", { name: "Teams" });
    expect(tags.querySelectorAll("li")).toHaveLength(3);
    for (const t of ["Service Team Lead", "Operation Team", "Client Acquisition"]) expect(screen.getByText(t)).toBeInTheDocument();
    for (const s of ["30", "13", "90", "components", "agent logs", "days"]) expect(screen.getByText(s)).toBeInTheDocument();
    expect(screen.getByText("AU")).toBeInTheDocument();
  });

  it("is named “Profile card: {name}” by default, or by `label`", () => {
    const { unmount } = renderCard({ name: "Ada Lovelace" });
    expect(screen.getByLabelText("Profile card: Ada Lovelace")).toBeInTheDocument();
    unmount();
    renderCard({ label: "Ada's card" });
    expect(screen.getByLabelText("Ada's card")).toBeInTheDocument();
  });

  it("getInitials: first letters of the first two words, skipping a leading title", () => {
    expect(getInitials("Md Asif-Ud-Doula")).toBe("AU");
    expect(getInitials("Ada Lovelace")).toBe("AL");
    expect(getInitials("Dr. Jane Smith")).toBe("JS");
    expect(getInitials("mr john ronald tolkien")).toBe("JR");
    expect(getInitials("Cher")).toBe("C");
    expect(getInitials("Mdina Lane")).toBe("ML"); // "Md" only as a whole word
  });

  it("initials prop overrides the computed ones; name changes recompute them", () => {
    const { rerender } = renderCard({ initials: "LS" });
    expect(screen.getByText("LS")).toBeInTheDocument();
    rerender(<TiltProfileCard name="Grace Hopper" />);
    expect(screen.getByText("GH")).toBeInTheDocument();
  });

  it("hides the tag row and the stats row when their lists are empty", () => {
    renderCard({ tags: [], stats: [] });
    expect(screen.queryByRole("list", { name: "Teams" })).toBeNull();
    expect(screen.queryByText("components")).toBeNull();
  });

  it("tagsLabel names the tag list", () => {
    renderCard({ tagsLabel: "Squads" });
    expect(screen.getByRole("list", { name: "Squads" })).toBeInTheDocument();
  });
});

describe("TiltProfileCard — follow button", () => {
  it("uncontrolled: toggles Follow ⇄ Following with aria-pressed and calls onFollowChange", async () => {
    const onFollowChange = vi.fn<(f: boolean) => void>();
    const user = userEvent.setup();
    renderCard({ onFollowChange });
    expect(followButton()).toHaveAttribute("aria-pressed", "false");
    expect(followButton()).toHaveTextContent("Follow");
    await user.click(followButton());
    expect(followButton()).toHaveAttribute("aria-pressed", "true");
    expect(followButton()).toHaveTextContent("Following");
    await user.click(followButton());
    expect(followButton()).toHaveAttribute("aria-pressed", "false");
    expect(onFollowChange.mock.calls).toEqual([[true], [false]]);
  });

  it("defaultFollowed starts in the following state", () => {
    renderCard({ defaultFollowed: true });
    expect(followButton()).toHaveAttribute("aria-pressed", "true");
    expect(followButton()).toHaveTextContent("Following");
  });

  it("controlled: shows `followed` and only reports presses", async () => {
    const onFollowChange = vi.fn<(f: boolean) => void>();
    const user = userEvent.setup();
    const { rerender } = renderCard({ followed: false, onFollowChange });
    await user.click(followButton());
    expect(onFollowChange).toHaveBeenCalledWith(true);
    expect(followButton()).toHaveAttribute("aria-pressed", "false");
    rerender(<TiltProfileCard followed onFollowChange={onFollowChange} />);
    expect(followButton()).toHaveAttribute("aria-pressed", "true");
  });

  it("is keyboard operable (Enter and Space)", async () => {
    const onFollowChange = vi.fn<(f: boolean) => void>();
    const user = userEvent.setup();
    renderCard({ onFollowChange });
    followButton().focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onFollowChange.mock.calls).toEqual([[true], [false]]);
  });

  it("followLoading ignores presses; followDisabled disables the button", async () => {
    const onFollowChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = renderCard({ onFollowChange, followLoading: true });
    await user.click(followButton());
    expect(onFollowChange).not.toHaveBeenCalled();
    expect(followButton()).toHaveAttribute("aria-pressed", "false");
    rerender(<TiltProfileCard onFollowChange={onFollowChange} followDisabled />);
    expect(followButton()).toBeDisabled();
    await user.click(followButton());
    expect(onFollowChange).not.toHaveBeenCalled();
  });

  it("uses custom labels", async () => {
    const user = userEvent.setup();
    renderCard({ followLabel: "Subscribe", followingLabel: "Subscribed" });
    const b = screen.getByRole("button", { name: "Subscribe" });
    await user.click(b);
    expect(b).toHaveTextContent("Subscribed");
  });
});

describe("TiltProfileCard — tilt", () => {
  const frame = () => act(() => { vi.advanceTimersByTime(20); });

  it("tilts toward the pointer, never past maxTilt, and is flat in the middle", () => {
    vi.useFakeTimers();
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ ...BOX, toJSON: () => BOX } as DOMRect);
    const { container } = renderCard({ maxTilt: 14 });
    const target = screen.getByRole("heading", { name: "Md Asif-Ud-Doula" });
    expect(degrees(container).every((d) => d === 0)).toBe(true);

    pointer(target, "move", 300, 0); // top-right corner
    frame();
    const atCorner = degrees(container);
    expect(atCorner.some((d) => Math.abs(d) > 1)).toBe(true);
    expect(atCorner.every((d) => Math.abs(d) <= 14 + 1e-6)).toBe(true);

    pointer(target, "move", 150, 200); // centre
    frame();
    expect(degrees(container).every((d) => Math.abs(d) < 0.5)).toBe(true);
  });

  it("springs back flat when the pointer leaves", () => {
    vi.useFakeTimers();
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ ...BOX, toJSON: () => BOX } as DOMRect);
    const { container } = renderCard();
    const target = screen.getByRole("heading", { name: "Md Asif-Ud-Doula" });
    pointer(target, "move", 0, 400);
    frame();
    expect(degrees(container).some((d) => Math.abs(d) > 1)).toBe(true);
    pointer(target, "leave", -10, 410);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(degrees(container).every((d) => Math.abs(d) < 0.5)).toBe(true);
  });

  it("works with touch and pen pointers too (finger drag tilts)", () => {
    vi.useFakeTimers();
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ ...BOX, toJSON: () => BOX } as DOMRect);
    const { container } = renderCard();
    const target = screen.getByRole("heading", { name: "Md Asif-Ud-Doula" });
    pointer(target, "down", 280, 20, "touch");
    pointer(target, "move", 290, 10, "touch");
    frame();
    expect(degrees(container).some((d) => Math.abs(d) > 1)).toBe(true);
  });

  // Added after the coverage review: prompt.md "finger drag tilts, lift springs back" — the lift wasn't tested.
  it("lifting a finger springs the card back flat (touch has no pointerleave while pressed)", () => {
    vi.useFakeTimers();
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ ...BOX, toJSON: () => BOX } as DOMRect);
    const { container } = renderCard();
    const target = screen.getByRole("heading", { name: "Md Asif-Ud-Doula" });
    pointer(target, "down", 280, 20, "touch");
    pointer(target, "move", 290, 10, "touch");
    frame();
    expect(degrees(container).some((d) => Math.abs(d) > 1)).toBe(true);
    pointer(target, "up", 290, 10, "touch");
    act(() => { vi.advanceTimersByTime(1000); });
    expect(degrees(container).every((d) => Math.abs(d) < 0.5)).toBe(true);
  });

  it("reduced motion: no tilt or glare", () => {
    vi.useFakeTimers();
    setReducedMotion(true);
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ ...BOX, toJSON: () => BOX } as DOMRect);
    const { container } = renderCard();
    const before = styleSnapshot(container);
    const target = screen.getByRole("heading", { name: "Md Asif-Ud-Doula" });
    pointer(target, "move", 300, 0);
    frame();
    expect(styleSnapshot(container)).toBe(before);
  });

  it("unmounting mid-move leaves no pending animation frame", () => {
    vi.useFakeTimers();
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ ...BOX, toJSON: () => BOX } as DOMRect);
    const { unmount } = renderCard();
    pointer(screen.getByRole("heading", { name: "Md Asif-Ud-Doula" }), "move", 300, 0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
