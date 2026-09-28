import { useEffect } from "react";
import { Link } from "react-router-dom";
import { components } from "./registry.js";

export default function Gallery() {
  useEffect(() => { document.title = "LofiStack"; }, []);
  const weeks = [...new Set(components.map((c) => c.week))].sort((a, b) => a - b);

  return (
    <>
      <div className="ls-group">
        <h1>Component gallery</h1>
        <p className="ls-lede">
          One small, well-made UI piece at a time — 30 components and 13 agent logs over 90 days. Every
          component ships with a live demo, its code, and the final prompt that produced it.
        </p>
      </div>
      {weeks.map((w) => (
        <section className="ls-group" key={w}>
          <h2 className="ls-eyebrow">week {w}</h2>
          <ul className="ls-grid">
            {components.filter((c) => c.week === w).map((c) => (
              <li key={c.slug}>
                <Link className="ls-card" to={`/components/${c.slug}`}>
                  <span className="ls-card-top">
                    <span className="ls-card-name">{c.name}</span>
                    <span className="ls-chip">{c.type}</span>
                  </span>
                  <p>{c.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
