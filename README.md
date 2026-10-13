# LofiStack

A 90-day component gallery (Sep 22 – Dec 20, 2026): **30 UI components and 13 agent logs**, one small, well-made piece at a time.

Every component has its own live page with a working demo, a usage example, its full code, and the final prompt that produced it.

**Live site:** https://lofistack-asif-gallery.vercel.app — one address for every week.

## Components

| Week | Component | Type | Live page | Code | Usage | Prompt |
|---|---|---|---|---|---|---|
| 1 | Magnetic Hover Button | button | [open](https://lofistack-asif-gallery.vercel.app/components/magnetic-button) | [component.tsx](components/magnetic-button/component.tsx) | [demo.tsx](components/magnetic-button/demo.tsx) | [prompt.md](components/magnetic-button/prompt.md) |
| 1 | Skeleton Screen Loader | loader | [open](https://lofistack-asif-gallery.vercel.app/components/skeleton-loader) | [component.tsx](components/skeleton-loader/component.tsx) | [demo.tsx](components/skeleton-loader/demo.tsx) | [prompt.md](components/skeleton-loader/prompt.md) |
| 2 | 3D Tilt Profile Card | card | [open](https://lofistack-asif-gallery.vercel.app/components/tilt-profile-card) | [component.tsx](components/tilt-profile-card/component.tsx) | [demo.tsx](components/tilt-profile-card/demo.tsx) | [prompt.md](components/tilt-profile-card/prompt.md) |
| 2 | Floating-Label Contact Form | form | [open](https://lofistack-asif-gallery.vercel.app/components/floating-label-form) | [component.tsx](components/floating-label-form/component.tsx) | [demo.tsx](components/floating-label-form/demo.tsx) | [prompt.md](components/floating-label-form/prompt.md) |
| 2 | OTP Input | input | [open](https://lofistack-asif-gallery.vercel.app/components/otp-input) | [component.tsx](components/otp-input/component.tsx) | [demo.tsx](components/otp-input/demo.tsx) | [prompt.md](components/otp-input/prompt.md) |
| 3 | Shrink-on-Scroll Navbar | navbar | [open](https://lofistack-asif-gallery.vercel.app/components/shrink-navbar) | [component.tsx](components/shrink-navbar/component.tsx) | [demo.tsx](components/shrink-navbar/demo.tsx) | [prompt.md](components/shrink-navbar/prompt.md) |
| 3 | Bento Feature Grid | section | [open](https://lofistack-asif-gallery.vercel.app/components/bento-feature-grid) | [component.tsx](components/bento-feature-grid/component.tsx) | [demo.tsx](components/bento-feature-grid/demo.tsx) | [prompt.md](components/bento-feature-grid/prompt.md) |
| 4 | Sortable Data Table | table | [open](https://lofistack-asif-gallery.vercel.app/components/sortable-table) | [component.tsx](components/sortable-table/component.tsx) | [demo.tsx](components/sortable-table/demo.tsx) | [prompt.md](components/sortable-table/prompt.md) |
| 4 | Animated Bar Chart | chart | [open](https://lofistack-asif-gallery.vercel.app/components/animated-bar-chart) | [component.tsx](components/animated-bar-chart/component.tsx) | [demo.tsx](components/animated-bar-chart/demo.tsx) | [prompt.md](components/animated-bar-chart/prompt.md) |
| 4 | Spring Bottom Sheet | modal | [open](https://lofistack-asif-gallery.vercel.app/components/spring-bottom-sheet) | [component.tsx](components/spring-bottom-sheet/component.tsx) | [demo.tsx](components/spring-bottom-sheet/demo.tsx) | [prompt.md](components/spring-bottom-sheet/prompt.md) |

## Agent logs

| Week | Kind | Log |
|---|---|---|
| 1 | Code generation | [week-01-code-generation.md](agent-logs/week-01-code-generation.md) |
| 2 | Data transformation | [week-02-data-transformation.md](agent-logs/week-02-data-transformation.md) |
| 3 | Design to code | [week-03-design-to-code.md](agent-logs/week-03-design-to-code.md) |
| 4 | Test generation | [week-04-test-generation.md](agent-logs/week-04-test-generation.md) |

## How it works

**React + TypeScript + Tailwind CSS**, built with Vite. The code lives here on GitHub, and **Vercel** builds and hosts the site. Every change pushed to `main` goes live automatically in about a minute.

```
registry.json            ← the list of every component and agent log
components/<name>/
  component.tsx          ← the component: typed props (TypeScript), styled with Tailwind
  demo.tsx               ← the live demo — also shown on the page as the usage example
  prompt.md              ← the final prompt that produced it
  component.test.tsx     ← its tests (Vitest + React Testing Library)
src/                     ← the site itself: gallery, component page, header and footer
build.js                 ← type-checks, then builds the site into dist/ (one page per component)
vercel.json              ← tells Vercel how to build and serve it
agent-logs/              ← one write-up per week
```

Page addresses: `/` is the gallery and `/components/<name>` is each component. The demo, code and prompt shown on each page are read straight from the component's folder, so the site and the repo always match.

### Standards every component follows

- TypeScript (strict) with an exported, documented props interface — no hard-coded content.
- Tailwind CSS classes only (plus a tiny keyframes block where an animation needs one).
- Hover, focus, pressed, disabled and loading states; empty and error states for data components.
- Keyboard-only use, screen-reader labels, visible focus rings, "reduce motion" respected.
- Works on a 375px phone and on desktop (components respond to the space they get, using container queries).

### Adding a component

1. Make `components/<name>/` with `component.tsx`, `demo.tsx` (default export = the demo), `prompt.md` and `component.test.tsx`.
2. Add an entry to `registry.json` (optional `hint` = a tip under the demo, `stage: "wide"` = full-width demo).
3. Push to `main`. Vercel rebuilds the site; the new page appears at `/components/<name>`.

On your own computer: `npm install`, then `npm run dev` (live preview), `npm test` (all tests) or `npm run build` (type-check + build).

## Built by

**Md Asif-Ud-Doula** — Senior Automation Engineer L4 · Service Team Lead · Operation Team · Client Acquisition Team
