// Builds the whole LofiStack site into dist/ — Vercel runs this on every push to main.
// Run locally:  npm install  then  npm run build   (then `npm run preview` to look at it)
//
// 1. Vite builds the React app (src/ + components/) into dist/.
// 2. Then this script writes one small HTML file per page — dist/components/<slug>.html —
//    with that component's own title and description, so shared links show a proper preview.
//    React takes over once the page loads. Vercel's clean URLs serve it at /components/<slug>.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));
const reg = JSON.parse(fs.readFileSync(path.join(root, "registry.json"), "utf8"));
const out = path.join(root, "dist");

// every component folder must have its code + prompt, or the build stops
for (const c of reg.components) {
  const dir = path.join(root, "components", c.slug);
  const hasCode = ["component.jsx", "component.html"].some((f) => fs.existsSync(path.join(dir, f)));
  if (!hasCode) throw new Error(`components/${c.slug}/ needs component.jsx or component.html`);
  if (!fs.existsSync(path.join(dir, "prompt.md"))) throw new Error(`components/${c.slug}/ needs prompt.md`);
}

await build({ root, logLevel: "warn" });

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const shell = fs.readFileSync(path.join(out, "index.html"), "utf8");

fs.mkdirSync(path.join(out, "components"), { recursive: true });
for (const c of reg.components) {
  const html = shell
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(c.name)} · LofiStack</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(c.description)}">`);
  fs.writeFileSync(path.join(out, "components", `${c.slug}.html`), html);
}

console.log("Built", 1 + reg.components.length, "pages into dist/");
