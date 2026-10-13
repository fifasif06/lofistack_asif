// registry.json is the single list of components and agent logs. Everything else is found by folder:
//   components/<slug>/component.tsx   the reusable component (React + TypeScript + Tailwind)
//   components/<slug>/demo.tsx        the live demo — also shown on the page as the usage example
//   components/<slug>/prompt.md       the final prompt that produced it
import type { ComponentType } from "react";
import data from "../registry.json";

export interface Owner {
  name: string;
  post: string;
  teams: string[];
}

export interface ComponentEntry {
  name: string;
  slug: string;
  type: string;
  week: number;
  description: string;
  /** optional tip shown under the demo */
  hint?: string;
  /** "wide" = the demo uses the full stage width (sections, tables, charts) */
  stage?: "center" | "wide";
}

export interface AgentLog {
  week: number;
  kind: string;
  file: string;
  summary: string;
}

interface Registry {
  repo: string;
  site: string;
  owner: Owner;
  components: ComponentEntry[];
  logs: AgentLog[];
}

const registry = data as Registry;

export const { repo, site, owner, components, logs } = registry;
export const findComponent = (slug: string | undefined) => components.find((c) => c.slug === slug);
export const repoFile = (path: string) => `${repo}/blob/main/${path}`;

type Loader<T> = () => Promise<T>;
// Loaded only when a component's page opens, so the gallery stays light.
const demos = import.meta.glob<{ default: ComponentType }>("../components/*/demo.tsx");
const code = import.meta.glob<string>("../components/*/component.tsx", { query: "?raw", import: "default" });
const usage = import.meta.glob<string>("../components/*/demo.tsx", { query: "?raw", import: "default" });
const prompts = import.meta.glob<string>("../components/*/prompt.md", { query: "?raw", import: "default" });

export interface LoadedComponent {
  Demo: ComponentType;
  code: string;
  usage: string;
  prompt: string;
}

export async function loadComponent(slug: string): Promise<LoadedComponent> {
  const at = (file: string) => `../components/${slug}/${file}`;
  const need = <T,>(map: Record<string, Loader<T>>, file: string) => {
    const load = map[at(file)];
    if (!load) throw new Error(`components/${slug}/${file} is missing`);
    return load();
  };
  const [mod, codeText, usageText, promptText] = await Promise.all([
    need(demos, "demo.tsx"),
    need(code, "component.tsx"),
    need(usage, "demo.tsx"),
    need(prompts, "prompt.md"),
  ]);
  return { Demo: mod.default, code: codeText.trim(), usage: usageText.trim(), prompt: promptText.trim() };
}
