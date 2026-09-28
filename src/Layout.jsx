import { Link } from "react-router-dom";
import { owner } from "./registry.js";

export default function Layout({ children }) {
  return (
    <div className="ls-page">
      <header className="ls-top">
        <div className="ls-wrap">
          <Link className="ls-mark" to="/"><b>lofi</b>stack</Link>
          <span className="ls-tag">90-day build challenge</span>
        </div>
      </header>
      <main className="ls-main">
        <div className="ls-wrap ls-stack">{children}</div>
      </main>
      {/* footer: owner details come from registry.json → "owner" */}
      <footer className="ls-foot">
        <div className="ls-wrap ls-foot-in">
          <div className="ls-who">
            <span className="ls-who-name">{owner.name}</span>
            <span className="ls-who-post">{owner.post}</span>
          </div>
          <ul className="ls-teams" aria-label="Teams">
            {owner.teams.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      </footer>
    </div>
  );
}
