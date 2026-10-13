# Final prompt — OTP Input

Build a one-time-code input: one React + TypeScript component, Tailwind CSS v4 classes only, no libraries.

- Props (defaults): length 6, resendSeconds 30, verify(code, signal) → true/false (demo default accepts demoCode "246810" after 700 ms), errorDelay 900 ms, sentTo "••• ••• 4821", title "Enter your code", subtitle "We sent a 6-digit code to {sentTo}", text overrides, onVerified, onResend.
- One box per digit, a dash in the middle. Digits only, auto-advance; Backspace in an empty box clears the one before; arrows, Home, End move; focus selects. Paste spreads digits from that box. inputMode numeric; box 1 has autocomplete one-time-code and takes the whole code.
- When full, check at once: boxes dim, "Checking…". Right: soft green, "Verified — you're in.", "start over". Wrong: red, row shakes, "That code didn't match. Try again.", then clear and refocus box 1; the message stays until the next digit.
- Resend counts down "resend code in 0:30", clickable at zero; clears the boxes, restarts.
- fieldset with sr-only legend, aria-label per box, role="status" line. Clear all timers, abort the check on unmount. Container query shrinks boxes 46×56 → 38×48; no shake with reduced motion.
- Look: boxes #282219, #37302a borders, 10px corners, Geist Mono digits, amber caret and focus ring.
