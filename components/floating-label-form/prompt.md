# Final prompt — Floating-Label Contact Form

Build a floating-label contact form as one self-contained React component (a single `component.jsx` with its CSS inside a `<style>` tag — no form libraries).

Fields: Your name, Email, Subject (marked "optional"), Message (a textarea that grows as you type, 500-character limit with a live "0/500" counter that turns amber in the last 50).

Floating labels:
- Each label sits inside its field like a placeholder, and floats up and shrinks (~180ms) when the field is focused or has text. The label turns amber while its field is focused.
- Do it in CSS with the `placeholder=" "` + `:not(:placeholder-shown)` trick so it also works when the browser autofills the field. Style autofilled fields so they keep the dark look. Put the `-webkit-autofill` label rule on its own line so a browser that doesn't know it can't cancel the main rule.
- Use real `<label for>` elements (not placeholders) so screen readers read them.

Checks (friendly, plain words):
- Check a field when you leave it, not while you're first typing. Once a field has shown an error, re-check it live so the error disappears the moment it's fixed.
- Name required; email required and must look like an email; message at least 10 characters.
- Errors show in soft red under the field, linked with `aria-describedby` and `aria-invalid`.
- On submit, check everything and move focus to the first field with a problem.

Sending:
- The button shows a small spinner and "Sending…" while it waits, and the fields lock. Use a pretend 1.2-second send by default, passed in as an `onSend` prop so a real request can replace it.
- Then show a success panel with a check icon: "Thanks, {name}. Message sent." and "We'll reply to {email} within a day.", plus a "send another" button that clears the form and focuses the first field.

Turn animations off if the visitor has "reduce motion" on. Prefix every class with `ls-flf-`.

Style: warm dark lofi palette — fields #282219 with #37302a borders and 10px corners, cream text (#ece4d6), muted tan labels (#a2977f), amber accent (#e0985f) with a soft amber focus ring, pill-shaped amber send button; Geist for text, Geist Mono for the counter; 360px wide.
