# Final prompt — 3D Tilt Profile Card

Build a TiltProfileCard in React + TypeScript (strict) + Tailwind CSS v4. No libraries.

- Tilts in 3D toward the pointer: 900px perspective, up to maxTilt (14°) at the edges, flat in the middle. Pointer events on a flat wrapper, so mouse, pen and touch work (finger drag tilts, lift springs back).
- A warm glare follows the pointer, fading on leave. Avatar, name, role, tags, stats and button float at different depths (translate-z, preserve-3d).
- Follow fast (~90ms ease-out); on leave spring back with slight overshoot (~600ms). Write CSS variables in requestAnimationFrame: no re-render per move.
- No tilt or glare with reduced motion.
- Props with defaults: name "Md Asif-Ud-Doula", role "Senior Automation Engineer L4", tags, stats ({label, value}: 30 components, 13 agent logs, 90 days), initials (from the name, skipping a leading "Md"), maxTilt, perspective, follow/spring ms, width 300. Hide empty tag/stat rows.
- Full-width "Follow" button toggles to "Following" (aria-pressed); followed + onFollowChange, controlled or not; labels are props; followLoading spinner; followDisabled. Hover, active, focus-visible.
- Look: 18px corners, gradient #2c251c → #1a1612, border #37302a, text #ece4d6, muted #a2977f, amber gradient avatar, amber #e0985f tag pills, Geist Mono labels.
