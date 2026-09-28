# LofiStack

A 90-day component gallery (Sep 22 – Dec 20, 2026): **30 UI components and 13 agent logs**, one small, well-made piece at a time.

Every component has its own live page with a working demo, its full code, and the final prompt that produced it.

**Live site:** https://lofistack-asif-week1.vercel.app

## Components

| Week | Component | Type | Live page | Code | Prompt |
|---|---|---|---|---|---|
| 1 | Magnetic Hover Button | button | [open](https://lofistack-asif-week1.vercel.app/components/magnetic-button) | [component.html](components/magnetic-button/component.html) | [prompt.md](components/magnetic-button/prompt.md) |
| 1 | Skeleton Screen Loader | loader | [open](https://lofistack-asif-week1.vercel.app/components/skeleton-loader) | [component.html](components/skeleton-loader/component.html) | [prompt.md](components/skeleton-loader/prompt.md) |

## Agent logs

| Week | Kind | Log |
|---|---|---|
| 1 | Code generation | [week-01-code-generation.md](agent-logs/week-01-code-generation.md) |

## How it works

Plain HTML, CSS and JavaScript — no frameworks. The code lives here on GitHub, and **Vercel** builds and hosts the site. Every change pushed to `main` goes live automatically in about a minute.

```
registry.json            ← the list of every component: name, type, week, description
components/<name>/
  component.html         ← the component itself (style + markup + script, self-contained)
  prompt.md              ← the final prompt that produced it
build.js                 ← turns the list + folders into the website (in public/)
vercel.json              ← tells Vercel to run build.js and serve public/
agent-logs/              ← one write-up per week
```

The code and prompt shown on each live page are read straight from the component's folder when the site is built, so the site and the repo always match.

### Adding a component

1. Make `components/<name>/` with `component.html` and `prompt.md`.
2. Add an entry to `registry.json`.
3. Push to `main`. Vercel rebuilds the site; the new page appears at `/components/<name>`.

To preview on your own computer first: run `node build.js` and open `public/index.html`.

## Built by

**Md Asif-Ud-Doula** — Senior Automation Engineer L4 · Service Team Lead · Operation Team · Client Acquisition Team
