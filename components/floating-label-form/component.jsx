// Floating-Label Contact Form — one self-contained React component (styles included).
// Labels sit inside each field and float up when you type or focus. Checks each field
// when you leave it, then "sends" (a pretend 1.2 s wait — swap in your own fetch in onSend).
import { useEffect, useId, useRef, useState } from "react";

const MAX_MESSAGE = 500;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const css = `
.ls-flf { width: 360px; max-width: calc(100vw - 64px); font-family: "Geist", system-ui, -apple-system, sans-serif; color: #ece4d6; }
.ls-flf form { display: flex; flex-direction: column; gap: 18px; margin: 0; }
.ls-flf-field { position: relative; }
.ls-flf-input {
  display: block; width: 100%; box-sizing: border-box; margin: 0;
  padding: 22px 14px 8px; border-radius: 10px; border: 1px solid #37302a;
  background: #282219; color: #ece4d6; font: 400 15px/1.4 "Geist", system-ui, sans-serif;
  outline: none; transition: border-color 160ms ease, box-shadow 160ms ease;
  -webkit-appearance: none; appearance: none;
}
textarea.ls-flf-input { resize: none; min-height: 112px; overflow: hidden; }
.ls-flf-input:hover { border-color: #4a4037; }
.ls-flf-input:focus { border-color: #e0985f; box-shadow: 0 0 0 3px rgba(224, 152, 95, 0.18); }
.ls-flf-label {
  position: absolute; left: 15px; top: 16px; pointer-events: none;
  font-size: 15px; color: #a2977f; transform-origin: left top;
  transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1), color 180ms ease;
}
.ls-flf-label i { font-style: normal; opacity: 0.7; }
/* float the label when the field is focused OR has text (placeholder=" " trick also catches browser autofill) */
.ls-flf-input:focus + .ls-flf-label,
.ls-flf-input:not(:placeholder-shown) + .ls-flf-label { transform: translateY(-9px) scale(0.76); }
.ls-flf-input:-webkit-autofill + .ls-flf-label { transform: translateY(-9px) scale(0.76); } /* own rule: an unknown selector would cancel the one above */
.ls-flf-input:focus + .ls-flf-label { color: #e0985f; }
.ls-flf-input:-webkit-autofill { -webkit-text-fill-color: #ece4d6; -webkit-box-shadow: 0 0 0 40px #282219 inset; caret-color: #ece4d6; }
.ls-flf-field.ls-flf-bad .ls-flf-input { border-color: #e06a5f; }
.ls-flf-field.ls-flf-bad .ls-flf-label { color: #e06a5f; }
.ls-flf-foot { display: flex; justify-content: space-between; gap: 12px; margin-top: 6px; min-height: 16px; font-size: 12px; }
.ls-flf-error { color: #e98a80; }
.ls-flf-count { margin-left: auto; font-family: "Geist Mono", ui-monospace, Menlo, monospace; font-size: 11px; color: #a2977f; }
.ls-flf-count.ls-flf-near { color: #e0985f; }
.ls-flf-send {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 20px; border: none; border-radius: 999px; cursor: pointer;
  background: #e0985f; color: #16130f; font: 500 15px "Geist", system-ui, sans-serif;
  transition: transform 160ms ease, opacity 160ms ease;
}
.ls-flf-send:hover { transform: translateY(-1px); }
.ls-flf-send:disabled { opacity: 0.7; cursor: progress; transform: none; }
.ls-flf-send:focus-visible { outline: 2px solid #e0985f; outline-offset: 3px; }
.ls-flf-spin { width: 14px; height: 14px; border-radius: 999px; border: 2px solid rgba(22, 19, 15, 0.3); border-top-color: #16130f; animation: ls-flf-spin 700ms linear infinite; }
@keyframes ls-flf-spin { to { transform: rotate(360deg); } }
.ls-flf-done { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; padding: 8px 0; animation: ls-flf-in 400ms ease-out; }
@keyframes ls-flf-in { from { opacity: 0; transform: translateY(6px); } }
.ls-flf-check { width: 40px; height: 40px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: rgba(224, 152, 95, 0.15); color: #e0985f; }
.ls-flf-check svg { width: 20px; height: 20px; }
.ls-flf-done h3 { margin: 0; font-size: 18px; font-weight: 600; }
.ls-flf-done p { margin: 0; font-size: 14px; color: #a2977f; }
.ls-flf-again { margin-top: 6px; background: none; border: 1px solid #37302a; border-radius: 999px; padding: 6px 16px; cursor: pointer; color: #a2977f; font: 400 11px "Geist Mono", ui-monospace, Menlo, monospace; }
.ls-flf-again:hover, .ls-flf-again:focus-visible { color: #e0985f; border-color: #e0985f; outline: none; }
@media (prefers-reduced-motion: reduce) {
  .ls-flf-label, .ls-flf-input, .ls-flf-send { transition: none; }
  .ls-flf-done { animation: none; }
  .ls-flf-spin { animation-duration: 2s; }
}
`;

const FIELDS = [
  { name: "name", label: "Your name", type: "text", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email", inputMode: "email" },
  { name: "subject", label: "Subject", type: "text", optional: true },
  { name: "message", label: "Message", multiline: true },
];

function check(name, value) {
  const v = value.trim();
  if (name === "name" && !v) return "Please tell us your name.";
  if (name === "email" && !v) return "We need an email to reply to.";
  if (name === "email" && !EMAIL_RE.test(v)) return "That email doesn't look right — check for typos.";
  if (name === "message" && v.length < 10) return "Add a little more — at least 10 characters.";
  return "";
}

const pretendSend = () => new Promise((r) => setTimeout(r, 1200));

export default function FloatingLabelForm({ onSend = pretendSend }) {
  const id = useId();
  const refs = useRef({});
  const empty = { name: "", email: "", subject: "", message: "" };
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent

  const grow = (el) => { el.style.height = "auto"; el.style.height = el.scrollHeight + 2 + "px"; };

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (e.target.tagName === "TEXTAREA") grow(e.target);
    // once a field has shown an error, re-check it live so the error clears as soon as it's fixed
    if (errors[name]) setErrors((er) => ({ ...er, [name]: check(name, value) }));
  };

  const onBlur = (e) => {
    const { name, value } = e.target;
    if (value || errors[name] !== undefined) setErrors((er) => ({ ...er, [name]: check(name, value) }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    FIELDS.forEach((f) => { found[f.name] = check(f.name, values[f.name]); });
    setErrors(found);
    const first = FIELDS.find((f) => found[f.name]);
    if (first) { refs.current[first.name]?.focus(); return; }
    setStatus("sending");
    try { await onSend(values); setStatus("sent"); }
    catch { setStatus("idle"); setErrors({ message: "Couldn't send — please try again." }); }
  };

  // after "send another", put the cursor back in the first field
  const refocus = useRef(false);
  useEffect(() => {
    if (status === "idle" && refocus.current) { refocus.current = false; refs.current.name?.focus(); }
  }, [status]);

  const reset = () => {
    refocus.current = true;
    setValues(empty); setErrors({}); setStatus("idle");
  };

  if (status === "sent") {
    return (
      <div className="ls-flf">
        <style>{css}</style>
        <div className="ls-flf-done" role="status">
          <span className="ls-flf-check" aria-hidden="true">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 10.5l3.5 3.5 7.5-8" /></svg>
          </span>
          <h3>Thanks, {values.name.trim()}. Message sent.</h3>
          <p>We'll reply to {values.email.trim()} within a day.</p>
          <button className="ls-flf-again" type="button" onClick={reset}>send another</button>
        </div>
      </div>
    );
  }

  const sending = status === "sending";
  return (
    <div className="ls-flf">
      <style>{css}</style>
      <form noValidate onSubmit={onSubmit} aria-label="Contact form">
        {FIELDS.map((f) => {
          const fid = `${id}-${f.name}`;
          const err = errors[f.name];
          const Tag = f.multiline ? "textarea" : "input";
          const left = MAX_MESSAGE - values.message.length;
          return (
            <div key={f.name} className={"ls-flf-field" + (err ? " ls-flf-bad" : "")}>
              <Tag
                ref={(el) => { refs.current[f.name] = el; }}
                id={fid}
                className="ls-flf-input"
                name={f.name}
                type={f.multiline ? undefined : f.type}
                rows={f.multiline ? 4 : undefined}
                maxLength={f.multiline ? MAX_MESSAGE : 120}
                autoComplete={f.autoComplete || "off"}
                inputMode={f.inputMode}
                placeholder=" "
                value={values[f.name]}
                onChange={onChange}
                onBlur={onBlur}
                disabled={sending}
                required={!f.optional}
                aria-invalid={err ? "true" : undefined}
                aria-describedby={err ? `${fid}-err` : undefined}
              />
              <label className="ls-flf-label" htmlFor={fid}>
                {f.label}{f.optional && <i> (optional)</i>}
              </label>
              {(err || f.multiline) && (
                <div className="ls-flf-foot">
                  {err && <span className="ls-flf-error" id={`${fid}-err`}>{err}</span>}
                  {f.multiline && (
                    <span className={"ls-flf-count" + (left <= 50 ? " ls-flf-near" : "")}>
                      {values.message.length}/{MAX_MESSAGE}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div>
          <button className="ls-flf-send" type="submit" disabled={sending}>
            {sending && <span className="ls-flf-spin" aria-hidden="true" />}
            {sending ? "Sending…" : "Send message"}
          </button>
        </div>
      </form>
    </div>
  );
}
