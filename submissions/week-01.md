# Week 1 submission: ready to post

Make **3 separate posts** in the team channel, one per box below. Copy each box exactly.

## Before you post (5 minutes)

- [ ] **Search the channel** for "magnetic" and "skeleton". If someone already posted one, tell Claude and we'll swap it from the backup list.
- [ ] **Open both live links in an incognito window** (a private window with no GHL login) and check the demo, code and prompt show up.
- [ ] **Repo link:** replace `YOUR-GITHUB-NAME` in posts 1 and 2 with your GitHub username once the code is uploaded (steps at the bottom).

## Post 1: Magnetic Hover Button

```text
WEEK 1 · COMPONENT 1 of 2

Name: Magnetic Hover Button
Type: button
Live link: https://url.lofistack.com/preview/xR5h6SAYfYBDvMlMMAyX
Repo (code): https://github.com/YOUR-GITHUB-NAME/lofistack_asif/blob/main/components/magnetic-button/component.html
Repo (prompt): https://github.com/YOUR-GITHUB-NAME/lofistack_asif/blob/main/components/magnetic-button/prompt.md

What it does: A button that leans toward your cursor as you get close and springs back to rest when you leave. The label moves a little further than the button for a sense of depth. Mouse only, so taps on phones work like a normal button, and it switches off for people who have "reduce motion" turned on.

Built with: plain HTML, CSS and JavaScript (no libraries), hosted on GoHighLevel.

Final prompt:
Build a magnetic hover button as one self-contained block of plain HTML, CSS and JavaScript (no frameworks, no libraries) that I can paste into a GoHighLevel custom code element.

Behavior:
- Wrap the button in an invisible "pull zone" that reaches 60px past its edges. While the mouse is inside that zone, the button slides toward the cursor by about 35% of the cursor's distance from the button's center.
- Measure the distance from the button's edges, not its center, so a wide button feels as magnetic as a square one.
- The label inside moves a little further than the button itself, for a subtle depth effect.
- When the mouse leaves, the button bounces back to rest: use a fast ease-out (~120ms) while it's being pulled and a slower overshoot curve (~480ms) for the bounce back.
- Mouse only: ignore touch and pen, so taps on phones act like a normal button.
- Turn the effect off entirely if the visitor has "reduce motion" switched on.
- Use a real `<button>` with a visible focus outline for keyboard users.
- Prefix every class with `ls-`, wrap the script in a function, and guard against wiring the same button twice, so it can't clash with the page builder's own styles or scripts.

Style: pill shape, warm amber background (#e0985f), dark brown text (#16130f), medium-weight label that says "Hover me".
```

## Post 2: Skeleton Screen Loader

```text
WEEK 1 · COMPONENT 2 of 2

Name: Skeleton Screen Loader
Type: loader
Live link: https://url.lofistack.com/preview/DCOLSlT17OhifdbPBSAm
Repo (code): https://github.com/YOUR-GITHUB-NAME/lofistack_asif/blob/main/components/skeleton-loader/component.html
Repo (prompt): https://github.com/YOUR-GITHUB-NAME/lofistack_asif/blob/main/components/skeleton-loader/prompt.md

What it does: A shimmering placeholder card with the exact shape of the real content. After about 2 seconds it fades into the real card, a pretend "lofistack radio" playlist. Press play on the artwork for an original 5-second lofi clip, made live in the browser with no audio file: jazzy chords, a lazy swung beat, tape hiss and vinyl crackle. "Replay loading" runs the whole thing again.

Built with: plain HTML, CSS and JavaScript (no libraries, no audio files), hosted on GoHighLevel.

Final prompt:
Build a skeleton screen loader as one self-contained block of plain HTML, CSS and JavaScript (no frameworks, no libraries, no audio files) that I can paste into a GoHighLevel custom code element.

Loading behavior:
- Show a placeholder card with the exact same shape as the real card: an image block (4:3), a title line, a shorter subtitle line, and a row with a small circle and a short line.
- Every placeholder block has a soft shimmer — a faint light band sweeping left to right on a ~1.4s loop, done in CSS only.
- Pretend to load for about 2.2 seconds, then swap to the real card with a short fade-and-rise (~400ms).
- Add a small "replay loading" button under the card that restarts the whole thing (and stops any music playing).
- Put both states in the HTML and toggle them with the `hidden` attribute (include a CSS rule so `hidden` always wins over the page builder's styles).

Play button and 5-second radio clip:
- On the real card's artwork, add a round amber play button (inline SVG play icon, switching to a pause icon while playing) next to the label "side b · 5 sec preview".
- Clicking it plays a 5-second original lofi clip generated live with the Web Audio API — nothing to download or host. The clip: jazzy chords Dm9 → G13 → Cmaj9 → Am7 (1.25s each) on a soft electric-piano tone (sine + a little triangle + a quiet octave), a tiny strum between notes, a slow "tape wobble" that bends the pitch a few cents, a round sine bass on each chord's root, a lazy swung drum beat at 72 BPM (soft kick, noise snare, quiet hi-hats with late off-beats), steady quiet tape hiss and random soft vinyl pops.
- Run everything through a warm low-pass filter and a limiter so it never clips; fade in quickly and fade out over the last second.
- A thin amber progress line fills along the bottom of the artwork over the 5 seconds. Clicking again stops it early. When it ends, the button resets.
- Only create the audio when the button is clicked (browsers block sound before a click). Give the button an `aria-label` that changes between "Play 5-second lofistack radio clip" and "Stop clip".

Accessibility: the card sets `aria-busy` while loading and `aria-live="polite"` so screen readers hear the change. Turn animations off if the visitor has "reduce motion" on.

Safety with the page builder: prefix every class with `ls-`, wrap the script in a function, and guard against wiring it twice.

Style: warm dark lofi palette — deep brown card (#282219), cream text (#ece4d6), muted tan secondary text (#a2977f), amber accent (#e0985f). The real card is a pretend "lofi radio" playlist: "rainy window study mix", "1 hr 12 min · tape hiss included", station "lofistack radio".
```

## Post 3: Agent Log #1

```text
WEEK 1 · AGENT LOG #1

Kind: Code generation
Agent: Claude (Cowork)
Task: Build the LofiStack gallery site and both Week 1 components with an AI agent.
Site: https://url.lofistack.com/preview/4jvzDvx4QbbGn6NMBAus
Repo (this log): https://github.com/YOUR-GITHUB-NAME/lofistack_asif/blob/main/agent-logs/week-01-code-generation.md

Workflow:
1. Gave the agent the rules up front instead of "make me a gallery": one list (registry.json) holds every component's name, type, week and link; each component lives in its own folder next to its final prompt; a small build script turns them into one paste-ready page per component. So the code and prompt shown on each page are always exactly what's in the folder.
2. Had the agent build both components and save each final prompt beside its code.
3. Made the agent test everything in a real browser: click through the pages, measure the button actually moving and settling back, watch the loader switch and replay, check phone size, check for script errors.
4. Switched hosting mid-week from Vercel to GoHighLevel. Because of the folder setup, this meant rewriting two small files and the build script, not redoing the project. Every class is prefixed and every script guarded, so nothing clashes with GHL's own styles.
5. Added an extra: a 5-second original lofi clip on the loader's play button, generated with the Web Audio API (the browser's built-in sound tools). The agent rendered it offline to check it never distorts (peak 0.895 of 1.0) and goes silent right at 5 seconds.

What the agent caught that I would have missed:
- The button's pull distance didn't match its hover zone, and a fix looked broken only because an old test server was still running. Found by measuring the button's real position, not by reading code.
- The loader's round avatar was rendering square because two style rules fought each other. Obvious in a screenshot, invisible in the code.

Result: 3 GHL pages (home + 2 components). Each component has its own direct link with live demo, full code and final prompt, and my details in the footer. Testing in a real browser stays in the loop for all 13 weeks.
```

## Getting the code on GitHub (for the repo link)

1. Go to github.com → **New repository** → name it `lofistack_asif` → **Public** → Create.
2. On the new repo page, click **uploading an existing file**.
3. Unzip `lofistack-ghl.zip`, open the `lofistack-html` folder, select **everything inside it**, and drag it into GitHub → **Commit changes**. (Or let Claude push it for you.)
4. Your file links are then exactly the ones in posts 1 and 2 with your username filled in.
