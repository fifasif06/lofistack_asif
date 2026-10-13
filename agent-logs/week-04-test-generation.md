# Agent Log #4 — Test generation

**Week:** 4 (Oct 13–19, 2026) · **Kind:** Test generation · **Agent:** Claude (Cowork)
**Task:** Have the agent write automated tests for every component in the gallery, then find out whether those tests actually catch anything.
**Tests:** `components/<name>/component.test.tsx` · **Run output:** [week-04-test-run.txt](week-04-test-run.txt) · **Code:** https://github.com/fifasif06/lofistack_asif

## The task

"Generate tests" is easy to ask for and easy to fake: an agent can write hundreds of tests that just repeat what the code already does, and they all pass. I wanted tests that check the **spec** — what each component *promised* to do — and proof that they would fail if the code broke.

Tools: Vitest + React Testing Library + jsdom (a pretend browser that runs in Node). `npm test` runs them all.

## Prompt

> Write tests for all 10 LofiStack components. Write them from each component's spec — its prompt.md and its typed props — not from the code. Test behaviour and accessibility: props and defaults, every state (loading, disabled, empty, error, success), keyboard use, ARIA roles and labels, callbacks, timers, and clean-up when it's removed (no timers left, sound closed, page scroll unlocked, focus returned). Run everything once before changing anything and write down the numbers. Then sort every failure into: the test was wrong, the component is wrong (a real bug), or the spec and code disagree on purpose. Fix real bugs in the smallest way and re-check them in a real browser. Then use the coverage report to find what's untested, and prove the tests catch broken code.

## What the agent did

1. **Spec first.** Read each prompt.md and props list, wrote 206 tests, ran nothing until all were written.
2. **First run, nothing changed:** 206 tests · **156 passed · 50 failed.**
3. **Sorted all 50 failures:**

| Failures | What it was | Kind |
|---|---|---|
| 41 | All timed out for one reason: Testing Library only "fast-forwards" its own little wait when it sees *Jest's* fake clock — with Vitest's fake clock it waits forever. Fixed with a 3-line helper in the test setup. | Test setup was wrong |
| 6 | Wrong guesses about markup or timing (caption text sits in an inner span; the chart's tooltip is hidden from screen readers on purpose because the bar already says "Wed: 64 minutes"; a countdown needs one second at a time) | Test was wrong |
| 2 | Bento tiles are named "title + badge", the prompt said "title" | Spec vs code, on purpose — kept |
| **1** | **The contact form sent the values with extra spaces** | **Real bug** |

4. **Fixed the real bug** (below), re-ran: **207 / 207 pass.**
5. **Coverage review.** The report showed what no test touched — and exposed one **hollow test**: the bottom sheet's "Tab stays inside the sheet" test passed for the wrong reason. The trap only counts *visible* buttons, jsdom has no layout so nothing is "visible", and focus just never moved. Added 20 tests for that and other untested promises (snapping after a fast drag, dragging by the header, a cancelled code check answering late, browsers without scroll detection). → **227 tests.**
6. **Proved the tests catch broken code.** The agent made 24 deliberate spec-breaking changes, one at a time, on throw-away copies (e.g. sort the wrong way, forget to return focus, drop an aria label). **Every one made at least one test fail.** 3 of the 24 were only caught by the 20 tests added after the coverage review.
7. **Checked for flaky tests:** 3 full runs in a row plus 2 runs in random order — 227/227 every time.

## The real bug

**Contact form: `onSend` got untrimmed values.** The form checks what you typed *after* removing extra spaces, and the "Thanks, Ada." message uses the trimmed name — but the data actually sent was the raw text. Type "  Ada  " and the server would get the spaces; a message could pass the "at least 10 characters" check on its trimmed length and still be sent padded. Fix: 4 lines, send exactly what was checked. Re-checked in a real browser at desktop and phone size with real typing: the fields still show what you typed, the sent data is trimmed, and the existing 44 browser checks for the form still pass.

## Result

| Component | Tests | Lines covered |
|---|---|---|
| Spring Bottom Sheet | 39 | 97.8% |
| Animated Bar Chart | 30 | 100% |
| Sortable Data Table | 27 | 98.4% |
| OTP Input | 25 | 100% |
| Floating-Label Contact Form | 21 | 100% |
| Shrink-on-Scroll Navbar | 20 | 100% |
| 3D Tilt Profile Card | 18 | 100% |
| Skeleton Screen Loader | 18 | 100% |
| Bento Feature Grid | 16 | 100% |
| Magnetic Hover Button | 13 | 100% |
| **All 10** | **227** | **99.4% lines · 93.3% branches** |

All pass in about 22 seconds. Any console error or warning during a test fails that test.

## What I learned

- **Most failures were the tests, not the code.** 49 of 50 first failures were test mistakes. If the agent had "fixed" the components to make tests pass, it would have broken working code. Sorting each failure before touching anything was the most important step.
- **A passing test can be hollow.** The focus-trap test was green and tested nothing. Coverage found it; reading the test alone didn't.
- **Prove the tests bite.** Breaking the code on purpose (24 times) is the only way to know the suite would catch a real mistake.
- **Know what fake browsers can't do.** jsdom has no layout, no sound and no real touch. Those parts were checked in a real browser (Chromium) when each component was built; the tests cover behaviour, ARIA, focus, timers and clean-up. Proof: the final browser pass over every page *after* the tests were green still found one bug — on a phone, tabbing to a table header could hide it under the pinned first column. No jsdom test could see that; it was fixed and re-checked in Chromium.
- **Being honest about "spec first":** while printing each props list, the agent also saw a few nearby lines of code (a sort helper, a maths helper). The tests follow the written spec, but they weren't written completely blind.
