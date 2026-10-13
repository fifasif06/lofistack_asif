import BentoFeatureGrid, { type BentoItem } from "./component";

// Decorative visuals for the demo tiles — plain Tailwind, kept here so the grid itself stays generic.
const BARS = [40, 65, 85, 55, 30, 70, 95, 60, 45, 80, 50, 35, 75, 90, 55, 40, 65, 85, 45, 30, 60, 80, 50, 70, 40, 90, 55, 35];
const PLAYED = 11;
const STATIONS = ["rain", "late night", "café", "snow day", "tape hiss", "deep focus"];
const SHORTCUTS = [
  { key: "space", label: "play" },
  { key: "N", label: "next" },
  { key: "F", label: "focus" },
  { key: "M", label: "mute" },
];

function NowPlaying() {
  return (
    <div className="flex h-full flex-col">
      <style>{"@keyframes ls-bento-eq{0%,100%{scale:1 1}50%{scale:1 .55}}"}</style>
      <p className="flex items-center gap-1.5 font-mono text-[11px]/4 text-[#e0985f]">
        <span className="size-1.5 rounded-full bg-[#e0985f] motion-safe:animate-pulse" />
        now playing
      </p>
      <p className="mt-1.5 text-[14px]/5 font-medium text-[#ece4d6]">rainy window study mix</p>
      <p className="mt-0.5 font-mono text-[11px]/4 text-[#a2977f]">side b · 1 hr 12 min</p>
      <div className="mt-auto flex h-24 items-end gap-1">
        {BARS.map((height, i) => (
          <span
            key={i}
            className={`flex-1 origin-bottom rounded-full [animation:ls-bento-eq_1.8s_ease-in-out_infinite] motion-reduce:[animation:none] ${
              i < PLAYED ? "bg-[#e0985f]" : "bg-[#4a4037]"
            }`}
            style={{ height: `${height}%`, animationDelay: `${-i * 0.23}s` }}
          />
        ))}
      </div>
      <p className="mt-2 flex justify-between font-mono text-[10px]/[14px] text-[#a2977f]">
        <span>12:08</span>
        <span>1:12:00</span>
      </p>
    </div>
  );
}

function FocusRing() {
  return (
    <svg viewBox="0 0 100 100" className="my-auto aspect-square h-full max-h-[140px] self-start">
      <circle cx="50" cy="50" r="44" fill="none" stroke="#37302a" strokeWidth="6" />
      <circle
        cx="50" cy="50" r="44" fill="none" stroke="#e0985f" strokeWidth="6" strokeLinecap="round"
        strokeDasharray="199 277" transform="rotate(-90 50 50)"
      />
      <text x="50" y="47" textAnchor="middle" dominantBaseline="central" className="fill-[#ece4d6] font-mono text-[18px] font-medium">
        18:42
      </text>
      <text x="50" y="63" textAnchor="middle" dominantBaseline="central" className="fill-[#a2977f] font-mono text-[9px]">
        focus
      </text>
    </svg>
  );
}

function StationPills() {
  return (
    <ul className="my-auto flex flex-wrap gap-1.5">
      {STATIONS.map((name, i) => (
        <li
          key={name}
          className={`flex h-[22px] items-center rounded-full border px-2.5 text-[12px] ${
            i === 0 ? "border-[#e0985f]/40 bg-[#e0985f]/15 text-[#e0985f]" : "border-[#37302a] bg-[#1f1b16] text-[#a2977f]"
          }`}
        >
          {name}
        </li>
      ))}
    </ul>
  );
}

function KeyCaps() {
  return (
    <div className="my-auto flex items-start gap-4">
      {SHORTCUTS.map((s) => (
        <div key={s.key} className="flex flex-col items-center gap-1">
          <kbd className="flex h-7 min-w-7 items-center justify-center rounded-md border border-b-2 border-[#4a4037] bg-[#1f1b16] px-2 font-mono text-[11px] text-[#ece4d6]">
            {s.key}
          </kbd>
          <span className="font-mono text-[10px]/[14px] text-[#a2977f]">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4v10M7.5 9.5 12 14l4.5-4.5M5 19h14" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </svg>
);

const FEATURES: BentoItem[] = [
  {
    id: "radio",
    size: "lg",
    title: "Endless lofi radio",
    description: "Hand-picked beats that never loop the same way twice. Press play and lose track of time.",
    badge: "live",
    href: "#listen",
    visual: <NowPlaying />,
  },
  {
    id: "focus",
    size: "tall",
    title: "Focus timer",
    description: "25 minutes on, 5 off. The music dips softly when a break begins.",
    visual: <FocusRing />,
  },
  {
    id: "offline",
    title: "Offline mode",
    description: "Save a station for the train. It keeps playing with no signal.",
    icon: <DownloadIcon />,
  },
  {
    id: "sleep",
    title: "Sleep timer",
    description: "Fades the music out over ten slow minutes.",
    icon: <MoonIcon />,
    badge: "new",
  },
  {
    id: "stations",
    size: "wide",
    title: "Stations for every mood",
    description: "Rainy window, late-night tape, coffee shop and more.",
    href: "#stations",
    visual: <StationPills />,
  },
  {
    id: "shortcuts",
    size: "wide",
    title: "Keyboard first",
    description: "Play, skip and start a focus round without the mouse.",
    href: "#shortcuts",
    visual: <KeyCaps />,
  },
];

export default function BentoFeatureGridDemo() {
  return (
    <BentoFeatureGrid
      eyebrow="why lofistack radio"
      heading="Everything you need to settle in and focus"
      subheading="Calm music, a gentle focus timer and stations for every mood, made for long study nights."
      items={FEATURES}
    />
  );
}
