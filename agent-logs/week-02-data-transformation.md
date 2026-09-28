# Agent Log #2 — Data transformation

**Week:** 2 (Sep 29 – Oct 5, 2026) · **Kind:** Data transformation · **Agent:** Claude (Cowork)
**Task:** Take a raw export (this repo's full commit history), turn it into a clean CSV, and turn that CSV into a formatted report.
**Data:** [week-02-repo-history.csv](week-02-repo-history.csv) · **Code:** https://github.com/fifasif06/lofistack_asif

## The task

The Week 5 and Week 13 agent logs will be built from this repo's history, so I wanted to know now: is the history actually useful as data? The raw export from git is a wall of text: commit IDs, dates, messages, and a list of changed files with line counts. It's not something you can read or sort.

## Prompt

> Export the full commit history of the lofistack_asif repo. Turn it into a CSV with one row per file changed per commit: date, time, commit, message, author, file, area, lines added, lines removed. Group files into plain areas (each component, site code, build & config, README, registry, agent logs, retired GoHighLevel pages, removed submissions) and keep the auto-written package-lock file separate so it doesn't inflate the numbers. Then write a short report: headline numbers, a table by area, the timeline of the day in phases, the biggest changes, and what the data says about how the repo is being used. Check every total adds up before writing it.

## What the agent did

1. **Exported** the history with `git log --numstat` (every commit plus how many lines each file gained or lost).
2. **Reshaped it** into a CSV: 55 rows (one per file per commit) across 21 commits. Dates and times are in New York time.
3. **Labelled every file with an area** from its folder, so `components/otp-input/component.jsx` → "component: otp-input" and `ghl-pages/...` → "GoHighLevel pages (retired)".
4. **Split out the noise.** `package-lock.json` is 921 lines that npm writes by itself. Left in, it would look like the biggest piece of work in the repo. It got its own area.
5. **Totalled by area and by commit,** then checked the area totals add up to the grand totals (4,224 added / 1,735 removed) before writing anything.

## The report

**Repo activity — everything up to Sep 28, 2026, 16:56**

| | |
|---|---|
| Commits | 21 |
| File changes | 55 |
| Lines added | 4,224 (1,899 of them hand-written¹) |
| Lines removed | 1,735 |
| Days with activity | 1 (Sep 28) |

¹ Leaves out the auto-written package-lock and files that were added and later deleted (GoHighLevel pages, submissions).

**By area**

| Area | Commits | Files | Added | Removed | Net |
|---|---|---|---|---|---|
| GoHighLevel pages (retired) | 3 | 4 | +1,293 | −1,293 | 0 |
| package-lock (auto-written) | 1 | 1 | +921 | −0 | +921 |
| build & config | 6 | 6 | +373 | −271 | +102 |
| component: skeleton-loader | 1 | 2 | +350 | −0 | +350 |
| site code (React) | 1 | 10 | +310 | −0 | +310 |
| component: floating-label-form | 1 | 2 | +227 | −0 | +227 |
| component: otp-input | 2 | 2 | +188 | −1 | +187 |
| component: tilt-profile-card | 1 | 2 | +167 | −0 | +167 |
| submissions (removed) | 2 | 1 | +111 | −111 | 0 |
| component: magnetic-button | 1 | 2 | +97 | −0 | +97 |
| README | 6 | 1 | +90 | −36 | +54 |
| registry | 3 | 1 | +54 | −3 | +51 |
| agent logs | 2 | 1 | +43 | −20 | +23 |

**The day in four phases**

| Time | Phase | What happened |
|---|---|---|
| 14:50–14:57 | Upload | Week 1 arrives in 2 big uploads (2,170 lines, 14 files). The submissions folder is deleted 5 minutes later. |
| 15:21–15:44 | Move to GitHub + Vercel | 10 small edits by hand in the browser: Vercel config, package file, build script. Then the GoHighLevel pages and docs are deleted (−1,293 lines). |
| 16:05 | Tidy | README fix. |
| 16:40–16:56 | Week 2 | React site + 3 new components in 5 commits over 2 minutes, then an OTP fix and the new single site address. |

**Biggest changes**

1. `a79af3f` Week 1 upload: +1,872 lines, 10 files. Most of it was the GoHighLevel pages that were deleted within the hour.
2. `90ce8ed` Delete ghl-pages: −1,251 lines.
3. `9b9e66d` Switch to React + Vite: +1,035 / −257. But 921 of the +1,035 is the auto-written package-lock. Without it the change is +114 / −257, so the switch made the repo *smaller* by hand-written lines: `build.js` shrank from 252 lines to 40, because React now builds the pages.

## What the data says

- **The history only starts on Sep 28.** All Week 1 work before that day happened outside git. The Week 5 and Week 13 logs can only look back to Sep 28. From now on it's one commit per piece of work, with clear messages, so the history stays useful.
- **More than half of all added lines were thrown away or auto-written.** Of 4,224 lines added, 1,293 (GoHighLevel) and 111 (submissions) were deleted again, and 921 were written by npm. Counting raw lines would badly overstate the work, so areas matter more than totals.
- **Components are small and even.** Each is 1 code file + 1 prompt, 97–350 lines. The React versions (167–227 lines) are shorter than the plain-HTML skeleton loader (350), even though they include their styles.
- **Most commit messages say nothing.** 14 of 21 are GitHub's automatic ones ("Add files via upload", "Update README.md", "Delete docs directory"). Only the 7 Week 2 commits say what changed and why. Writing a real message on every upload makes the Week 5 and Week 13 logs much easier.

## What I learned

- Get the data into rows first, then ask questions. The raw git log answered nothing. The CSV answered everything above in one pass.
- Decide what counts before you count. Separating the auto-written file and the deleted folders changed the story from "the React switch added 1,000 lines" to "the React switch removed more hand-written code than it added".
- Always check the totals. The agent confirmed the area totals matched the grand totals before writing the report, so every number above traces back to a row in the CSV.
