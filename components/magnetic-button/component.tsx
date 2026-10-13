// Magnetic Hover Button — React + TypeScript + Tailwind CSS.
// The button leans toward a mouse cursor that comes near it and springs back when it leaves.
// Touch, pen and keyboard users get a normal button. Respects "reduce motion".
import { useEffect, useRef, type ButtonHTMLAttributes, type PointerEvent, type ReactNode } from "react";

export interface MagneticButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** What the button says. */
  children: ReactNode;
  /** How far the button follows the cursor, as a share (0–1) of the cursor's distance from its centre. Default 0.35 */
  pull?: number;
  /** How much further the label travels than the button (0–1), for a sense of depth. Default 0.2 */
  labelPull?: number;
  /** How far past the button's edges the pull reaches, in px. Default 60 */
  radius?: number;
  /** Shows a spinner, sets aria-busy and blocks clicks. Default false */
  loading?: boolean;
  /** "solid" = amber pill, "outline" = amber border on dark. Default "solid" */
  variant?: "solid" | "outline";
}

const FAST = "translate 120ms cubic-bezier(0.22, 1, 0.36, 1)"; // while being pulled
const SPRING = "translate 480ms cubic-bezier(0.34, 1.8, 0.4, 1)"; // overshoot = bounce back

const VARIANTS = {
  solid:
    "bg-[#e0985f] text-[#16130f] shadow-[0_8px_24px_-12px_rgba(224,152,95,0.7)] hover:bg-[#f3b983] disabled:shadow-none disabled:hover:bg-[#e0985f]",
  outline:
    "border border-[#e0985f] bg-transparent text-[#e0985f] hover:bg-[#e0985f]/12 disabled:hover:bg-transparent",
} as const;

export default function MagneticButton({
  children,
  pull = 0.35,
  labelPull = 0.2,
  radius = 60,
  loading = false,
  variant = "solid",
  disabled = false,
  type = "button",
  className = "",
  ...buttonProps
}: MagneticButtonProps) {
  const mover = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const inactive = disabled || loading;

  // Write straight to the elements (no React re-render on every mouse move).
  const place = (x: number, y: number, attracted: boolean) => {
    const m = mover.current;
    const l = label.current;
    if (!m || !l) return;
    m.style.transition = l.style.transition = attracted ? FAST : SPRING;
    m.style.translate = `${x}px ${y}px`;
    const extra = pull > 0 ? labelPull / pull : 0;
    l.style.translate = `${x * extra}px ${y * extra}px`;
  };

  // A button that becomes disabled or busy while pulled springs back to rest.
  useEffect(() => {
    if (inactive) place(0, 0, false);
  });

  const onPointerMove = (e: PointerEvent<HTMLSpanElement>) => {
    if (e.pointerType !== "mouse" || inactive) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const r = (mover.current?.firstElementChild ?? e.currentTarget).getBoundingClientRect();
    const t = mover.current?.style.translate.split(" ").map(parseFloat) ?? [];
    // measure from where the button sits at rest, not where it has been pulled to
    const cx = r.left - (t[0] || 0) + r.width / 2;
    const cy = r.top - (t[1] || 0) + r.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    // distance from the button's EDGE, so wide buttons feel as magnetic as round ones
    const ex = Math.max(Math.abs(dx) - r.width / 2, 0);
    const ey = Math.max(Math.abs(dy) - r.height / 2, 0);
    if (Math.hypot(ex, ey) < radius) place(dx * pull, dy * pull, true);
    else place(0, 0, false);
  };

  return (
    <span
      className="inline-block"
      style={{ padding: radius, margin: -radius }}
      onPointerMove={onPointerMove}
      onPointerLeave={() => place(0, 0, false)}
    >
      <span ref={mover} className="inline-block will-change-[translate]">
        <button
          type={type}
          disabled={inactive}
          aria-busy={loading || undefined}
          className={`relative inline-flex cursor-pointer items-center justify-center rounded-full px-7 py-3 font-sans text-[15px] leading-tight font-medium transition-[background-color,scale,opacity] duration-150 select-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-4 focus-visible:outline-[#e0985f] active:scale-[0.96] disabled:cursor-not-allowed disabled:active:scale-100 ${
            disabled ? "opacity-45" : ""
          } ${loading ? "cursor-progress" : ""} ${VARIANTS[variant]} ${className}`}
          {...buttonProps}
        >
          <span ref={label} className={`inline-flex items-center gap-2 ${loading ? "opacity-0" : ""}`}>
            {children}
          </span>
          {loading && (
            <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </span>
          )}
        </button>
      </span>
    </span>
  );
}
