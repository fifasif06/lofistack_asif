# Final prompt — OTP Input

Build a 6-digit one-time-code (OTP) input as one self-contained React component (a single `component.jsx` with its CSS inside a `<style>` tag — no libraries).

Layout: a title "Enter your code", a line "We sent a 6-digit code to ••• ••• 4821", six square boxes with a small dash between the 3rd and 4th, a status line, and a resend button.

Typing:
- Digits only. Each box takes one digit and jumps to the next box.
- Backspace on an empty box clears the previous box and moves back. Left/Right arrows, Home and End move between boxes. Clicking or focusing a box selects its digit so typing replaces it.
- Pasting a code into any box spreads the digits across the boxes from that point (ignore spaces and dashes).
- Phones: `inputMode="numeric"` for the number pad, and `autoComplete="one-time-code"` on the first box so iOS/Android can autofill the code from a text message — handle the whole code arriving in one box.

Checking:
- As soon as all six digits are in, check the code automatically: boxes dim and the status says "Checking…".
- Right code → boxes turn soft green and the status says "Verified — you're in." with a "start over" button.
- Wrong code → boxes turn red, the row shakes, the status says "That code didn't match. Try again.", then the boxes clear and focus goes back to the first box.
- The check is a `verify` prop (returns true/false). The demo version waits 0.7s and accepts 246810.

Resend: the button counts down "resend code in 0:30" and only becomes clickable at zero. Clicking it clears the boxes and restarts the timer.

Accessibility: the boxes are in a `<fieldset>` with a hidden legend "One-time code, 6 digits", each box has `aria-label="Digit N of 6"`, and the status line is `role="status"` so screen readers hear the result. Turn off the shake if "reduce motion" is on. Shrink the boxes on very small screens so all six fit.

Prefix every class with `ls-otp-`. Style: warm dark lofi palette — boxes #282219 with #37302a borders, 10px corners, 46×56px, digits in Geist Mono 24px, amber (#e0985f) caret and focus ring, cream text (#ece4d6), muted tan (#a2977f) secondary text.
