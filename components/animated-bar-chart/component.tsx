// Animated Bar Chart — React + TypeScript + Tailwind CSS.
// A column chart whose bars grow up from zero (with a short stagger) the first time it scrolls into view,
// then glide to new heights when the data changes. Keyboard and screen-reader friendly; respects "reduce motion".
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export interface BarDatum {
  /** Category name shown under the bar and used in its accessible name, e.g. "Wed". */
  label: string;
  /** The bar's value (0 or more). */
  value: number;
  /** Shorter label shown when the chart is narrow (under 28rem). Default: label */
  shortLabel?: string;
}

export interface AnimatedBarChartProps {
  /** One entry per bar, in display order. An empty array shows the empty state. */
  data: BarDatum[];
  /** Chart title, shown above the plot; it also names the figure for screen readers. */
  title: string;
  /** One line under the title. Default: none */
  description?: string;
  /** Top of the value scale. Default: a nice rounded number at or just above the largest value */
  max?: number;
  /** Roughly how many gridline steps above zero. Default 4 */
  tickCount?: number;
  /** Formats tick labels, the value above each bar, the tooltip and the hidden table. Default: the number with thousands separators */
  formatValue?: (n: number) => string;
  /** Plot height in px (value labels and day labels sit outside it). Default 220 */
  height?: number;
  /** Unit after values in the tooltip and accessible names, also shown above the axis, e.g. "minutes". Default: none */
  unit?: string;
  /** Paint the largest bar(s) amber and the rest a quiet taupe. Default false */
  highlightMax?: boolean;
  /** Grow-in and data-change animation. Always off when the user prefers reduced motion. Default true */
  animate?: boolean;
  /** Length of one bar's grow or resize animation, in ms. Default 700 */
  duration?: number;
  /** Delay between bars during the first grow-in, in ms. Default 70 */
  stagger?: number;
  /** Widest a bar may get, in px (narrow charts shrink bars to fit). Default 24 */
  barWidth?: number;
  /** Shown instead of the plot when `data` is empty. Default "No data to show yet." */
  emptyMessage?: ReactNode;
  /** Header of the label column in the screen-reader table. Default "Category" */
  categoryLabel?: string;
  /** Header of the value column in the screen-reader table. Default: unit, or "Value" */
  valueLabel?: string;
  /** Screen-reader hint for the bars. Default "Use the left and right arrow keys to move between bars." */
  keyboardHint?: string;
}

/** Rounds a raw step up to 1, 2, 2.5 or 5 × a power of ten. */
export function niceStep(raw: number): number {
  if (!(raw > 0) || !Number.isFinite(raw)) return 1;
  const power = 10 ** Math.floor(Math.log10(raw));
  const f = raw / power;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * power;
}

/** Picks the scale top and evenly spaced round ticks from zero up to it. */
export function niceScale(largest: number, tickCount: number, fixedTop?: number) {
  const steps = Math.max(1, Math.round(tickCount));
  const limit = fixedTop && fixedTop > 0 ? fixedTop : largest > 0 ? largest : steps;
  const step = niceStep(limit / steps);
  const top = fixedTop && fixedTop > 0 ? fixedTop : Math.ceil(limit / step - 1e-9) * step;
  const ticks: number[] = [];
  // Multiply rather than add, and trim float noise (0.30000000000000004 → 0.3).
  for (let i = 0; i * step <= top * (1 + 1e-9); i++) ticks.push(Number((i * step).toPrecision(12)));
  return { top, ticks };
}

// Reduced-motion preference as live React state (updates if the user flips the OS setting).
const REDUCE = "(prefers-reduced-motion: reduce)";
const canMatch = () => typeof window !== "undefined" && typeof window.matchMedia === "function";
const subscribeMotion = (onChange: () => void) => {
  if (!canMatch()) return () => {};
  const query = window.matchMedia(REDUCE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const prefersReduced = () => canMatch() && window.matchMedia(REDUCE).matches;

const defaultFormat = (n: number) => n.toLocaleString();
const HEADROOM = 22; // px above the top gridline, so the tallest bar's value label isn't clipped

export default function AnimatedBarChart({
  data,
  title,
  description,
  max,
  tickCount = 4,
  formatValue = defaultFormat,
  height = 220,
  unit,
  highlightMax = false,
  animate = true,
  duration = 700,
  stagger = 70,
  barWidth = 24,
  emptyMessage = "No data to show yet.",
  categoryLabel = "Category",
  valueLabel,
  keyboardHint = "Use the left and right arrow keys to move between bars.",
}: AnimatedBarChartProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;
  const hintId = `${id}-hint`;
  const figureRef = useRef<HTMLElement>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const groupRef = useRef<HTMLDivElement>(null);

  const reduced = useSyncExternalStore(subscribeMotion, prefersReduced, () => false);
  const motion = animate && !reduced;

  const [seen, setSeen] = useState(false); // has the chart scrolled into view yet?
  const [introDone, setIntroDone] = useState(false); // stagger only applies to the first grow-in
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [rover, setRover] = useState(0); // the one bar that is in the Tab order
  const [dismissed, setDismissed] = useState(false); // Escape hides the tooltip until the next move
  const [labelsFit, setLabelsFit] = useState(true); // do the value labels fit side by side?
  const [labelsOverhang, setLabelsOverhang] = useState(false); // are labels wider than the bars?

  const hasData = data.length > 0;

  // Grow the bars the first time the chart is at least a third on screen.
  // Waits for data, so a chart that loads its data later still grows in.
  useEffect(() => {
    if (seen || !hasData) return;
    const el = figureRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.33 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [seen, hasData]);

  // After the staggered grow-in, later data changes move every bar together.
  useEffect(() => {
    if (!seen || introDone) return;
    const timer = window.setTimeout(() => setIntroDone(true), duration + stagger * data.length);
    return () => window.clearTimeout(timer);
  }, [seen, introDone, duration, stagger, data.length]);

  // Measure before paint: if the widest value label is wider than a bar's column (plus the gap), labels
  // would collide, so only the largest bar keeps its label. Tooltips and the hidden table still have every value.
  // Labels wider than the bar itself are pinned to the outer edge on the first and last bar so they never
  // hang outside the chart.
  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const measure = () => {
      const [a, b] = barRefs.current;
      if (!a) return;
      const gap = b ? b.offsetLeft - a.offsetLeft - a.offsetWidth : a.offsetWidth;
      const labels = group.querySelectorAll<HTMLElement>("[data-value-label]");
      const widest = Math.max(0, ...Array.from(labels, (l) => l.offsetWidth));
      setLabelsFit(widest <= a.offsetWidth + gap - 2);
      const bar = a.firstElementChild;
      setLabelsOverhang(bar instanceof HTMLElement && widest > bar.offsetWidth);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(group);
    return () => observer.disconnect();
  }, [data, formatValue]);

  const revealed = seen || !motion;
  const largest = data.reduce((m, d) => Math.max(m, d.value), 0);
  const { top, ticks } = niceScale(largest, tickCount, max);
  const pct = (v: number) => Math.min(Math.max(v, 0) / top, 1) * 100;
  const withUnit = (v: number) => (unit ? `${formatValue(v)} ${unit}` : formatValue(v));
  const active = dismissed ? null : (hovered ?? focused);
  const tabStop = Math.min(rover, data.length - 1);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>, i: number) => {
    if (e.key === "Escape") {
      setDismissed(true);
      return;
    }
    const last = data.length - 1;
    const next =
      e.key === "ArrowRight" ? Math.min(i + 1, last)
      : e.key === "ArrowLeft" ? Math.max(i - 1, 0)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    setRover(next);
    barRefs.current[next]?.focus();
  };

  return (
    <figure
      ref={figureRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      className="@container m-0 w-full font-sans text-[#ece4d6]"
    >
      <figcaption className="mb-4 flex flex-col gap-0.5">
        <span id={titleId} className="text-[15px] leading-snug font-semibold @md:text-base">
          {title}
        </span>
        {description && (
          <span id={descId} className="text-[13px] text-[#a2977f]">
            {description}
          </span>
        )}
      </figcaption>

      {!hasData ? (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[#37302a] bg-[#16130f]/50 px-6 text-center"
          style={{ height: height + HEADROOM }}
        >
          <svg viewBox="0 0 24 24" className="size-7 text-[#4a4037]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M4 20h16M7 16v-3M12 16V8M17 16v-6" />
          </svg>
          <p className="m-0 max-w-[30ch] text-sm text-[#a2977f]">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 @md:gap-x-3">
          {unit && (
            <span aria-hidden="true" className="col-span-2 -mb-3 font-mono text-[10px] tracking-[0.14em] text-[#a2977f] uppercase">
              {unit}
            </span>
          )}

          {/* Y axis. Invisible copies of every tick label give this column the width of the widest one. */}
          <div aria-hidden="true" className="relative font-mono text-[10px] tabular-nums @md:text-[11px]" style={{ height: height + HEADROOM }}>
            {ticks.map((t) => (
              <div key={t} className="invisible h-0 overflow-hidden">
                {formatValue(t)}
              </div>
            ))}
            <div className="absolute inset-x-0 bottom-0" style={{ top: HEADROOM }}>
              {ticks.map((t) => (
                <span key={t} className="absolute right-0 translate-y-1/2 leading-none text-[#a2977f]" style={{ bottom: `${pct(t)}%` }}>
                  {formatValue(t)}
                </span>
              ))}
            </div>
          </div>

          {/* Plot */}
          <div className="relative" style={{ height: height + HEADROOM }}>
            <div className="absolute inset-x-0 bottom-0" style={{ top: HEADROOM }}>
              {ticks.map((t) => (
                <div
                  key={t}
                  aria-hidden="true"
                  className={`absolute inset-x-0 h-px translate-y-1/2 ${t === 0 ? "bg-[#4a4037]" : "bg-[#37302a]/70"}`}
                  style={{ bottom: `${pct(t)}%` }}
                />
              ))}

              <div
                ref={groupRef}
                role="group"
                aria-labelledby={titleId}
                aria-describedby={hintId}
                onPointerLeave={() => setHovered(null)}
                className="absolute inset-0 flex gap-1.5 @md:gap-3 @3xl:gap-5"
              >
                {data.map((d, i) => {
                  const isMax = d.value === largest && largest > 0;
                  const isActive = active === i;
                  const dimmed = active !== null && !isActive;
                  const first = i === 0;
                  const last = i === data.length - 1;
                  return (
                    <div
                      key={i}
                      ref={(el) => {
                        barRefs.current[i] = el;
                      }}
                      role="img"
                      aria-label={`${d.label}: ${withUnit(d.value)}`}
                      tabIndex={i === tabStop ? 0 : -1}
                      onFocus={() => {
                        setFocused(i);
                        setRover(i);
                        setDismissed(false);
                      }}
                      onBlur={() => setFocused(null)}
                      onPointerEnter={() => {
                        setHovered(i);
                        setDismissed(false);
                      }}
                      onKeyDown={(e) => onKeyDown(e, i)}
                      // The whole column is the hover target, not just the painted bar.
                      className="group relative flex h-full min-w-0 flex-1 items-end justify-center outline-none"
                      style={{ "--ls-bar-delay": `${motion && !introDone ? i * stagger : 0}ms`, "--ls-bar-dur": `${duration}ms` } as CSSProperties}
                    >
                      <div
                        className={`relative w-full rounded-t-[4px] group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-[#e0985f] ${
                          motion
                            ? "[transition:height_var(--ls-bar-dur)_cubic-bezier(0.22,1,0.36,1)_var(--ls-bar-delay),opacity_150ms_ease,filter_150ms_ease,background-color_300ms_ease]"
                            : ""
                        } ${highlightMax && !isMax ? "bg-[#786c5b]" : "bg-[#e0985f]"} ${dimmed ? "opacity-35" : ""} ${
                          isActive ? "brightness-115" : ""
                        }`}
                        style={{ height: `${revealed ? pct(d.value) : 0}%`, maxWidth: barWidth }}
                      >
                        <span
                          data-value-label
                          aria-hidden="true"
                          className={`absolute bottom-full mb-1 font-mono text-[10px] leading-none whitespace-nowrap tabular-nums @md:text-[11px] ${
                            labelsOverhang && first ? "left-0" : labelsOverhang && last ? "right-0" : "left-1/2 -translate-x-1/2"
                          } ${
                            labelsFit || isMax ? "" : "invisible"
                          } ${
                            isActive || (highlightMax && isMax) ? "text-[#ece4d6]" : "text-[#a2977f]"
                          } ${motion ? "[transition:opacity_300ms_ease_var(--ls-bar-delay)]" : ""} ${revealed ? "opacity-100" : "opacity-0"}`}
                        >
                          {formatValue(d.value)}
                        </span>
                      </div>

                      {isActive && (
                        <div
                          aria-hidden="true"
                          className={`pointer-events-none absolute z-10 rounded-lg border border-[#4a4037] bg-[#282219] px-2.5 py-1.5 whitespace-nowrap shadow-[0_8px_24px_-8px_rgba(0,0,0,0.7)] ${
                            first ? "left-0" : last ? "right-0" : "left-1/2 -translate-x-1/2"
                          }`}
                          style={{ bottom: `calc(${pct(d.value)}% + ${HEADROOM}px)` }}
                        >
                          <span className="block font-mono text-[13px] leading-tight font-medium text-[#ece4d6] tabular-nums">
                            {formatValue(d.value)}
                            {unit && <span className="font-normal text-[#a2977f]"> {unit}</span>}
                          </span>
                          <span className="block text-[11px] leading-tight text-[#a2977f]">{d.label}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* X axis labels (the bars already carry them for screen readers) */}
          <div className="col-start-2 mt-2 flex gap-1.5 @md:gap-3 @3xl:gap-5" aria-hidden="true">
            {data.map((d, i) => (
              <span
                key={i}
                className={`min-w-0 flex-1 truncate text-center font-mono text-[10px] transition-colors @md:text-[11px] ${
                  active === i ? "text-[#ece4d6]" : "text-[#a2977f]"
                }`}
              >
                <span className="@md:hidden">{d.shortLabel ?? d.label}</span>
                <span className="hidden @md:inline">{d.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {hasData && (
        <>
          <p id={hintId} className="sr-only">
            {keyboardHint}
          </p>
          {/* The same numbers as a plain table, for screen-reader users who prefer to browse. */}
          <table className="sr-only">
            <caption>{title}</caption>
            <thead>
              <tr>
                <th scope="col">{categoryLabel}</th>
                <th scope="col">{valueLabel ?? unit ?? "Value"}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i}>
                  <th scope="row">{d.label}</th>
                  <td>{formatValue(d.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </figure>
  );
}
