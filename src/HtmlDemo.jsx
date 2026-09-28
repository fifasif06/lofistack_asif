import { useEffect, useRef } from "react";

// Runs a Week 1 plain-HTML component exactly as it was written (style + markup + script).
// Browsers don't run <script> tags added with innerHTML, so each one is re-created.
export default function HtmlDemo({ html }) {
  const ref = useRef(null);
  useEffect(() => {
    const box = ref.current;
    box.innerHTML = html;
    box.querySelectorAll("script").forEach((old) => {
      const s = document.createElement("script");
      s.textContent = old.textContent;
      old.replaceWith(s);
    });
    return () => { box.innerHTML = ""; };
  }, [html]);
  return <div ref={ref} style={{ display: "contents" }} />;
}
