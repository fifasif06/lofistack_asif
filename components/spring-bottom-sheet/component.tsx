// Spring Bottom Sheet — React + TypeScript + Tailwind CSS.
// A modal sheet that springs up from the bottom of the screen, snaps to set heights and can be
// dragged by its handle or header (flick it down to close). Real spring physics, no libraries.
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export interface SpringBottomSheetProps {
  /** Whether the sheet is open. The sheet animates in when this turns true and out when it turns false. */
  open: boolean;
  /** Called when the sheet asks to close: Escape, the close button, the backdrop, or a drag/flick down. Set `open` to false in it. */
  onClose: () => void;
  /** Heading at the top of the sheet; also the dialog's accessible name. */
  title: ReactNode;
  /** Optional short line under the title, linked with aria-describedby. Default: none */
  description?: ReactNode;
  /** The sheet's content. It scrolls on its own inside the sheet. */
  children: ReactNode;
  /** Optional content pinned to the bottom of the sheet (e.g. action buttons). Default: none */
  footer?: ReactNode;
  /** Heights the sheet rests at, as fractions of the viewport height, lowest first. Default [0.5, 0.92] */
  snapPoints?: number[];
  /** Index in `snapPoints` the sheet opens to. Default 0 */
  initialSnap?: number;
  /** Called with the new index whenever the sheet moves to a different snap point. Default: none */
  onSnapChange?: (index: number) => void;
  /** Close when the dimmed backdrop is clicked. Default true */
  closeOnBackdrop?: boolean;
  /** How far below the lowest snap point (as a share of that height) a released drag must end to close the sheet. Default 0.25 */
  closeThreshold?: number;
  /** A downward release faster than this (px per second) closes the sheet. Default 1200 */
  flickVelocity?: number;
  /** Spring stiffness: higher = snappier. Default 380 */
  stiffness?: number;
  /** Spring damping: lower = more bounce (30 with the other defaults gives a small, visible overshoot). Default 30 */
  damping?: number;
  /** Spring mass: higher = heavier and slower. Default 1 */
  mass?: number;
  /** Length of the fade (ms) used instead of the spring when "reduce motion" is on. Default 160 */
  fadeDuration?: number;
  /** Accessible label of the close (×) button. Default "Close" */
  closeLabel?: string;
  /** Accessible label of the grab handle button. Default "Resize sheet" */
  handleLabel?: string;
}

// Internal tuning (not worth a prop): how the release is read and where the closing spring aims.
const TAP_SLOP = 3; // px a pointer may wobble before a press counts as a drag
const VELOCITY_WINDOW = 100; // ms of pointer history used for the release speed
const PROJECT_SECONDS = 0.2; // how far ahead (in time) the release velocity is projected
const EXIT_PAST = 40; // px past the screen edge the closing spring aims, so it leaves at speed
const STEP = 1 / 240; // fixed physics step (s); small steps keep the spring stable at any frame rate
const REST_SPEED = 4; // px/s
const REST_DISTANCE = 0.5; // px

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export default function SpringBottomSheet(props: SpringBottomSheetProps) {
  // Stay mounted after `open` turns false until the sheet has left the screen.
  const [mounted, setMounted] = useState(props.open);
  if (props.open && !mounted) setMounted(true);

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(<Sheet {...props} onExited={() => setMounted(false)} />, document.body);
}

type Phase = "open" | "closing";

function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  snapPoints = [0.5, 0.92],
  initialSnap = 0,
  onSnapChange,
  closeOnBackdrop = true,
  closeThreshold = 0.25,
  flickVelocity = 1200,
  stiffness = 380,
  damping = 30,
  mass = 1,
  fadeDuration = 160,
  closeLabel = "Close",
  handleLabel = "Resize sheet",
  onExited,
}: SpringBottomSheetProps & { onExited: () => void }) {
  const titleId = useId();
  const descId = useId();
  const root = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLButtonElement>(null);

  // Latest props for rAF loops and listeners, so they never run with stale values.
  const live = useRef({ snapPoints, stiffness, damping, mass, fadeDuration, onClose, onSnapChange, onExited });
  useLayoutEffect(() => {
    live.current = { snapPoints, stiffness, damping, mass, fadeDuration, onClose, onSnapChange, onExited };
  });

  // Physics state lives in a ref: it changes every frame and must not re-render React.
  // h = how much of the sheet shows above the bottom edge (px), v = its speed (px/s, + is up).
  const sim = useRef({
    h: 0,
    v: 0,
    snap: Math.min(Math.max(initialSnap, 0), snapPoints.length - 1),
    phase: "open" as Phase,
    raf: 0,
    last: 0,
    fadeTimer: 0,
  });
  const drag = useRef<{ id: number; startY: number; startH: number; moved: boolean; samples: { t: number; y: number }[] } | null>(null);
  const dragged = useRef(false); // true right after a drag, so the click that follows is ignored

  const heights = () => {
    const vh = window.innerHeight;
    return live.current.snapPoints.map((p) => Math.min(Math.max(p, 0.05), 1) * vh);
  };
  const snapIndex = (i: number) => Math.min(Math.max(i, 0), live.current.snapPoints.length - 1);
  const snapHeight = () => heights()[snapIndex(sim.current.snap)]; // clamped: snapPoints may change while open

  // Draw position h. Above the lowest snap the sheet grows taller (so the footer stays on screen);
  // below it the sheet slides down. The backdrop fades with how far the sheet is up.
  const paint = (h: number) => {
    const el = sheet.current;
    const bd = backdrop.current;
    if (!el || !bd) return;
    const hs = heights();
    const low = Math.min(...hs);
    const shown = Math.min(h, window.innerHeight);
    el.style.height = `${Math.max(shown, low)}px`;
    el.style.transform = `translate3d(0, ${Math.max(0, low - shown)}px, 0)`;
    bd.style.opacity = String(Math.min(1, Math.max(0, h / low)));
  };

  const stop = () => {
    cancelAnimationFrame(sim.current.raf);
    sim.current.raf = 0;
  };

  const finishClose = () => {
    stop();
    live.current.onExited();
  };

  // Run the damped spring toward the current target until it rests (or, when closing, leaves the screen).
  const run = () => {
    const s = sim.current;
    if (reducedMotion()) {
      // No spring: jump straight to the end; the root's opacity fade does the visual work.
      stop();
      s.v = 0;
      if (s.phase === "closing") {
        if (root.current) root.current.style.opacity = "0";
        window.clearTimeout(s.fadeTimer);
        s.fadeTimer = window.setTimeout(finishClose, live.current.fadeDuration);
      } else {
        s.h = snapHeight();
        paint(s.h);
      }
      return;
    }
    if (s.raf) return;
    s.last = performance.now();
    const tick = (now: number) => {
      const { stiffness: k, damping: c, mass: m } = live.current;
      const target = s.phase === "closing" ? -EXIT_PAST : snapHeight();
      const dt = Math.min(Math.max((now - s.last) / 1000, 0), 0.064); // cap: tab switches give huge gaps
      s.last = now;
      const n = Math.ceil(dt / STEP);
      for (let i = 0; i < n; i++) {
        // semi-implicit Euler: update speed from the spring + damper force, then position
        const a = (-k * (s.h - target) - c * s.v) / m;
        s.v += a * (dt / n);
        s.h += s.v * (dt / n);
      }
      if (s.phase === "closing" && s.h <= 0) {
        s.h = 0;
        paint(0);
        finishClose(); // fully off screen: unmount
        return;
      }
      if (Math.abs(s.v) < REST_SPEED && Math.abs(s.h - target) < REST_DISTANCE) {
        s.h = target;
        s.v = 0;
        paint(s.h);
        s.raf = 0;
        return;
      }
      paint(s.h);
      s.raf = requestAnimationFrame(tick);
    };
    s.raf = requestAnimationFrame(tick);
  };

  const goTo = (i: number) => {
    const s = sim.current;
    const next = snapIndex(i);
    if (next !== s.snap) live.current.onSnapChange?.(next);
    s.snap = next;
    run();
  };

  // Mount: start fully below the screen (before the first paint), then spring up.
  useLayoutEffect(() => {
    const s = sim.current;
    if (reducedMotion() && root.current && s.h === 0) {
      // No slide: appear at the snap point and fade the whole layer in instead.
      s.h = snapHeight();
      const r = root.current;
      r.style.opacity = "0";
      void r.offsetHeight; // commit opacity 0 first so the change to 1 fades
      r.style.opacity = "1";
    }
    paint(s.h);
  }, []);

  // Open / close as the `open` prop changes (also handles re-opening while closing).
  useEffect(() => {
    const s = sim.current;
    s.phase = open ? "open" : "closing";
    if (open) {
      window.clearTimeout(s.fadeTimer);
      if (root.current) root.current.style.opacity = "1";
    }
    run();
    return () => {
      stop();
      window.clearTimeout(s.fadeTimer);
    };
  }, [open]);

  // Lock page scroll while the sheet is mounted; pad for the vanished scrollbar so nothing jumps.
  useEffect(() => {
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbar > 0) body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + scrollbar}px`;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, []);

  // Keep the sheet sized to the viewport (phones change height when the URL bar hides).
  useEffect(() => {
    const onResize = () => {
      if (!sim.current.raf && !drag.current && sim.current.phase === "open") {
        sim.current.h = snapHeight();
      }
      paint(sim.current.h);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // While open: focus moves in, Tab is trapped, Escape closes; focus goes back when it closes.
  useEffect(() => {
    if (!open) return;
    const el = sheet.current;
    if (!el) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!el.contains(document.activeElement)) el.focus({ preventScroll: true });

    const focusables = () =>
      Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.getClientRects().length > 0);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.isComposing) {
        e.preventDefault();
        live.current.onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      const active = document.activeElement;
      if (items.length === 0) {
        e.preventDefault();
        el.focus({ preventScroll: true });
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (active === first || active === el || !el.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !el.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    // Catch focus that lands outside some other way (e.g. a script or a screen reader jump).
    const onFocusIn = (e: FocusEvent) => {
      if (e.target instanceof Node && !el.contains(e.target)) el.focus({ preventScroll: true });
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      if (opener?.isConnected && (el.contains(document.activeElement) || document.activeElement === document.body)) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [open]);

  // ——— dragging (handle + header only) ———
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !e.isPrimary || sim.current.phase === "closing") return;
    const target = e.target instanceof Element ? e.target : null;
    const onHandle = !!target && !!handle.current?.contains(target);
    // Let the close button (and anything else clickable in the header) behave normally.
    if (!onHandle && target?.closest("button, a, input, select, textarea")) return;
    stop(); // grab the sheet mid-flight: it follows the pointer from where it is now
    sim.current.v = 0;
    dragged.current = false;
    drag.current = { id: e.pointerId, startY: e.clientY, startH: sim.current.h, moved: false, samples: [{ t: e.timeStamp, y: e.clientY }] };
    // Capture on the element pressed, so a plain tap on the handle still fires its click.
    (onHandle && handle.current ? handle.current : e.currentTarget).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.abs(dy) < TAP_SLOP) return;
    d.moved = true;
    d.samples.push({ t: e.timeStamp, y: e.clientY });
    while (d.samples.length > 2 && e.timeStamp - d.samples[0].t > VELOCITY_WINDOW) d.samples.shift();

    const hs = heights();
    const top = Math.max(...hs);
    let h = d.startH - dy;
    if (h > top) {
      // Rubber band: past the highest point the sheet resists more and more, never leaving the screen.
      const room = Math.max(window.innerHeight - top, 0);
      const over = h - top;
      h = top + (room > 0 ? (over * room) / (over + room) : 0);
    }
    sim.current.h = Math.max(h, 0);
    paint(sim.current.h);
  };

  const release = (e: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) return; // a tap: the handle's click (if any) handles it
    dragged.current = true;

    // Release speed from the last ~100ms of movement (px/s, + = upward).
    const recent = d.samples.filter((p) => e.timeStamp - p.t <= VELOCITY_WINDOW);
    let v = 0;
    if (!cancelled && recent.length >= 2) {
      const a = recent[0];
      const b = recent[recent.length - 1];
      if (b.t > a.t) v = ((a.y - b.y) / (b.t - a.t)) * 1000;
    }
    const s = sim.current;
    const hs = heights();
    const low = Math.min(...hs);
    const projected = s.h + v * PROJECT_SECONDS;
    s.v = v; // the spring carries on with the hand's speed, so the hand-off feels seamless
    if (v < -flickVelocity || projected < low * (1 - closeThreshold)) {
      live.current.onClose();
      // If the parent keeps it open after all, spring back next frame (cancelled if it does close).
      s.raf = requestAnimationFrame(() => {
        s.raf = 0;
        if (s.phase === "open") run();
      });
      return;
    }
    let best = 0;
    hs.forEach((hh, i) => {
      if (Math.abs(hh - projected) < Math.abs(hs[best] - projected)) best = i;
    });
    goTo(best);
  };

  // Handle: a tap / Enter / Space cycles snap points, arrows move one step up or down.
  const onHandleClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    if (e.detail > 0 && dragged.current) return; // the click that ends a drag (keyboard clicks have detail 0)
    goTo((sim.current.snap + 1) % live.current.snapPoints.length);
  };
  const onHandleKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    goTo(sim.current.snap + (e.key === "ArrowUp" ? 1 : -1));
  };

  return (
    <div
      ref={root}
      className={`fixed inset-0 z-[1000] font-sans transition-opacity ease-out ${open ? "" : "pointer-events-none"}`}
      style={{ transitionDuration: `${fadeDuration}ms` }}
    >
      <div
        ref={backdrop}
        aria-hidden="true"
        className="absolute inset-0 touch-none overscroll-contain bg-[#0b0907]/70"
        onClick={() => closeOnBackdrop && live.current.onClose()}
      />
      <div
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-[480px] flex-col overflow-hidden rounded-t-[20px] border border-b-0 border-[#37302a] bg-[#282219] text-[#ece4d6] shadow-[0_-16px_48px_-12px_rgba(0,0,0,0.6)] outline-none will-change-transform"
      >
        {/* drag area: touch-action none here only, so the content below still scrolls by touch */}
        <div
          className="shrink-0 cursor-grab touch-none px-5 pt-2 pb-3 select-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => release(e, false)}
          onPointerCancel={(e) => release(e, true)}
          onLostPointerCapture={(e) => release(e, true)}
        >
          <div className="flex justify-center">
            <button
              ref={handle}
              type="button"
              aria-label={handleLabel}
              onClick={onHandleClick}
              onKeyDown={onHandleKeyDown}
              className="group flex h-6 w-16 cursor-grab items-center justify-center rounded-full outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-[#e0985f] active:cursor-grabbing"
            >
              <span className="h-1.5 w-10 rounded-full bg-[#4a4037] transition-[background-color,width] duration-150 group-hover:bg-[#a2977f] group-focus-visible:bg-[#a2977f] group-active:w-12 group-active:bg-[#e0985f]" />
            </button>
          </div>
          <div className="mt-1 flex items-start gap-3">
            <div className="min-w-0 flex-1 pt-1">
              <h2 id={titleId} className="m-0 text-[17px] leading-snug font-semibold text-balance">
                {title}
              </h2>
              {description && (
                <p id={descId} className="m-0 mt-0.5 text-[13px] leading-snug text-[#a2977f]">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              aria-label={closeLabel}
              onClick={() => live.current.onClose()}
              className="-mr-1.5 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#a2977f] transition-[background-color,color,scale] duration-150 outline-none hover:bg-[#37302a] hover:text-[#ece4d6] focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-[#e0985f] active:scale-90"
            >
              <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* content keeps its own scroll; overscroll-contain stops it from scrolling the page */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-[#37302a] px-2 py-2 [scrollbar-color:#4a4037_transparent] [scrollbar-width:thin]">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-[#37302a] px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
