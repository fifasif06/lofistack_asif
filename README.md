# LofiStack

A 90-day component gallery (Sep 22 – Dec 20, 2026): **30 UI components and 13 agent logs**, one small, well-made piece at a time.

Every component has its own live page with a working demo, its full code, and the final prompt that produced it.

**Live site:** https://lofistack-asif-gallery.vercel.app — one address for every week.

## Components

| Week | Component | Type | Live page | Code | Prompt |
|---|---|---|---|---|---|
| 1 | Magnetic Hover Button | button | [open](https://lofistack-asif-gallery.vercel.app/components/magnetic-button) | [component.html](components/magnetic-button/component.html) | [prompt.md](components/magnetic-button/prompt.md) |
| 1 | Skeleton Screen Loader | loader | [open](https://lofistack-asif-gallery.vercel.app/components/skeleton-loader) | [component.html](components/skeleton-loader/component.html) | [prompt.md](components/skeleton-loader/prompt.md) |
| 2 | 3D Tilt Profile Card | card | [open](https://lofistack-asif-gallery.vercel.app/components/tilt-profile-card) | [component.jsx](components/tilt-profile-card/component.jsx) | [prompt.md](components/tilt-profile-card/prompt.md) |
| 2 | Floating-Label Contact Form | form | [open](https://lofistack-asif-gallery.vercel.app/components/floating-label-form) | [component.jsx](components/floating-label-form/component.jsx) | [prompt.md](components/floating-label-form/prompt.md) |
| 2 | OTP Input | input | [open](https://lofistack-asif-gallery.vercel.app/components/otp-input) | [component.jsx](components/otp-input/component.jsx) | [prompt.md](components/otp-input/prompt.md) |

## Agent logs

| Week | Kind | Log |
|---|---|---|
| 1 | Code generation | [week-01-code-generation.md](agent-logs/week-01-code-generation.md) |
| 2 | Data transformation | [week-02-data-transformation.md](agent-logs/week-02-data-transformation.md) |

## How it works

**React + Vite** (from Week 2 on; Week 1 was plain HTML). The code lives here on GitHub, and **Vercel** builds and hosts the site. Every change pushed to `main` goes live automatically in about a minute.

```
registry.json            ← the list of every component: name, type, week, description
components/<name>/
  component.jsx          ← the component (React, styles included) — Week 2 on
  component.html         ← Week 1 components stay as the plain HTML they were built as
  prompt.md              ← the final prompt that produced it
src/                     ← the site itself: gallery, component page, header and footer
build.js                 ← builds the site into dist/ (one page per component)
vercel.json              ← tells Vercel how to build and serve it
agent-logs/              ← one write-up per week
```

Page addresses: `/` is the gallery and `/components/<name>` is each component. The code and prompt shown on each page are read straight from the component's folder, so the site and the repo always match.

### Adding a component

1. Make `components/<name>/` with `component.jsx` (default export = the component) and `prompt.md`.
2. Add an entry to `registry.json` (an optional `hint` shows a tip under the demo).
3. Push to `main`. Vercel rebuilds the site; the new page appears at `/components/<name>`.

To preview on your own computer first: `npm install`, then `npm run dev`.

## Built by

**Md Asif-Ud-Doula** — Senior Automation Engineer L4 · Service Team Lead · Operation Team · Client Acquisition Team
