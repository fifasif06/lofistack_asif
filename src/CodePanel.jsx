import { useState } from "react";

export default function CodePanel({ id, label, text, href, wrap = false }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }, () => {});
  };
  return (
    <section className="ls-group">
      <div className="ls-head">
        <h2 className="ls-eyebrow">{label}</h2>
        <span className="ls-actions">
          <a className="ls-repo" href={href}>view on github</a>
          <button className="ls-copy" type="button" onClick={copy}>{copied ? "copied" : "copy"}</button>
        </span>
      </div>
      <pre className={"ls-panel" + (wrap ? " ls-wrapped" : "")} id={id}>{text}</pre>
    </section>
  );
}
