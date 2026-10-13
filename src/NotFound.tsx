import { useEffect } from "react";
import { Link } from "react-router-dom";
import { backLink } from "./ui";

export default function NotFound() {
  useEffect(() => {
    document.title = "Page not found · LofiStack";
  }, []);
  return (
    <div className="flex flex-col gap-3">
      <Link className={backLink} to="/">← all components</Link>
      <h1 className="text-[26px] leading-tight font-semibold">Page not found</h1>
      <p className="max-w-xl text-ls-muted">That page doesn't exist (yet). Every component is listed in the gallery.</p>
    </div>
  );
}
