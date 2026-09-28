# Final prompt — 3D Tilt Profile Card

Build a 3D tilt profile card as one self-contained React component (a single `component.jsx` with its CSS inside a `<style>` tag — no libraries, nothing to install besides React).

Behavior:
- The card tilts in 3D toward the pointer: up to 14° at the edges, flat at the center (use `perspective` on a wrapper and `rotateX`/`rotateY` on the card).
- A soft, warm glare follows the pointer across the card and fades out when it leaves.
- The avatar, name, role, team tags, stats and button float at different depths (`translateZ` with `transform-style: preserve-3d`) so the card feels layered as it tilts.
- While moving, the tilt follows quickly (~90ms ease-out). On leave it springs back flat with a slight overshoot (~600ms).
- Works with mouse, pen and touch (pointer events). On touch, the card tilts while your finger drags on it and springs back when you lift it.
- Update CSS variables straight on the element inside `requestAnimationFrame` instead of re-rendering React on every pointer move.
- Turn the tilt and glare off if the visitor has "reduce motion" switched on.

Content (all props with defaults): name "Md Asif-Ud-Doula", role "Senior Automation Engineer L4", team tags "Service Team Lead", "Operation Team", "Client Acquisition", and three stats — 30 components, 13 agent logs, 90 days. The avatar shows the initials (skip a leading "Md"). A full-width "Follow" button toggles to "Following" (`aria-pressed`) with a visible focus outline.

Safety: prefix every class with `ls-tilt-` so it can't clash with the rest of the site.

Style: warm dark lofi palette — card gradient from #2c251c to #1a1612, border #37302a, cream text (#ece4d6), muted tan (#a2977f), amber accent (#e0985f); round amber gradient avatar; Geist for text and Geist Mono for small labels; 300px wide, 18px corners.
