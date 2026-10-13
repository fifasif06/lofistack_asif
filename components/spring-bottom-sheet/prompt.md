# Final prompt — Spring Bottom Sheet

Build a modal bottom sheet (open, onClose) in React + TypeScript + Tailwind (no libraries), portalled to body.

- rAF damped spring (stiffness 380, damping 30, mass 1), resting when speed + distance are tiny. Opens from off-screen; closes down, unmounting once off-screen.
- snapPoints: viewport-height fractions (default [0.5, 0.92]); initialSnap 0; onSnapChange.
- Drag handle/header (pointer capture; touch-action none there). On release, snap to the nearest velocity-projected point; a flick down over flickVelocity 1200px/s, or ending closeThreshold 0.25 of its height below the lowest point, closes. Rubber-band above the top.
- Content scrolls alone, overscroll-contain. Backdrop fades with the sheet; click closes (closeOnBackdrop true).
- Dialog role, aria-modal, labelled by title, described by description; focus in, Tab trapped, Escape closes, focus returns. Handle button (handleLabel "Resize sheet"): tap/Enter/Space cycle snaps, arrows move. closeLabel "Close". Lock body scroll + pad scrollbar.
- Reduced motion: fade only (fadeDuration 160ms).
- Look: #282219, 20px top corners, #37302a hairline, pill handle, optional pinned footer; full width on phones, max 480px; hover/focus-visible/active.
- Demo: "Open play queue" → 12 lofi tracks, now playing marked, Shuffle/Clear queue.
