import { useEffect } from "react";
import { Link } from "react-router-dom";
import { components, logs, repoFile } from "./registry";
import { chip, eyebrow, focusRing } from "./ui";

const card = `group flex h-full flex-col gap-2 rounded-xl border border-ls-line bg-ls-surface p-5 transition-colors hover:border-ls-amber focus-visible:border-ls-amber ${focusRing}`;

export default function Gallery() {
  useEffect(() => {
    document.title = "LofiStack";
  }, []);
  const weeks = [...new Set(components.map((c) => c.week))].sort((a, b) => a - b);

  return (
    <>
      <div className="flex flex-col gap-3">
        <h1 className="text-[26px] leading-tight font-semibold text-balance">Component gallery</h1>
        <p className="max-w-xl text-ls-muted">
          One small, well-made UI piece at a time — 30 components and 13 agent logs over 90 days. Every
          component ships with a live demo, its code, a usage example and the final prompt that produced it.
        </p>
      </div>

      {weeks.map((w) => (
        <section className="flex flex-col gap-3" key={w} aria-labelledby={`week-${w}`}>
          <h2 id={`week-${w}`} className={eyebrow}>week {w}</h2>
          <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
            {components
              .filter((c) => c.week === w)
              .map((c) => (
                <li key={c.slug}>
                  <Link className={card} to={`/components/${c.slug}`}>
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-medium transition-colors group-hover:text-ls-amber group-focus-visible:text-ls-amber">
                        {c.name}
                      </span>
                      <span className={chip}>{c.type}</span>
                    </span>
                    <p className="text-sm text-ls-muted">{c.description}</p>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}

      <section className="flex flex-col gap-3" aria-labelledby="agent-logs">
        <h2 id="agent-logs" className={eyebrow}>agent logs</h2>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {logs.map((l) => (
            <li key={l.file}>
              <a className={card} href={repoFile(l.file)}>
                <span className="flex items-center justify-between gap-3">
                  <span className="font-medium transition-colors group-hover:text-ls-amber group-focus-visible:text-ls-amber">
                    #{l.week} · {l.kind}
                  </span>
                  <span className="font-mono text-[11px] text-ls-muted">week {l.week} ↗</span>
                </span>
                <p className="text-sm text-ls-muted">{l.summary}</p>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
