import { useEffect, useRef, useState, type MouseEvent } from "react";
import ShrinkNavbar from "./component";

const COMPACT = 56;

const LINKS = [
  { label: "Listen", href: "#listen" },
  { label: "Focus", href: "#focus" },
  { label: "Stations", href: "#stations" },
  { label: "Pricing", href: "#pricing" },
];

const STATIONS = [
  { name: "rainy window", note: "soft keys, light rain" },
  { name: "late-night tape", note: "warm hiss, slow drums" },
  { name: "coffee shop", note: "murmur and vinyl" },
  { name: "snow day", note: "quiet, almost still" },
];

const PLANS = [
  { name: "Free", price: "$0", note: "All stations, with a short break every hour." },
  { name: "Plus", price: "$4 / mo", note: "No breaks, offline mode and the focus timer." },
];

const BRAND = (
  <span className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.01em] whitespace-nowrap text-[#ece4d6]">
    <span aria-hidden="true" className="size-6 shrink-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,#f3b983,#e0985f_55%,#8a5a35)]" />
    <span>
      <span className="text-[#e0985f]">lofi</span>stack radio
    </span>
  </span>
);

const heading = "text-[22px]/7 font-semibold tracking-[-0.01em] text-[#ece4d6]";
const body = "mt-2 max-w-[460px] text-[14px]/6 text-[#a2977f]";

export default function ShrinkNavbarDemo() {
  const box = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("#listen");

  // Clicking a link scrolls the demo box (not the page) to that section.
  const goTo = (href: string, event: MouseEvent<HTMLAnchorElement>) => {
    const section = box.current?.querySelector<HTMLElement>(href);
    if (!box.current || !section) return;
    event.preventDefault();
    setActive(href);
    box.current.scrollTo({ top: section.offsetTop - COMPACT });
  };

  // Highlight whichever section crosses a thin band near the top of the box while scrolling.
  useEffect(() => {
    const root = box.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(`#${e.target.id}`)),
      { root, rootMargin: "-30% 0px -65% 0px" },
    );
    root.querySelectorAll("section[id]").forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={box}
      role="region"
      aria-label="lofistack radio demo page"
      tabIndex={0}
      className="@container relative h-[420px] overflow-y-auto overscroll-contain scroll-smooth rounded-xl border border-[#37302a] bg-[#16130f] font-sans focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0985f] motion-reduce:scroll-auto"
    >
      <ShrinkNavbar
        brand={BRAND}
        links={LINKS}
        activeHref={active}
        onNavigate={goTo}
        cta={{ label: "Start listening", onClick: () => box.current?.scrollTo({ top: 0 }) }}
        scrollContainer={box}
        compactHeight={COMPACT}
      />

      <section id="listen" className="px-5 pt-6 pb-16 @lg:px-8">
        <p className="font-mono text-[11px] tracking-[0.2em] text-[#e0985f] uppercase">24/7 lofi for deep work</p>
        <h2 className="mt-3 max-w-[420px] text-[32px]/[38px] font-semibold tracking-[-0.02em] text-[#ece4d6]">
          Soft beats for long, quiet focus.
        </h2>
        <p className={body}>Press play, pick a mood and let the hours slip by. Scroll this box to watch the bar above shrink.</p>
        <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#37302a] bg-[#1f1b16] px-3 py-1.5 font-mono text-[11px] text-[#a2977f]">
          <span className="size-1.5 rounded-full bg-[#8fbf7f]" />
          now playing · rainy window
        </p>
      </section>

      <section id="focus" className="border-t border-[#37302a] px-5 py-14 @lg:px-8">
        <h2 className={heading}>A timer that listens too</h2>
        <p className={body}>25 minutes on, 5 off. When a break begins the music dips, then eases back in when it's time to work.</p>
      </section>

      <section id="stations" className="border-t border-[#37302a] px-5 py-14 @lg:px-8">
        <h2 className={heading}>Stations for every mood</h2>
        <ul className="mt-5 grid grid-cols-1 gap-3 @lg:grid-cols-2">
          {STATIONS.map((s) => (
            <li key={s.name} className="rounded-xl border border-[#37302a] bg-[#1f1b16] px-4 py-3">
              <p className="text-[14px] font-medium text-[#ece4d6]">{s.name}</p>
              <p className="font-mono text-[11px] text-[#a2977f]">{s.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="pricing" className="min-h-[380px] border-t border-[#37302a] px-5 py-14 @lg:px-8">
        <h2 className={heading}>Simple pricing</h2>
        <ul className="mt-5 grid grid-cols-1 gap-3 @lg:grid-cols-2">
          {PLANS.map((p) => (
            <li key={p.name} className="rounded-xl border border-[#37302a] bg-[#1f1b16] px-4 py-4">
              <p className="flex items-baseline justify-between text-[15px] font-medium text-[#ece4d6]">
                {p.name} <span className="font-mono text-[13px] text-[#e0985f]">{p.price}</span>
              </p>
              <p className="mt-1 text-[13px]/5 text-[#a2977f]">{p.note}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 font-mono text-[11px] text-[#a2977f]">lofistack radio · made for late nights</p>
      </section>
    </div>
  );
}
