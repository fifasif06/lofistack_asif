// 3D Tilt Profile Card — one self-contained React component (styles included).
// Usage:  <TiltProfileCard name="…" role="…" tags={[…]} stats={[…]} />
import { useEffect, useRef, useState } from "react";

const MAX_TILT = 14; // degrees at the card's edge
const css = `
.ls-tilt-scene { perspective: 900px; display: inline-block; }
.ls-tilt-card {
  --rx: 0deg; --ry: 0deg; --gx: 50%; --gy: 50%; --glare: 0;
  position: relative; width: 300px; max-width: calc(100vw - 64px); box-sizing: border-box;
  padding: 28px 24px 22px; border-radius: 18px;
  background: linear-gradient(155deg, #2c251c 0%, #1f1b16 60%, #1a1612 100%);
  border: 1px solid #37302a; color: #ece4d6;
  font-family: "Geist", system-ui, -apple-system, sans-serif;
  transform-style: preserve-3d;
  transform: rotateX(var(--rx)) rotateY(var(--ry));
  transition: transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 600ms ease;
  box-shadow: 0 18px 40px -24px rgba(0, 0, 0, 0.8);
  touch-action: none; user-select: none; -webkit-user-select: none;
}
.ls-tilt-card.ls-tilt-active {
  transition: transform 90ms ease-out, box-shadow 200ms ease;
  box-shadow: 0 30px 60px -28px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(224, 152, 95, 0.25);
}
/* soft light that follows the pointer */
.ls-tilt-glare {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: radial-gradient(circle at var(--gx) var(--gy), rgba(255, 236, 210, 0.16), transparent 55%);
  opacity: var(--glare); transition: opacity 300ms ease;
}
/* layers float at different depths for a parallax feel */
.ls-tilt-layer { transform: translateZ(var(--z, 0px)); }
.ls-tilt-avatar {
  --z: 50px; width: 72px; height: 72px; border-radius: 999px; margin-bottom: 16px;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle at 30% 25%, #f3b983, #e0985f 45%, #a8612f);
  color: #16130f; font-size: 24px; font-weight: 600; letter-spacing: 0.02em;
  box-shadow: 0 10px 24px -10px rgba(224, 152, 95, 0.7);
}
.ls-tilt-name { --z: 40px; margin: 0; font-size: 18px; font-weight: 600; line-height: 1.25; }
.ls-tilt-role { --z: 30px; margin: 4px 0 0; font-family: "Geist Mono", ui-monospace, Menlo, monospace; font-size: 12px; color: #a2977f; }
.ls-tilt-tags { --z: 25px; list-style: none; padding: 0; margin: 16px 0 0; display: flex; flex-wrap: wrap; gap: 6px; }
.ls-tilt-tags li {
  font-family: "Geist Mono", ui-monospace, Menlo, monospace; font-size: 10.5px; color: #e0985f;
  background: rgba(224, 152, 95, 0.12); border-radius: 999px; padding: 3px 9px;
}
.ls-tilt-stats { --z: 20px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 20px 0 0; padding: 14px 0 0; border-top: 1px solid #37302a; }
.ls-tilt-stats div { display: flex; flex-direction: column; gap: 2px; }
.ls-tilt-stats dt { order: 2; font-size: 11px; color: #a2977f; }
.ls-tilt-stats dd { order: 1; margin: 0; font-size: 16px; font-weight: 600; }
.ls-tilt-btn {
  --z: 35px; margin-top: 18px; width: 100%; padding: 10px 16px; border-radius: 999px; cursor: pointer;
  font: 500 14px "Geist", system-ui, sans-serif; border: 1px solid #e0985f;
  background: #e0985f; color: #16130f; transition: background-color 160ms ease, color 160ms ease;
}
.ls-tilt-btn[aria-pressed="true"] { background: transparent; color: #e0985f; }
.ls-tilt-btn:focus-visible { outline: 2px solid #e0985f; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) {
  .ls-tilt-card, .ls-tilt-card.ls-tilt-active { transform: none; transition: none; }
  .ls-tilt-glare { display: none; }
}
`;

export default function TiltProfileCard({
  name = "Md Asif-Ud-Doula",
  role = "Senior Automation Engineer L4",
  tags = ["Service Team Lead", "Operation Team", "Client Acquisition"],
  stats = [
    { label: "components", value: "30" },
    { label: "agent logs", value: "13" },
    { label: "days", value: "90" },
  ],
}) {
  const cardRef = useRef(null);
  const frame = useRef(0);
  const [active, setActive] = useState(false);
  const [following, setFollowing] = useState(false);
  const initials = name.replace(/^(md\.?|mr\.?|ms\.?|dr\.?)\s+/i, "").split(/[\s-]+/).filter(Boolean)
    .slice(0, 2).map((w) => w[0].toUpperCase()).join("");

  const reduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Write straight to CSS variables (no re-render on every pointer move).
  const setVars = (rx, ry, gx, gy, glare) => {
    const s = cardRef.current?.style;
    if (!s) return;
    s.setProperty("--rx", rx + "deg");
    s.setProperty("--ry", ry + "deg");
    s.setProperty("--gx", gx + "%");
    s.setProperty("--gy", gy + "%");
    s.setProperty("--glare", glare);
  };

  const onMove = (e) => {
    if (reduced()) return;
    const r = cardRef.current.getBoundingClientRect();
    const px = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);  // 0 = left, 1 = right
    const py = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1);  // 0 = top, 1 = bottom
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() =>
      setVars((0.5 - py) * 2 * MAX_TILT, (px - 0.5) * 2 * MAX_TILT, px * 100, py * 100, 1)
    );
    if (!active) setActive(true);
  };

  const reset = () => {
    cancelAnimationFrame(frame.current);
    setActive(false);
    setVars(0, 0, 50, 50, 0); // springs back (see the transition on .ls-tilt-card)
  };

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return (
    <div className="ls-tilt-scene">
      <style>{css}</style>
      <article
        ref={cardRef}
        className={"ls-tilt-card" + (active ? " ls-tilt-active" : "")}
        onPointerMove={onMove}
        onPointerLeave={reset}
        onPointerUp={(e) => e.pointerType !== "mouse" && reset()}
        onPointerCancel={reset}
        aria-label={`Profile card: ${name}`}
      >
        <span className="ls-tilt-glare" aria-hidden="true" />
        <div className="ls-tilt-layer ls-tilt-avatar" aria-hidden="true">{initials}</div>
        <h3 className="ls-tilt-layer ls-tilt-name">{name}</h3>
        <p className="ls-tilt-layer ls-tilt-role">{role}</p>
        <ul className="ls-tilt-layer ls-tilt-tags" aria-label="Teams">
          {tags.map((t) => <li key={t}>{t}</li>)}
        </ul>
        <dl className="ls-tilt-layer ls-tilt-stats">
          {stats.map((s) => (
            <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>
          ))}
        </dl>
        <button
          className="ls-tilt-layer ls-tilt-btn"
          type="button"
          aria-pressed={following}
          onClick={() => setFollowing((f) => !f)}
        >
          {following ? "Following" : "Follow"}
        </button>
      </article>
    </div>
  );
}
