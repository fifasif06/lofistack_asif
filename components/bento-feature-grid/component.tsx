// Bento Feature Grid — React + TypeScript + Tailwind CSS.
// A feature section (eyebrow, heading, subheading) over a grid of mixed-size tiles that reflows to the
// space it's given. Tiles lift and catch a pointer-following spotlight, and fade up the first time they're seen.
import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from "react";

/** Tile shape: "sm" 1×1 · "wide" 2×1 · "tall" 1×2 · "lg" 2×2 (columns × rows). */
export type BentoSize = "sm" | "wide" | "tall" | "lg";

export interface BentoItem {
  /** Stable, unique key for the tile. Required */
  id: string;
  /** Tile title (an h3). Required */
  title: string;
  /** One or two short sentences under the title (clamped to 3 lines). Required */
  description: string;
  /** Tile shape. Default "sm" */
  size?: BentoSize;
  /** Small icon shown in an amber chip at the top-left (sized to 16 px). Default none */
  icon?: ReactNode;
  /** Decorative picture that fills the free space above the title; hidden from screen readers. Default none */
  visual?: ReactNode;
  /** Makes the whole tile a link to this address. Default none (plain tile) */
  href?: string;
  /** Short label pinned to the top-right corner, e.g. "new". Default none */
  badge?: string;
}

export interface BentoFeatureGridProps {
  /** Small amber label above the heading. Default none */
  eyebrow?: string;
  /** Section heading, rendered as an h2. Required */
  heading: ReactNode;
  /** Muted line under the heading. Default none */
  subheading?: ReactNode;
  /** The tiles, in reading order (gaps are back-filled automatically). Required */
  items: BentoItem[];
  /** Height of one grid row in px (tall and lg tiles span two rows plus the gap). Default 168 */
  rowHeight?: number;
  /** Fade tiles up when the section first scrolls into view. Default true */
  reveal?: boolean;
  /** Delay between one tile's reveal and the next, in ms. Default 70 */
  stagger?: number;
  /** Extra classes for the section. Default "" */
  className?: string;
}

// Spans only kick in from 2 columns up: a col-span-2 tile in a 1-column grid would add a phantom column.
// "lg" keeps two rows on phones (it's the hero); "tall" goes back to one row there.
const SPANS: Record<BentoSize, string> = {
  sm: "",
  wide: "@lg:col-span-2",
  tall: "@lg:row-span-2",
  lg: "row-span-2 @lg:col-span-2",
};

export default function BentoFeatureGrid({
  eyebrow,
  heading,
  subheading,
  items,
  rowHeight = 168,
  reveal = true,
  stagger = 70,
  className = "",
}: BentoFeatureGridProps) {
  const root = useRef<HTMLElement>(null);
  const uid = useId();
  const [shown, setShown] = useState(!reveal);

  // Reveal once, the first time the section's top edge passes 85 % of the viewport. rootMargin instead of a
  // ratio threshold, so a section taller than the screen still triggers.
  useEffect(() => {
    if (!reveal) return;
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reveal]);

  const visible = shown || !reveal;

  return (
    <section
      ref={root}
      aria-labelledby={`${uid}-h`}
      // keyboard users can reach a link tile before it has been revealed: show everything right away
      onFocus={() => setShown(true)}
      className={`@container font-sans text-[#ece4d6] ${className}`}
    >
      {eyebrow && (
        <p className="font-mono text-[11px]/4 tracking-[0.2em] text-[#e0985f] uppercase">{eyebrow}</p>
      )}
      <h2
        id={`${uid}-h`}
        className="mt-3 text-[24px]/[30px] font-semibold tracking-[-0.01em] first:mt-0 @lg:text-[28px]/[34px]"
      >
        {heading}
      </h2>
      {subheading && <p className="mt-3 max-w-[480px] text-[15px]/6 text-[#a2977f]">{subheading}</p>}

      <ul
        role="list"
        className="mt-6 grid grid-flow-row-dense grid-cols-1 gap-3 @lg:mt-8 @lg:grid-cols-2 @3xl:grid-cols-4"
        style={{ gridAutoRows: `${rowHeight}px` }}
      >
        {items.map((item, i) => (
          <li
            key={item.id}
            className={`${SPANS[item.size ?? "sm"]} transition-[opacity,translate] duration-500 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
              visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
            style={{ transitionDelay: visible && reveal ? `${i * stagger}ms` : undefined }}
          >
            <Tile item={item} uid={`${uid}-${i}`} />
          </li>
        ))}
      </ul>
    </section>
  );
}

const TILE =
  "group/tile relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#37302a] bg-[#282219] p-5 transition-[translate,scale,border-color,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:border-[#e0985f]/45 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)] motion-reduce:transition-none motion-reduce:hover:translate-y-0";
// No `outline-none` here: in Tailwind v4 it sets --tw-outline-style to none, which the focus-visible
// outline then inherits, so the ring would never show.
const LINK =
  "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0985f] active:translate-y-0 active:scale-[0.99]";

// Spotlight position goes straight into CSS variables: no React render per pointer move.
function moveSpotlight(e: PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--ls-x", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--ls-y", `${e.clientY - r.top}px`);
}

function Tile({ item, uid }: { item: BentoItem; uid: string }) {
  const body = (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(260px_circle_at_var(--ls-x,50%)_var(--ls-y,0%),rgba(224,152,95,0.10),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover/tile:opacity-100 motion-reduce:hidden"
      />
      {item.badge && (
        <span
          id={`${uid}-b`}
          className="absolute top-4 right-4 z-10 rounded-full bg-[#e0985f]/12 px-2 py-0.5 font-mono text-[10px]/[14px] tracking-[0.12em] text-[#e0985f] uppercase"
        >
          {item.badge}
        </span>
      )}
      {/* relative = painted above the spotlight layer */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        {item.icon && (
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#e0985f]/12 text-[#e0985f] [&_svg]:size-4"
          >
            {item.icon}
          </span>
        )}
        {item.visual && (
          <div aria-hidden="true" className={`flex min-h-0 flex-1 flex-col ${item.icon ? "mt-4" : ""}`}>
            {item.visual}
          </div>
        )}
        <div className={item.visual ? "mt-4" : "mt-auto"}>
          <h3 id={`${uid}-t`} className="flex items-center gap-1.5 text-[15px]/5 font-medium text-[#ece4d6]">
            {item.title}
            {item.href && (
              <svg
                aria-hidden="true"
                viewBox="0 0 14 14"
                className="size-3.5 shrink-0 text-[#e0985f] transition-transform duration-200 group-hover/tile:translate-x-0.5 motion-reduce:transition-none"
              >
                <path d="M2 7h10M8 3l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </h3>
          <p id={`${uid}-d`} className="mt-1 line-clamp-3 text-[13px]/[18px] text-[#a2977f]">
            {item.description}
          </p>
        </div>
      </div>
    </>
  );

  if (item.href) {
    return (
      <a
        href={item.href}
        // name = title (+ badge), description = the body text; the visual stays out of it
        aria-labelledby={`${uid}-t${item.badge ? ` ${uid}-b` : ""}`}
        aria-describedby={`${uid}-d`}
        onPointerMove={moveSpotlight}
        className={`${TILE} ${LINK}`}
      >
        {body}
      </a>
    );
  }
  return (
    <div onPointerMove={moveSpotlight} className={TILE}>
      {body}
    </div>
  );
}
