// 3D Tilt Profile Card — React + TypeScript + Tailwind CSS.
// The card tilts toward the pointer (mouse, pen or finger) with a warm glare and layers at
// different depths, then springs back flat. Respects "reduce motion".
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";

export interface ProfileStat {
  /** Small caption under the number, e.g. "components". */
  label: string;
  /** The number (or short text) shown large. */
  value: string | number;
}

export interface TiltProfileCardProps {
  /** Person's full name (the card's heading). Default "Md Asif-Ud-Doula" */
  name?: string;
  /** Job title under the name. Default "Senior Automation Engineer L4" */
  role?: string;
  /** Team tags shown as small pills. An empty list hides the row. Default ["Service Team Lead", "Operation Team", "Client Acquisition"] */
  tags?: string[];
  /** Numbers along the bottom (one column each). An empty list hides the row. Default 30 components · 13 agent logs · 90 days */
  stats?: ProfileStat[];
  /** Letters in the avatar. Default: first letters of the first two words of `name`, skipping a leading "Md"/"Mr"/"Ms"/"Dr" */
  initials?: string;
  /** Accessible name of the card. Default "Profile card: " + name */
  label?: string;
  /** Accessible name of the tag list. Default "Teams" */
  tagsLabel?: string;
  /** Tilt in degrees when the pointer is at the card's edge. Default 14 */
  maxTilt?: number;
  /** 3D perspective distance in px (smaller = stronger depth). Default 900 */
  perspective?: number;
  /** How quickly the tilt follows the pointer, in ms. Default 90 */
  followMs?: number;
  /** How long the spring back to flat takes, in ms (with a slight overshoot). Default 600 */
  springMs?: number;
  /** Card width in px (it never grows wider than its container). Default 300 */
  width?: number;
  /** Controlled follow state. Leave undefined to let the card keep its own. Default undefined */
  followed?: boolean;
  /** Starting follow state when uncontrolled. Default false */
  defaultFollowed?: boolean;
  /** Called with the new state when the button is pressed. Default undefined */
  onFollowChange?: (followed: boolean) => void;
  /** Button text when not following. Default "Follow" */
  followLabel?: string;
  /** Button text when following. Default "Following" */
  followingLabel?: string;
  /** Shows a spinner on the button and ignores presses (e.g. while saving). Default false */
  followLoading?: boolean;
  /** Disables the button. Default false */
  followDisabled?: boolean;
}

/** "Md Asif-Ud-Doula" → "AU": first letters of the first two words, skipping a title like "Md". */
export function getInitials(name: string): string {
  return name
    .replace(/^(md\.?|mr\.?|ms\.?|dr\.?)\s+/i, "")
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const DEFAULT_TAGS = ["Service Team Lead", "Operation Team", "Client Acquisition"];
const DEFAULT_STATS: ProfileStat[] = [
  { label: "components", value: "30" },
  { label: "agent logs", value: "13" },
  { label: "days", value: "90" },
];

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export default function TiltProfileCard({
  name = "Md Asif-Ud-Doula",
  role = "Senior Automation Engineer L4",
  tags = DEFAULT_TAGS,
  stats = DEFAULT_STATS,
  initials,
  label,
  tagsLabel = "Teams",
  maxTilt = 14,
  perspective = 900,
  followMs = 90,
  springMs = 600,
  width = 300,
  followed,
  defaultFollowed = false,
  onFollowChange,
  followLabel = "Follow",
  followingLabel = "Following",
  followLoading = false,
  followDisabled = false,
}: TiltProfileCardProps) {
  const card = useRef<HTMLElement>(null);
  const frame = useRef(0);
  const [ownFollowed, setOwnFollowed] = useState(defaultFollowed);
  const isFollowed = followed ?? ownFollowed;

  // Write straight to CSS variables on the card: no React re-render on pointer moves.
  const setVars = (rx: number, ry: number, gx: number, gy: number, glare: number) => {
    const s = card.current?.style;
    if (!s) return;
    s.setProperty("--rx", `${rx}deg`);
    s.setProperty("--ry", `${ry}deg`);
    s.setProperty("--gx", `${gx}%`);
    s.setProperty("--gy", `${gy}%`);
    s.setProperty("--glare", `${glare}`);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reducedMotion() || !card.current) return;
    // Measure the flat wrapper, not the tilted card, so the tilt doesn't feed back into itself.
    const r = e.currentTarget.getBoundingClientRect();
    const px = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1); // 0 = left, 1 = right
    const py = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1); // 0 = top, 1 = bottom
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() =>
      setVars((0.5 - py) * 2 * maxTilt, (px - 0.5) * 2 * maxTilt, px * 100, py * 100, 1),
    );
    // data-tilting switches to the fast follow transition and the lifted shadow.
    card.current.setAttribute("data-tilting", "");
  };

  const reset = () => {
    cancelAnimationFrame(frame.current);
    card.current?.removeAttribute("data-tilting");
    setVars(0, 0, 50, 50, 0); // the slow transition with overshoot makes this a spring
  };

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const toggleFollow = () => {
    if (followLoading) return;
    const next = !isFollowed;
    if (followed === undefined) setOwnFollowed(next);
    onFollowChange?.(next);
  };

  const sizing = {
    perspective: `${perspective}px`,
    maxWidth: width,
    "--ls-tilt-follow": `${followMs}ms`,
    "--ls-tilt-spring": `${springMs}ms`,
  } as CSSProperties;

  return (
    // Pointer events live on this flat wrapper, not on the tilted card: a tilted edge pulls away
    // from under a pointer resting near it, which would fire "leave" and make the card flicker.
    // touch-none keeps a finger drag on the card for tilting instead of scrolling the page.
    <div
      className="w-full touch-none"
      style={sizing}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      onPointerUp={(e) => e.pointerType !== "mouse" && reset()}
      onPointerCancel={reset}
    >
      <article
        ref={card}
        aria-label={label ?? `Profile card: ${name}`}
        className="relative box-border w-full rounded-[18px] border border-[#37302a] bg-[linear-gradient(155deg,#2c251c_0%,#1f1b16_60%,#1a1612_100%)] px-6 pt-7 pb-[22px] font-sans text-[#ece4d6] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.8)] select-none transform-3d [--glare:0] [--gx:50%] [--gy:50%] [--rx:0deg] [--ry:0deg] [transform:rotateX(var(--rx))_rotateY(var(--ry))] [transition:transform_var(--ls-tilt-spring)_cubic-bezier(0.34,1.56,0.64,1),box-shadow_var(--ls-tilt-spring)_ease] data-tilting:shadow-[0_30px_60px_-28px_rgba(0,0,0,0.9),0_0_0_1px_rgba(224,152,95,0.25)] data-tilting:[transition:transform_var(--ls-tilt-follow)_ease-out,box-shadow_200ms_ease] motion-reduce:[transform:none] motion-reduce:[transition:none]"
      >
        {/* soft warm light that follows the pointer */}
        <span
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_var(--gx)_var(--gy),rgba(255,236,210,0.16),transparent_55%)] opacity-(--glare) transition-opacity duration-300 motion-reduce:hidden"
          aria-hidden="true"
        />
        {/* each layer floats at its own depth (translate-z) for a parallax feel */}
        <div
          className="mb-4 flex size-[72px] translate-z-[50px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#f3b983,#e0985f_45%,#a8612f)] text-2xl font-semibold tracking-[0.02em] text-[#16130f] shadow-[0_10px_24px_-10px_rgba(224,152,95,0.7)]"
          aria-hidden="true"
        >
          {initials ?? getInitials(name)}
        </div>
        <h3 className="m-0 translate-z-[40px] text-lg leading-[1.25] font-semibold">{name}</h3>
        <p className="m-0 mt-1 translate-z-[30px] font-mono text-xs text-[#a2977f]">{role}</p>
        {tags.length > 0 && (
          <ul className="m-0 mt-4 flex translate-z-[25px] list-none flex-wrap gap-1.5 p-0" aria-label={tagsLabel}>
            {tags.map((t) => (
              <li key={t} className="rounded-full bg-[#e0985f]/12 px-[9px] py-[3px] font-mono text-[10.5px] text-[#e0985f]">
                {t}
              </li>
            ))}
          </ul>
        )}
        {stats.length > 0 && (
          <dl className="m-0 mt-5 grid translate-z-[20px] auto-cols-fr grid-flow-col gap-2 border-t border-[#37302a] pt-3.5">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col gap-0.5">
                {/* dt comes first for screen readers; `order` shows the number on top */}
                <dt className="order-2 text-[11px] text-[#a2977f]">{s.label}</dt>
                <dd className="order-1 m-0 text-base font-semibold">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <button
          type="button"
          aria-pressed={isFollowed}
          aria-busy={followLoading || undefined}
          aria-disabled={followLoading || undefined}
          disabled={followDisabled}
          onClick={toggleFollow}
          className={`relative mt-[18px] flex w-full translate-z-[35px] cursor-pointer items-center justify-center rounded-full border border-[#e0985f] px-4 py-2.5 font-sans text-sm leading-[normal] font-medium transition-[background-color,border-color,color,scale] duration-160 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#e0985f] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 motion-reduce:transition-none ${
            isFollowed
              ? "bg-transparent text-[#e0985f] hover:bg-[#e0985f]/12 disabled:hover:bg-transparent"
              : "bg-[#e0985f] text-[#16130f] hover:border-[#f3b983] hover:bg-[#f3b983] disabled:hover:border-[#e0985f] disabled:hover:bg-[#e0985f]"
          } ${followLoading ? "cursor-progress active:scale-100" : ""}`}
        >
          <span className={followLoading ? "opacity-0" : ""}>{isFollowed ? followingLabel : followLabel}</span>
          {followLoading && (
            <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </span>
          )}
        </button>
      </article>
    </div>
  );
}
