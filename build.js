// Builds one paste-ready HTML block per page into ghl-pages/.
// Run:  node build.js
// Each output file goes into ONE GoHighLevel "Custom Code" element on its own page.
//
// Everything comes from registry.json + components/<slug>/{component.html,prompt.md},
// so the code and prompt shown on each page are always exactly what's in the folder.

const fs = require("fs");
const path = require("path");

const root = __dirname;
const reg = JSON.parse(fs.readFileSync(path.join(root, "registry.json"), "utf8"));
const out = path.join(root, "ghl-pages");
fs.mkdirSync(out, { recursive: true });

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---------- shared page styles (all scoped to .ls-page so GHL styles can't clash) ----------
const pageCss = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap">
<style>
  html, body { background: #16130f !important; margin: 0; }
  .ls-page {
    --bg: #16130f; --surface: #1f1b16; --surface-2: #282219; --border: #37302a;
    --fg: #ece4d6; --muted: #a2977f; --accent: #e0985f; --accent-soft: rgba(224,152,95,0.15);
    --sans: "Geist", system-ui, -apple-system, "Segoe UI", sans-serif;
    --mono: "Geist Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    background: var(--bg); color: var(--fg);
    font-family: var(--sans); font-size: 15px; line-height: 1.55;
    min-height: 100vh; display: flex; flex-direction: column;
    -webkit-font-smoothing: antialiased; text-align: left;
  }
  .ls-page *, .ls-page *::before, .ls-page *::after { box-sizing: border-box; }
  .ls-page [hidden] { display: none !important; }
  .ls-page ::selection { background: var(--accent); color: var(--bg); }
  .ls-page a { color: inherit; text-decoration: none; }
  .ls-page h1, .ls-page h2, .ls-page h3, .ls-page p, .ls-page ul, .ls-page pre { margin: 0; }

  .ls-wrap { width: 100%; max-width: 896px; margin: 0 auto; padding-inline: 24px; }
  @media (max-width: 480px) { .ls-wrap { padding-inline: 16px; } }

  .ls-top { border-bottom: 1px solid var(--border); }
  .ls-top .ls-wrap { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-block: 20px; }
  .ls-mark { font-family: var(--mono); font-size: 14px; letter-spacing: 0.02em; }
  .ls-mark b { color: var(--accent); font-weight: 400; }
  .ls-tag { font-family: var(--mono); font-size: 12px; color: var(--muted); }

  .ls-main { flex: 1; padding-block: 40px 56px; }
  .ls-foot { border-top: 1px solid var(--border); }
  .ls-foot-in { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px 24px; padding-block: 24px; }
  .ls-who { display: flex; flex-direction: column; gap: 2px; }
  .ls-who-name { font-size: 14px; font-weight: 500; color: var(--fg); }
  .ls-who-post { font-family: var(--mono); font-size: 12px; color: var(--muted); }
  .ls-page .ls-teams { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; }
  .ls-teams li { font-family: var(--mono); font-size: 11px; color: var(--muted); border: 1px solid var(--border); border-radius: 999px; padding: 3px 10px; white-space: nowrap; }

  .ls-stack { display: flex; flex-direction: column; gap: 40px; }
  .ls-group { display: flex; flex-direction: column; gap: 12px; }
  .ls-eyebrow { font-family: var(--mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: var(--muted); }
  .ls-page h1 { font-family: var(--sans); font-size: 26px; line-height: 1.2; font-weight: 600; color: var(--fg); text-wrap: balance; }
  .ls-lede { color: var(--muted); font-size: 15px; max-width: 36rem; }

  .ls-chip { background: var(--accent-soft); color: var(--accent); font-family: var(--mono); font-size: 11px; border-radius: 999px; padding: 2px 10px; white-space: nowrap; }
  .ls-week { font-family: var(--mono); font-size: 11px; color: var(--muted); }

  .ls-grid { list-style: none; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 640px) { .ls-grid { grid-template-columns: 1fr; } }
  .ls-card { display: flex; flex-direction: column; gap: 8px; height: 100%; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); padding: 20px; transition: border-color 160ms ease; }
  .ls-card:hover, .ls-card:focus-visible { border-color: var(--accent); outline: none; }
  .ls-card:hover .ls-card-name, .ls-card:focus-visible .ls-card-name { color: var(--accent); }
  .ls-card-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .ls-card-name { font-weight: 500; transition: color 160ms ease; }
  .ls-card p { color: var(--muted); font-size: 14px; }

  .ls-back { font-family: var(--mono); font-size: 12px; color: var(--muted); transition: color 160ms ease; align-self: flex-start; }
  .ls-back:hover, .ls-back:focus-visible { color: var(--accent); }
  .ls-title-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }

  .ls-stage { min-height: 256px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); padding: 40px 16px; overflow: hidden; }
  .ls-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .ls-copy { font-family: var(--mono); font-size: 11px; color: var(--muted); background: none; border: 1px solid var(--border); border-radius: 6px; padding: 4px 10px; cursor: pointer; transition: color 160ms ease, border-color 160ms ease; }
  .ls-copy:hover, .ls-copy:focus-visible { color: var(--accent); border-color: var(--accent); }
  .ls-panel { border: 1px solid var(--border); border-radius: 12px; background: var(--surface); padding: 20px; overflow-x: auto; font-family: var(--mono); font-size: 12px; line-height: 1.7; color: rgba(236,228,214,0.9); tab-size: 2; }
  .ls-panel.ls-wrapped { white-space: pre-wrap; }
</style>`;

const header = (home) => `
  <header class="ls-top">
    <div class="ls-wrap">
      <a class="ls-mark" href="${home}" target="_top"><b>lofi</b>stack</a>
      <span class="ls-tag">90-day build challenge</span>
    </div>
  </header>`;

// footer: owner details come from registry.json → "owner"
const o = reg.owner;
const footer = `
  <footer class="ls-foot">
    <div class="ls-wrap ls-foot-in">
      <div class="ls-who">
        <span class="ls-who-name">${esc(o.name)}</span>
        <span class="ls-who-post">${esc(o.post)}</span>
      </div>
      <ul class="ls-teams" aria-label="Teams">
${o.teams.map((t) => `        <li>${esc(t)}</li>`).join("\n")}
      </ul>
    </div>
  </footer>`;

const copyScript = `
<script>
  (function () {
    document.querySelectorAll(".ls-copy[data-copy]").forEach(function (btn) {
      if (btn.getAttribute("data-ls-ready")) return;
      btn.setAttribute("data-ls-ready", "1");
      btn.addEventListener("click", function () {
        var text = document.getElementById(btn.getAttribute("data-copy")).textContent;
        function done() { btn.textContent = "copied"; setTimeout(function () { btn.textContent = "copy"; }, 1500); }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () {});
        }
      });
    });
  })();
</script>`;

// ---------- home page ----------
const weeks = [...new Set(reg.components.map((c) => c.week))].sort((a, b) => a - b);
const homeBody = `
<div class="ls-page">${header(reg.homePath)}
  <main class="ls-main">
    <div class="ls-wrap ls-stack">
      <div class="ls-group">
        <h1>Component gallery</h1>
        <p class="ls-lede">One small, well-made UI piece at a time &mdash; 30 components and 13 agent logs over 90 days. Every component ships with a live demo, its code, and the final prompt that produced it.</p>
      </div>
${weeks
  .map(
    (w) => `      <section class="ls-group">
        <h2 class="ls-eyebrow">week ${w}</h2>
        <ul class="ls-grid">
${reg.components
  .filter((c) => c.week === w)
  .map(
    (c) => `          <li><a class="ls-card" href="${c.path}" target="_top">
            <span class="ls-card-top"><span class="ls-card-name">${esc(c.name)}</span><span class="ls-chip">${c.type}</span></span>
            <p>${esc(c.description)}</p>
          </a></li>`
  )
  .join("\n")}
        </ul>
      </section>`
  )
  .join("\n")}
    </div>
  </main>${footer}
</div>`;

fs.writeFileSync(path.join(out, "home.html"), `<!-- LofiStack · HOME page (path ${reg.homePath}) -->\n${pageCss}\n${homeBody}\n`);

// ---------- one page per component ----------
for (const c of reg.components) {
  const dir = path.join(root, "components", c.slug);
  const code = fs.readFileSync(path.join(dir, "component.html"), "utf8").trim();
  const prompt = fs.readFileSync(path.join(dir, "prompt.md"), "utf8").trim();

  const body = `
<div class="ls-page">${header(reg.homePath)}
  <main class="ls-main">
    <div class="ls-wrap ls-stack">
      <div class="ls-group">
        <a class="ls-back" href="${reg.homePath}" target="_top">&larr; all components</a>
        <div class="ls-title-row">
          <h1>${esc(c.name)}</h1>
          <span class="ls-chip">${c.type}</span>
          <span class="ls-week">week ${c.week}</span>
        </div>
        <p class="ls-lede">${esc(c.description)}</p>
      </div>

      <section class="ls-group">
        <h2 class="ls-eyebrow">demo</h2>
        <div class="ls-stage">
${code}
        </div>
      </section>

      <section class="ls-group">
        <div class="ls-head">
          <h2 class="ls-eyebrow">code &middot; html / css / js</h2>
          <button class="ls-copy" type="button" data-copy="ls-code-${c.slug}">copy</button>
        </div>
        <pre class="ls-panel" id="ls-code-${c.slug}">${esc(code)}</pre>
      </section>

      <section class="ls-group">
        <div class="ls-head">
          <h2 class="ls-eyebrow">final prompt</h2>
          <button class="ls-copy" type="button" data-copy="ls-prompt-${c.slug}">copy</button>
        </div>
        <pre class="ls-panel ls-wrapped" id="ls-prompt-${c.slug}">${esc(prompt)}</pre>
      </section>
    </div>
  </main>${footer}
</div>`;

  fs.writeFileSync(
    path.join(out, `${c.slug}.html`),
    `<!-- LofiStack · ${c.name} page (path ${c.path}) -->\n${pageCss}\n${body}\n${copyScript}\n`
  );
}

console.log("Built", 1 + reg.components.length, "pages into ghl-pages/");
