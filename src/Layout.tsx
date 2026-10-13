import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { owner } from "./registry";
import { focusRing, wrap } from "./ui";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-ls-bg text-ls-fg">
      <a
        href="#main"
        className="sr-only rounded-md bg-ls-amber px-3 py-2 font-mono text-xs text-ls-bg focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        skip to content
      </a>
      <header className="border-b border-ls-line">
        <div className={`${wrap} flex items-baseline justify-between gap-3 py-5`}>
          <Link className={`rounded font-mono text-sm tracking-[0.02em] ${focusRing}`} to="/">
            <b className="font-normal text-ls-amber">lofi</b>stack
          </Link>
          <span className="font-mono text-xs text-ls-muted">90-day build challenge</span>
        </div>
      </header>

      <main id="main" className="flex-1 pt-10 pb-14">
        <div className={`${wrap} flex flex-col gap-10`}>{children}</div>
      </main>

      {/* footer: owner details come from registry.json → "owner" */}
      <footer className="border-t border-ls-line">
        <div className={`${wrap} flex flex-wrap items-center justify-between gap-x-6 gap-y-3.5 py-6`}>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-ls-fg">{owner.name}</span>
            <span className="font-mono text-xs text-ls-muted">{owner.post}</span>
          </div>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Teams">
            {owner.teams.map((t) => (
              <li key={t} className="whitespace-nowrap rounded-full border border-ls-line px-2.5 py-0.5 font-mono text-[11px] text-ls-muted">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </div>
  );
}
