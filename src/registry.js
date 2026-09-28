// registry.json is the single list of components. Everything else is found by folder name:
//   components/<slug>/component.jsx   (React, Week 2 on)   or   component.html (Week 1)
//   components/<slug>/prompt.md       (the final prompt)
import reg from "../registry.json";

export const owner = reg.owner;
export const repo = reg.repo;
export const components = reg.components;
export const findComponent = (slug) => components.find((c) => c.slug === slug);

// Loaded only when that component's page is opened, so the gallery stays light.
const reactDemos = import.meta.glob("../components/*/component.jsx");
const codeFiles = import.meta.glob("../components/*/component.{jsx,html}", { query: "?raw", import: "default" });
const promptFiles = import.meta.glob("../components/*/prompt.md", { query: "?raw", import: "default" });

export async function loadComponent(slug) {
  const jsx = `../components/${slug}/component.jsx`;
  const html = `../components/${slug}/component.html`;
  const kind = codeFiles[jsx] ? "jsx" : "html";
  const file = kind === "jsx" ? jsx : html;
  const [code, prompt, mod] = await Promise.all([
    codeFiles[file](),
    promptFiles[`../components/${slug}/prompt.md`](),
    kind === "jsx" ? reactDemos[jsx]() : null,
  ]);
  return { kind, fileName: file.split("/").pop(), code: code.trim(), prompt: prompt.trim(), Demo: mod?.default };
}
