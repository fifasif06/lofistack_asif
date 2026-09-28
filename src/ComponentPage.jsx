import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { findComponent, loadComponent, repo } from "./registry.js";
import HtmlDemo from "./HtmlDemo.jsx";
import CodePanel from "./CodePanel.jsx";
import NotFound from "./NotFound.jsx";

const CODE_LABEL = { jsx: "code · react (jsx)", html: "code · html / css / js" };

export default function ComponentPage() {
  const { slug } = useParams();
  const c = findComponent(slug);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!c) return;
    document.title = `${c.name} · LofiStack`;
    let live = true;
    setData(null);
    loadComponent(slug).then((d) => live && setData(d));
    return () => { live = false; };
  }, [slug]);

  if (!c) return <NotFound />;
  const fileUrl = (f) => `${repo}/blob/main/components/${slug}/${f}`;

  return (
    <>
      <div className="ls-group">
        <Link className="ls-back" to="/">← all components</Link>
        <div className="ls-title-row">
          <h1>{c.name}</h1>
          <span className="ls-chip">{c.type}</span>
          <span className="ls-week">week {c.week}</span>
        </div>
        <p className="ls-lede">{c.description}</p>
      </div>

      <section className="ls-group">
        <h2 className="ls-eyebrow">demo</h2>
        <div className="ls-stage">
          {!data ? <span className="ls-note">loading…</span>
            : data.kind === "jsx" ? <data.Demo />
            : <HtmlDemo html={data.code} />}
        </div>
        {c.hint && <p className="ls-note">{c.hint}</p>}
      </section>

      {data && (
        <>
          <CodePanel id={`ls-code-${slug}`} label={CODE_LABEL[data.kind]} text={data.code} href={fileUrl(data.fileName)} />
          <CodePanel id={`ls-prompt-${slug}`} label="final prompt" text={data.prompt} href={fileUrl("prompt.md")} wrap />
        </>
      )}
    </>
  );
}
