# Final prompt — Magnetic Hover Button

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
