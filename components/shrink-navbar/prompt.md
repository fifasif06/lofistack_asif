# Final prompt — Shrink-on-Scroll Navbar

Build a shrink-on-scroll navbar in React + TypeScript, styled only with Tailwind CSS v4 (no libraries).

Props (typed, JSDoc): brand, links ({ label, href }[]), activeHref, onNavigate(href, event), cta ({ label, href?, onClick? }), shrinkAt 24, showProgress true, scrollContainer (ref, default window), tallHeight 80, compactHeight 56, brandScale 0.86, label "Main", menuLabel "Menu", className.

Behaviour: a sticky header that keeps its tall height in the flow (no layout jump; its empty part passes clicks). Past shrinkAt the bar eases (300ms) to compact height and padding, the brand scales down, and the transparent background becomes blurred #1f1b16/80 with a #37302a hairline and soft shadow. A 2px amber bottom line shows scroll progress. One passive rAF-throttled scroll listener; re-render only when shrunk flips; progress via a CSS variable.

Links muted, cream on hover; active = aria-current="page" + amber underline. Amber pill CTA with hover/pressed states. Container queries: under 672px the links fold into a dropdown panel behind a menu button (aria-expanded, aria-controls); under 448px the CTA moves in too. Escape or an outside click closes it and refocuses the button (unless you clicked another control); choosing a link or tabbing out closes it.

2px amber focus-visible outlines; reduced motion = no transitions.
