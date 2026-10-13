import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { findComponent, loadComponent, repoFile, type LoadedComponent } from "./registry";
import CodePanel from "./CodePanel";
import NotFound from "./NotFound";
import { backLink, chip, eyebrow } from "./ui";

export default function ComponentPage() {
  const { slug } = useParams();
  const c = findComponent(slug);
  const [data, setData] = useState<LoadedComponent | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!c) return;
    document.title = `${c.name} · LofiStack`;
    let live = true;
    setData(null);
    setFailed(false);
    loadComponent(c.slug).then(
      (d) => live && setData(d),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [c]);

  if (!c) return <NotFound />;
  const file = (f: string) => repoFile(`components/${c.slug}/${f}`);
  const wide = c.stage === "wide";

  return (
    <>
      <div className="flex flex-col gap-3">
        <Link className={backLink} to="/">← all components</Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[26px] leading-tight font-semibold text-balance">{c.name}</h1>
          <span className={chip}>{c.type}</span>
          <span className="font-mono text-[11px] text-ls-muted">week {c.week}</span>
        </div>
        <p className="max-w-xl text-ls-muted">{c.description}</p>
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="demo">
        <h2 id="demo" className={eyebrow}>live demo</h2>
        <div
          className={`flex min-h-64 overflow-hidden rounded-xl border border-ls-line bg-ls-surface ${
            wide ? "flex-col items-stretch p-4 sm:p-6" : "items-center justify-center px-4 py-10"
          }`}
        >
          {failed ? (
            <span className="m-auto font-mono text-[11px] text-ls-muted">couldn't load this demo — try refreshing.</span>
          ) : data ? (
            <data.Demo />
          ) : (
            <span className="m-auto font-mono text-[11px] text-ls-muted" role="status">loading…</span>
          )}
        </div>
        {c.hint && <p className="font-mono text-[11px] text-ls-muted">{c.hint}</p>}
      </section>

      {data && (
        <>
          <CodePanel label="usage · demo.tsx" text={data.usage} href={file("demo.tsx")} />
          <CodePanel label="code · react + typescript + tailwind" text={data.code} href={file("component.tsx")} />
          <CodePanel label="final prompt" text={data.prompt} href={file("prompt.md")} wrap />
        </>
      )}
    </>
  );
}
