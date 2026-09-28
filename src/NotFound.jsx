import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="ls-group">
      <Link className="ls-back" to="/">← all components</Link>
      <h1>Page not found</h1>
      <p className="ls-lede">That page doesn't exist (yet). Every component is listed in the gallery.</p>
    </div>
  );
}
