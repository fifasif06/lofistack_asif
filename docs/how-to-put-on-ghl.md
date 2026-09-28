# How to put LofiStack live on GoHighLevel

You'll make **3 pages** in GHL. Each page gets **one Custom Code element**, and you paste one file into it. That's it.

| GHL page | Page path (URL ending) | Paste this file |
|---|---|---|
| Home | `/` | `ghl-pages/home.html` |
| Magnetic Hover Button | `/magnetic-button` | `ghl-pages/magnetic-button.html` |
| Skeleton Screen Loader | `/skeleton-loader` | `ghl-pages/skeleton-loader.html` |

## Steps (do this once per page)

1. In GHL go to **Sites → Websites** (or **Funnels**) and create a new site called **LofiStack**.
2. Add a page. Set its **path** exactly as in the table above.
3. Open the page in the builder. Delete everything on it.
4. Add a **Section** → set it to **Full width**, and set its **padding to 0** on all sides.
5. Inside it, add a **Row** with one column (also padding 0), then drag in a **Custom Code** element (sometimes called "Code" or "Custom HTML/JS").
6. Open the matching file from `ghl-pages/`, copy **all** of it, paste it into the Custom Code box, and save.
7. In the page **Settings**, set the background color to `#16130f` (dark brown) so no white edges show.
8. **Save**, then **Preview** — hover the button, watch the loader.

When all 3 pages are done, **Publish** the site. Your direct links will be:

- `https://YOUR-DOMAIN/magnetic-button`
- `https://YOUR-DOMAIN/skeleton-loader`

Those direct links are what you post for the challenge — never the homepage.

## If a link goes to the wrong place

GHL sometimes adds its own start to the URL (for funnels it can look like `/lofistack-home`). If your paths end up different from the table:

1. Open `registry.json` and change `homePath` and each `path` to match what GHL gave you.
2. Run `node build.js` (or ask Claude to do it).
3. Re-paste the updated files.

## Adding a new component (every week)

1. Make a folder `components/<name>/` with `component.html` (the piece) and `prompt.md` (the final prompt — required, or the submission doesn't count).
2. Add one entry to `registry.json`.
3. Run `node build.js`.
4. Make one new GHL page with the new file, and re-paste `home.html` so the homepage shows it.
