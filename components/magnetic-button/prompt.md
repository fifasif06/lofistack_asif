# Final prompt — Magnetic Hover Button

Build a MagneticButton in React + TypeScript (strict) + Tailwind CSS v4. No libraries.

- An invisible "pull zone" reaches `radius` px (default 60) past the button's edges. While a mouse is inside it, the button slides toward the cursor by `pull` (0.35) of the cursor's distance from its centre, measured from the button's edges so wide buttons feel as magnetic as round ones. The label travels a little further (`labelPull` 0.2) for depth.
- Fast ease-out (~120ms) while pulled; on leave it bounces back with an overshoot curve (~480ms). Write the translate straight to the elements, so mouse moves never re-render React.
- Mouse only: touch and pen get a normal button. No magnet with "reduce motion", when disabled, or while loading.
- Props: extends the native button attributes; children, pull, labelPull, radius, loading (spinner, aria-busy, blocks clicks), variant "solid" | "outline".
- States: hover (lighter amber), pressed (scale 0.96), focus-visible (2px amber outline, 4px offset), disabled (faded, not-allowed cursor), loading.
- Look: pill shape, amber #e0985f with dark #16130f text and a soft amber glow; outline variant = amber border and text on dark. Medium-weight Geist label.
