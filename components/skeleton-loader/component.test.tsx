// Spec-first tests for SkeletonLoader: written from prompt.md and the SkeletonLoaderProps JSDoc.
// jsdom has no Web Audio, so a recording stand-in AudioContext is installed where a test needs one.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SkeletonLoader, { CLIP_SECONDS, buildLofiClip, type SkeletonLoaderProps } from "./component";

// ---- A fake Web Audio graph -------------------------------------------------------------------
// Any ctx.createX() returns a fake node; any property read on a node that isn't set yet is a fake
// AudioParam. Records every context made/closed and every start/stop time scheduled.
type Bag = Record<string | symbol, unknown>;
const scheduled: { method: "start" | "stop"; when: number }[] = [];

function fakeParam(): Bag {
  const param: Bag = { value: 0, defaultValue: 0, minValue: -Infinity, maxValue: Infinity };
  for (const m of [
    "setValueAtTime",
    "linearRampToValueAtTime",
    "exponentialRampToValueAtTime",
    "setTargetAtTime",
    "setValueCurveAtTime",
    "cancelScheduledValues",
    "cancelAndHoldAtTime",
  ]) {
    param[m] = () => param;
  }
  return param;
}

function fakeNode(ctx: FakeAudioContext, extra: Bag = {}): Bag {
  const store: Bag = {
    context: ctx,
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCount: 2,
    connect: (dest: unknown) => dest,
    disconnect: () => {},
    start: (when = 0) => { scheduled.push({ method: "start", when }); },
    stop: (when = 0) => { scheduled.push({ method: "stop", when }); },
    addEventListener: () => {},
    removeEventListener: () => {},
    setPeriodicWave: () => {},
    onended: null,
    ...extra,
  };
  return new Proxy(store, {
    get(target, prop) {
      if (!(prop in target) && typeof prop === "string" && prop !== "then") target[prop] = fakeParam();
      return target[prop];
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });
}

class FakeAudioContext {
  static made: FakeAudioContext[] = [];
  closed = 0;
  state: AudioContextState = "running";
  sampleRate = 44100;
  readonly destination: Bag;
  private t0 = performance.now();
  constructor() {
    FakeAudioContext.made.push(this);
    this.destination = fakeNode(this, { maxChannelCount: 2 });
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (typeof prop === "string" && prop.startsWith("create") && !(prop in target)) {
          return (...args: unknown[]) => target.makeNode(prop, args);
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  }
  get currentTime() {
    return (performance.now() - this.t0) / 1000;
  }
  makeNode(kind: string, args: unknown[]): Bag {
    if (kind === "createBuffer") {
      const [channels, length, rate] = args as [number, number, number];
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { numberOfChannels: channels, length, sampleRate: rate, duration: length / rate, getChannelData: (c: number) => data[c] };
    }
    if (kind === "createPeriodicWave") return {};
    return fakeNode(this);
  }
  resume() { return Promise.resolve(); }
  suspend() { return Promise.resolve(); }
  close() {
    this.closed += 1;
    this.state = "closed";
    return Promise.resolve();
  }
  addEventListener() {}
  removeEventListener() {}
}

function installAudio() {
  Object.defineProperty(window, "AudioContext", { configurable: true, writable: true, value: FakeAudioContext });
}
function removeAudio() {
  Reflect.deleteProperty(window, "AudioContext");
  Reflect.deleteProperty(window, "webkitAudioContext");
}

// -----------------------------------------------------------------------------------------------

let realMatchMedia: typeof window.matchMedia;
beforeEach(() => {
  vi.useFakeTimers();
  FakeAudioContext.made = [];
  scheduled.length = 0;
  realMatchMedia = window.matchMedia;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  removeAudio();
  window.matchMedia = realMatchMedia;
});

const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
const setup = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
// The card is the live region; aria-busy="false" and no aria-busy both mean "not busy".
const card = () => document.querySelector<HTMLElement>("[aria-live]") as HTMLElement;
const busy = () => card().getAttribute("aria-busy") === "true";

function renderLoaded(props: Partial<SkeletonLoaderProps> = {}) {
  const utils = render(<SkeletonLoader {...props} />);
  advance(props.loadMs ?? 2200);
  return utils;
}

describe("SkeletonLoader — loading → card", () => {
  it("starts as a busy skeleton with screen-reader loading text, no card content", () => {
    render(<SkeletonLoader />);
    expect(busy()).toBe(true);
    expect(card()).not.toBeNull();
    expect(screen.getByText("loading…")).toBeInTheDocument();
    expect(screen.queryByText("rainy window study mix")).toBeNull();
  });

  it("swaps to the real card after loadMs (default 2200 ms) and calls onLoaded", () => {
    const onLoaded = vi.fn();
    render(<SkeletonLoader onLoaded={onLoaded} />);
    advance(2199);
    expect(busy()).toBe(true);
    expect(onLoaded).not.toHaveBeenCalled();
    advance(1);
    expect(busy()).toBe(false);
    expect(onLoaded).toHaveBeenCalledTimes(1);
  });

  it("shows the default card content", () => {
    renderLoaded();
    expect(screen.getByText("rainy window study mix")).toBeInTheDocument();
    expect(screen.getByText("1 hr 12 min · tape hiss included")).toBeInTheDocument();
    expect(screen.getByText("lofistack radio")).toBeInTheDocument();
    expect(screen.getByText("lo")).toBeInTheDocument();
    expect(screen.getByText("side b · 5 sec preview")).toBeInTheDocument();
  });

  it("uses custom content props and loadMs", () => {
    renderLoaded({ loadMs: 500, title: "snow day", meta: "40 min", station: "kofi fm", initials: "kf", artLabel: "side a" });
    for (const t of ["snow day", "40 min", "kofi fm", "kf", "side a"]) expect(screen.getByText(t)).toBeInTheDocument();
  });

  it("“replay loading” shows the skeleton again and swaps back after loadMs; onLoaded fires each swap", async () => {
    const onLoaded = vi.fn();
    const user = setup();
    renderLoaded({ onLoaded });
    await user.click(screen.getByRole("button", { name: "replay loading" }));
    expect(busy()).toBe(true);
    advance(2200);
    expect(busy()).toBe(false);
    expect(onLoaded).toHaveBeenCalledTimes(2);
  });

  it("showReplay={false} hides the replay button; replayLabel renames it", () => {
    const { unmount } = renderLoaded({ showReplay: false });
    expect(screen.queryByRole("button", { name: "replay loading" })).toBeNull();
    unmount();
    renderLoaded({ replayLabel: "load again" });
    expect(screen.getByRole("button", { name: "load again" })).toBeInTheDocument();
  });

  it("controlled `loading`: no timer, no replay button; onLoaded on each swap to the card", () => {
    const onLoaded = vi.fn();
    const { rerender } = render(<SkeletonLoader loading onLoaded={onLoaded} />);
    advance(10000);
    expect(busy()).toBe(true);
    expect(screen.queryByRole("button", { name: "replay loading" })).toBeNull();
    rerender(<SkeletonLoader loading={false} onLoaded={onLoaded} />);
    expect(busy()).toBe(false);
    expect(screen.getByText("rainy window study mix")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "replay loading" })).toBeNull();
    rerender(<SkeletonLoader loading onLoaded={onLoaded} />);
    expect(busy()).toBe(true);
    rerender(<SkeletonLoader loading={false} onLoaded={onLoaded} />);
    expect(onLoaded).toHaveBeenCalledTimes(2);
  });

  it("custom loadingLabel", () => {
    render(<SkeletonLoader loadingLabel="fetching mix…" />);
    expect(screen.getByText("fetching mix…")).toBeInTheDocument();
  });
});

describe("SkeletonLoader — play button and Web Audio", () => {
  it("without Web Audio the play button is disabled", () => {
    removeAudio();
    renderLoaded();
    expect(screen.getByRole("button", { name: "Play 5-second lofistack radio clip" })).toBeDisabled();
  });

  it("clip={false} hides the play button", () => {
    installAudio();
    renderLoaded({ clip: false });
    expect(screen.queryByRole("button", { name: /Play/ })).toBeNull();
  });

  it("no AudioContext is made until the play button is clicked", () => {
    installAudio();
    renderLoaded();
    expect(FakeAudioContext.made).toHaveLength(0);
  });

  it("play makes one AudioContext and becomes “Stop clip”; stop closes it", async () => {
    installAudio();
    const user = setup();
    renderLoaded();
    await user.click(screen.getByRole("button", { name: "Play 5-second lofistack radio clip" }));
    expect(FakeAudioContext.made).toHaveLength(1);
    const stop = screen.getByRole("button", { name: "Stop clip" });
    expect(stop).toBeEnabled();
    await user.click(stop);
    expect(FakeAudioContext.made[0].closed).toBe(1);
    expect(screen.getByRole("button", { name: "Play 5-second lofistack radio clip" })).toBeInTheDocument();
  });

  it("the clip ends by itself after 5 seconds and closes its AudioContext", async () => {
    installAudio();
    const user = setup();
    renderLoaded();
    await user.click(screen.getByRole("button", { name: "Play 5-second lofistack radio clip" }));
    advance(CLIP_SECONDS * 1000 + 500);
    expect(FakeAudioContext.made[0].closed).toBe(1);
    expect(screen.getByRole("button", { name: "Play 5-second lofistack radio clip" })).toBeInTheDocument();
  });

  it("“replay loading” stops the music", async () => {
    installAudio();
    const user = setup();
    renderLoaded();
    await user.click(screen.getByRole("button", { name: "Play 5-second lofistack radio clip" }));
    await user.click(screen.getByRole("button", { name: "replay loading" }));
    expect(FakeAudioContext.made[0].closed).toBe(1);
  });

  it("unmounting while playing closes the AudioContext and leaves no timers", async () => {
    installAudio();
    const user = setup();
    const { unmount } = renderLoaded();
    await user.click(screen.getByRole("button", { name: "Play 5-second lofistack radio clip" }));
    unmount();
    expect(FakeAudioContext.made[0].closed).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("custom playLabel / stopLabel", async () => {
    installAudio();
    const user = setup();
    renderLoaded({ playLabel: "Play preview", stopLabel: "Stop preview" });
    await user.click(screen.getByRole("button", { name: "Play preview" }));
    expect(screen.getByRole("button", { name: "Stop preview" })).toBeInTheDocument();
  });

  it("buildLofiClip schedules everything inside the 5-second clip", () => {
    const ctx = new FakeAudioContext();
    const out = ctx.destination as unknown as AudioNode;
    const t0 = 1;
    buildLofiClip(ctx as unknown as BaseAudioContext, out, t0);
    expect(scheduled.length).toBeGreaterThan(0);
    for (const s of scheduled) {
      expect(s.when).toBeGreaterThanOrEqual(t0 - 1e-6);
      expect(s.when).toBeLessThanOrEqual(t0 + CLIP_SECONDS + 0.5);
    }
  });
});

describe("SkeletonLoader — cleanup", () => {
  it("unmounting during loading leaves no timers", () => {
    const onLoaded = vi.fn();
    const { unmount } = render(<SkeletonLoader onLoaded={onLoaded} />);
    advance(1000);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    advance(5000);
    expect(onLoaded).not.toHaveBeenCalled();
  });
});
