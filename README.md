# LofiStack

A 90-day component gallery (Sep 22 – Dec 20, 2026): **30 UI components and 13 agent logs**, one small, well-made piece at a time.

Every component has its own live page with a working demo, its full code, and the final prompt that produced it.

**Live site:** https://url.lofistack.com/preview/4jvzDvx4QbbGn6NMBAus

## Components

| Week | Component | Type | Live page | Code | Prompt |
|---|---|---|---|---|---|
| 1 | Magnetic Hover Button | button | [open](https://url.lofistack.com/preview/xR5h6SAYfYBDvMlMMAyX) | [component.html](components/magnetic-button/component.html) | [prompt.md](components/magnetic-button/prompt.md) |
| 1 | Skeleton Screen Loader | loader | [open](https://url.lofistack.com/preview/DCOLSlT17OhifdbPBSAm) | [component.html](components/skeleton-loader/component.html) | [prompt.md](components/skeleton-loader/prompt.md) |

## Agent logs

| Week | Kind | Log |
|---|---|---|
| 1 | Code generation | [week-01-code-generation.md](agent-logs/week-01-code-generation.md) |

## How this repo works

Everything is plain HTML, CSS and JavaScript — no frameworks, no build tools beyond one small Node script. The site is hosted on GoHighLevel: each page is one Custom Code element.

```
registry.json            ← the list of every component: name, type, week, live link
components/<name>/
  component.html         ← the component itself (style + markup + script, self-contained)
  prompt.md              ← the final prompt that produced it
build.js                 ← turns the list + folders into paste-ready pages
ghl-pages/               ← the output: one file per GHL page (home + one per component)
agent-logs/              ← one write-up per week
submissions/             ← the exact posts made each week
docs/                    ← how to put pages on GoHighLevel
```

The code and prompt shown on each live page are read straight from the component's folder at build time, so the site, the repo and the submissions always match.

### Adding a component

1. Make `components/<name>/` with `component.html` and `prompt.md`.
2. Add an entry to `registry.json`.
3. Run `node build.js`.
4. Paste the new file from `ghl-pages/` into a new GHL page, add its link to `registry.json`, rebuild, and re-paste `home.html`.

## Built by

**Md Asif-Ud-Doula** — Senior Automation Engineer L4 · Service Team Lead · Operation Team · Client Acquisition Team
