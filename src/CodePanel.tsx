import { useEffect, useRef, useState } from "react";
import { eyebrow, focusRing } from "./ui";

interface CodePanelProps {
  label: string;
  text: string;
  /** link to the exact file on GitHub */
  href: string;
  /** wrap long lines (used for the prompt) */
  wrap?: boolean;
}

export default function CodePanel({ label, text, href, wrap = false }: CodePanelProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = () => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), 1500);
      },
      () => {},
    );
  };

  const small = `font-mono text-[11px] text-ls-muted transition-colors hover:text-ls-amber ${focusRing}`;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={eyebrow}>{label}</h2>
        <span className="flex items-center gap-3">
          <a className={`${small} border-b border-ls-line hover:border-ls-amber`} href={href}>view on github</a>
          <button
            className={`${small} cursor-pointer rounded-md border border-ls-line bg-transparent px-2.5 py-1 hover:border-ls-amber`}
            type="button"
            onClick={copy}
            aria-live="polite"
          >
            {copied ? "copied" : "copy"}
          </button>
        </span>
      </div>
      <pre
        className={`m-0 max-h-[560px] overflow-auto rounded-xl border border-ls-line bg-ls-surface p-5 font-mono text-xs leading-[1.7] text-ls-fg/90 [tab-size:2] ${wrap ? "whitespace-pre-wrap" : ""} ${focusRing}`}
        tabIndex={0}
        aria-label={label}
      >
        {text}
      </pre>
    </section>
  );
}
