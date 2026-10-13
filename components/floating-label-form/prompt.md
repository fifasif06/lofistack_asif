# Final prompt — Floating-Label Contact Form

Build a floating-label contact form: one React + TypeScript component, Tailwind CSS v4 classes only, no form libraries.

- Props (defaults): fields (name, email, optional subject, message; each: label, type, optional, multiline, autoComplete, requiredMessage, validate), maxMessage 500, minMessage 10, warnAt 50, onSend(values, signal) (default: pretend 1.2 s send), successTitle "Thanks, {name}. Message sent.", successText "We'll reply to {email} within a day.", text overrides, width 360.
- Labels float up and shrink (180 ms) on focus, text or autofill, CSS only: peer, placeholder=" ", peer-focus, peer-[:not(:placeholder-shown)], peer-autofill. Amber on focus, red when invalid; autofill stays dark.
- Message box auto-grows; 0/500 counter turns amber in the last 50.
- Check on blur (skip fields only tabbed past), re-check live after an error, focus the first bad field on submit. aria-invalid + aria-describedby.
- Sending: spinner, "Sending…", fields locked, focus kept. Failure: friendly alert, values kept. Success: check-icon panel, heading focused, "send another" clears and focuses the first field.
- Abort the send on unmount; respect reduced motion; amber focus rings.
- Look: fields #282219, #37302a borders, 10px corners, tan labels, amber #e0985f pill button, Geist Mono counter.
