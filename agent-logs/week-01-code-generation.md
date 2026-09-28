# Agent Log #1 — Code generation

**Week:** 1 (Sep 22–28, 2026) · **Kind:** Code generation · **Agent:** Claude (Cowork)
**Task:** Build the LofiStack gallery site and both Week 1 components with an AI agent.
**Code:** https://github.com/fifasif06/lofistack_asif

## Workflow

1. **Gave the agent the rules up front** instead of "make me a gallery": one list (`registry.json`) holds every component's name, type and week; each component lives in its own folder next to its final prompt; a small build script turns them into one page per component. So the code and prompt shown on each page are always exactly what's in the folder.
2. **Had the agent build both components** and save each final prompt beside its code.
3. **Made the agent test everything in a real browser:** click through the pages, measure the button actually moving and settling back, watch the loader switch and replay, check phone size, check for script errors.
4. **Changed hosting twice in one week without redoing anything.** Started on Next.js + Vercel, moved to plain HTML on GoHighLevel, then settled on plain HTML on GitHub + Vercel (push to GitHub → the site updates itself). Because every component is a self-contained folder, each move only meant rewriting the build script — the components and prompts never changed.
5. **Added an extra:** a 5-second original lofi clip on the loader's play button, generated with the Web Audio API (the browser's built-in sound tools, no audio file). The agent rendered it offline to check it never distorts (peak 0.895 of 1.0) and goes silent right at 5 seconds.

## What the agent caught that I would have missed

- The button's pull distance didn't match its hover zone, and a fix looked broken only because an old test server was still running. Found by measuring the button's real position, not by reading code.
- The loader's round avatar was rendering square because two style rules fought each other. Obvious in a screenshot, invisible in the code.
- After the upload to GitHub, the agent downloaded the repo and compared it file by file with its own copy — it caught that the folders had been skipped on the first upload and that one file was an older version.

## Result

A live gallery (home + 2 component pages). Each component has its own direct link with a live demo, full code, final prompt, links to the exact files on GitHub, and my details in the footer. Testing in a real browser stays in the loop for all 13 weeks.
