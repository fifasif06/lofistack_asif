// OTP Input — one self-contained React component (styles included).
// Six boxes for a one-time code. Type, paste or let the phone autofill it; it checks the
// code as soon as the last digit is in. Swap the demo `verify` for your own server call.
import { useEffect, useId, useRef, useState } from "react";

const LENGTH = 6;
const RESEND_SECONDS = 30;
const DEMO_CODE = "246810";
const pretendVerify = (code) => new Promise((r) => setTimeout(() => r(code === DEMO_CODE), 700));

const css = `
.ls-otp { display: flex; flex-direction: column; align-items: center; gap: 16px; font-family: "Geist", system-ui, -apple-system, sans-serif; color: #ece4d6; text-align: center; }
.ls-otp-title { margin: 0; font-size: 17px; font-weight: 600; }
.ls-otp-sub { margin: 4px 0 0; font-size: 13px; color: #a2977f; }
.ls-otp-row { display: flex; align-items: center; gap: 8px; border: 0; padding: 0; margin: 0; }
.ls-otp-row legend { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.ls-otp-gap { width: 6px; height: 2px; border-radius: 2px; background: #37302a; }
.ls-otp-box {
  width: 46px; height: 56px; box-sizing: border-box; padding: 0; margin: 0;
  border-radius: 10px; border: 1px solid #37302a; background: #282219; color: #ece4d6;
  font: 500 24px "Geist Mono", ui-monospace, Menlo, monospace; text-align: center; caret-color: #e0985f;
  outline: none; transition: border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease;
  -webkit-appearance: none; appearance: none;
}
.ls-otp-box:focus { border-color: #e0985f; box-shadow: 0 0 0 3px rgba(224, 152, 95, 0.18); }
.ls-otp-box.ls-otp-filled { border-color: #5a4a3a; transform: translateY(-1px); }
.ls-otp[data-state="ok"] .ls-otp-box { border-color: #8fbf7f; color: #b9dcae; box-shadow: none; }
.ls-otp[data-state="bad"] .ls-otp-box { border-color: #e06a5f; }
.ls-otp[data-state="bad"] .ls-otp-row { animation: ls-otp-shake 360ms ease; }
.ls-otp[data-state="checking"] .ls-otp-box { opacity: 0.6; }
@keyframes ls-otp-shake { 20%, 60% { transform: translateX(-6px); } 40%, 80% { transform: translateX(6px); } }
.ls-otp-msg { min-height: 18px; margin: 0; font-size: 13px; color: #a2977f; }
.ls-otp[data-state="ok"] .ls-otp-msg { color: #b9dcae; }
.ls-otp[data-state="bad"] .ls-otp-msg { color: #e98a80; }
.ls-otp-resend { background: none; border: none; padding: 2px 0; cursor: pointer; color: #e0985f; font: 400 12px "Geist Mono", ui-monospace, Menlo, monospace; border-bottom: 1px solid transparent; }
.ls-otp-resend:hover, .ls-otp-resend:focus-visible { border-bottom-color: #e0985f; outline: none; }
.ls-otp-resend:disabled { color: #a2977f; cursor: default; border-bottom-color: transparent; }
@media (max-width: 400px) { .ls-otp-box { width: 38px; height: 48px; font-size: 20px; } .ls-otp-row { gap: 6px; } .ls-otp-gap { width: 2px; } }
@media (prefers-reduced-motion: reduce) {
  .ls-otp-box { transition: none; }
  .ls-otp[data-state="bad"] .ls-otp-row { animation: none; }
}
`;

export default function OtpInput({ length = LENGTH, verify = pretendVerify, sentTo = "••• ••• 4821" }) {
  const id = useId();
  const boxes = useRef([]);
  const [digits, setDigits] = useState(() => Array(length).fill(""));
  const [state, setState] = useState("idle"); // idle | checking | ok | bad
  const [wait, setWait] = useState(RESEND_SECONDS);

  // resend countdown
  useEffect(() => {
    if (wait <= 0 || state === "ok") return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait, state]);

  const focusBox = (i) => {
    const el = boxes.current[Math.max(0, Math.min(length - 1, i))];
    el?.focus();
    el?.select();
  };

  const submit = async (next) => {
    setState("checking");
    const good = await verify(next.join(""));
    if (good) { setState("ok"); boxes.current.forEach((b) => b?.blur()); return; }
    setState("bad");
    setTimeout(() => { setDigits(Array(length).fill("")); setState("idle"); focusBox(0); }, 900);
  };

  // put a run of digits in, starting at box i (handles typing, paste and phone autofill)
  const fillFrom = (i, text) => {
    const incoming = text.replace(/\D/g, "").slice(0, length - i).split("");
    if (!incoming.length) return;
    const next = [...digits];
    incoming.forEach((d, k) => { next[i + k] = d; });
    setDigits(next);
    if (state === "bad") setState("idle");
    const firstEmpty = next.findIndex((d) => !d);
    if (firstEmpty === -1) { focusBox(length - 1); submit(next); }
    else focusBox(Math.min(i + incoming.length, length - 1));
  };

  const onChange = (i, e) => {
    const v = e.target.value;
    if (!v) { const next = [...digits]; next[i] = ""; setDigits(next); return; }
    // typing into a box that already has a digit: keep only the new one
    if (v.length === 2 && digits[i]) fillFrom(i, v[0] === digits[i] ? v[1] : v[0]);
    else fillFrom(i, v);
  };

  const onKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      e.preventDefault();
      const next = [...digits]; next[i - 1] = ""; setDigits(next); focusBox(i - 1);
    } else if (e.key === "ArrowLeft") { e.preventDefault(); focusBox(i - 1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); focusBox(i + 1); }
    else if (e.key === "Home") { e.preventDefault(); focusBox(0); }
    else if (e.key === "End") { e.preventDefault(); focusBox(length - 1); }
  };

  const onPaste = (i, e) => {
    e.preventDefault();
    fillFrom(i, e.clipboardData.getData("text"));
  };

  const resend = () => {
    setDigits(Array(length).fill("")); setState("idle"); setWait(RESEND_SECONDS);
    setTimeout(() => focusBox(0)); // after the boxes are unlocked
  };

  const locked = state === "checking" || state === "ok";
  const msg = {
    idle: "",
    checking: "Checking…",
    ok: "Verified — you're in.",
    bad: "That code didn't match. Try again.",
  }[state];
  const half = Math.ceil(length / 2);

  return (
    <div className="ls-otp" data-state={state}>
      <style>{css}</style>
      <div>
        <h3 className="ls-otp-title">Enter your code</h3>
        <p className="ls-otp-sub">We sent a {length}-digit code to {sentTo}</p>
      </div>
      <fieldset className="ls-otp-row" id={id}>
        <legend>One-time code, {length} digits</legend>
        {digits.map((d, i) => (
          <span key={i} style={{ display: "contents" }}>
            {i === half && <span className="ls-otp-gap" aria-hidden="true" />}
            <input
              ref={(el) => { boxes.current[i] = el; }}
              className={"ls-otp-box" + (d ? " ls-otp-filled" : "")}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={i === 0 ? length : 2}
              value={d}
              aria-label={`Digit ${i + 1} of ${length}`}
              disabled={locked}
              onChange={(e) => onChange(i, e)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onPaste={(e) => onPaste(i, e)}
              onFocus={(e) => e.target.select()}
            />
          </span>
        ))}
      </fieldset>
      <p className="ls-otp-msg" role="status">{msg}</p>
      {state === "ok" ? (
        <button className="ls-otp-resend" type="button" onClick={resend}>start over</button>
      ) : (
        <button className="ls-otp-resend" type="button" onClick={resend} disabled={wait > 0}>
          {wait > 0 ? `resend code in 0:${String(wait).padStart(2, "0")}` : "resend code"}
        </button>
      )}
    </div>
  );
}
