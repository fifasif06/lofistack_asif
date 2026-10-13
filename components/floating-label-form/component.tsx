// Floating-Label Contact Form — React + TypeScript + Tailwind CSS.
// Labels sit inside each field and float up (pure CSS) when it's focused, filled or autofilled.
// Checks a field when you leave it, then sends through `onSend` with a sending → sent state.
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FocusEvent,
  type FormEvent,
  type ReactNode,
} from "react";

/** The form's values, keyed by field name. */
export type FormValues = Record<string, string>;

export interface FormField {
  /** Key for this field in the values passed to `onSend` and the success texts. */
  name: string;
  /** Visible label that floats up. */
  label: string;
  /** Input type for one-line fields ("email" also checks the format). Default "text" */
  type?: "text" | "email" | "tel" | "url";
  /** Adds "(optional)" to the label and skips the required check. Default false */
  optional?: boolean;
  /** A textarea that grows as you type, with a live character counter. Default false */
  multiline?: boolean;
  /** Browser autofill hint, e.g. "name" or "email". Default "off" */
  autoComplete?: string;
  /** Character limit. Default 120 for one-line fields, `maxMessage` for multiline ones */
  maxLength?: number;
  /** Error shown when a required field is left empty. Default `text.required` (multiline: `text.tooShort`) */
  requiredMessage?: string;
  /** Extra check on the trimmed value: return an error, or "" when it's fine. Default none */
  validate?: (value: string) => string;
}

export interface FloatingLabelFormText {
  /** Accessible name of the form. */
  form: string;
  /** Send button label. */
  submit: string;
  /** Send button label while waiting. */
  sending: string;
  /** Button on the success panel that clears the form. */
  again: string;
  /** Added after the label of optional fields. */
  optional: string;
  /** Fallback error for an empty required field. */
  required: string;
  /** Error for an email that doesn't look like one. */
  email: string;
  /** Error for a multiline field shorter than `minMessage`. */
  tooShort: (min: number) => string;
  /** Shown when `onSend` fails; the values are kept. */
  failed: string;
  /** Read after the counter numbers by screen readers. */
  characters: string;
}

export const DEFAULT_TEXT: FloatingLabelFormText = {
  form: "Contact form",
  submit: "Send message",
  sending: "Sending…",
  again: "send another",
  optional: "(optional)",
  required: "Please fill this in.",
  email: "That email doesn't look right — check for typos.",
  tooShort: (min) => `Add a little more — at least ${min} characters.`,
  failed: "Couldn't send — please try again.",
  characters: "characters",
};

export const DEFAULT_FIELDS: FormField[] = [
  { name: "name", label: "Your name", autoComplete: "name", requiredMessage: "Please tell us your name." },
  { name: "email", label: "Email", type: "email", autoComplete: "email", requiredMessage: "We need an email to reply to." },
  { name: "subject", label: "Subject", optional: true },
  { name: "message", label: "Message", multiline: true },
];

export interface FloatingLabelFormProps {
  /** The fields, top to bottom. Default DEFAULT_FIELDS (name, email, optional subject, message) */
  fields?: FormField[];
  /** Character limit for multiline fields. Default 500 */
  maxMessage?: number;
  /** Fewest characters a multiline field accepts. Default 10 */
  minMessage?: number;
  /** The counter turns amber when this many characters (or fewer) are left. Default 50 */
  warnAt?: number;
  /** Sends the values (trimmed, exactly as they were checked). Resolve when sent, throw/reject to show the error. The signal aborts if the form unmounts. Default: a pretend send that waits `demoDelay` */
  onSend?: (values: FormValues, signal: AbortSignal) => Promise<void>;
  /** How long the pretend send takes, in ms (only used without `onSend`). Default 1200 */
  demoDelay?: number;
  /** Success heading, given the trimmed values. Default "Thanks, {name}. Message sent." */
  successTitle?: (values: FormValues) => ReactNode;
  /** Success line under the heading. Default "We'll reply to {email} within a day." */
  successText?: (values: FormValues) => ReactNode;
  /** Button labels, error wording and screen-reader text; merged over DEFAULT_TEXT. Default DEFAULT_TEXT */
  text?: Partial<FloatingLabelFormText>;
  /** Form width (it never grows past its container). Default 360 */
  width?: CSSProperties["width"];
  /** Extra classes for the outer wrapper. Default "" */
  className?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ONE_LINE_MAX = 120;

const defaultTitle = (v: FormValues) => (v.name ? `Thanks, ${v.name}. Message sent.` : "Thanks. Message sent.");
const defaultText = (v: FormValues) =>
  v.email ? `We'll reply to ${v.email} within a day.` : "We'll reply within a day.";

// Pretend request: waits, but stops (and never resolves) if the form goes away first.
const pretendSend = (ms: number) => (_values: FormValues, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = window.setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      window.clearTimeout(t);
      reject(signal.reason);
    }, { once: true });
  });

const emptyValues = (fields: FormField[]): FormValues => Object.fromEntries(fields.map((f) => [f.name, ""]));
// Fields are checked on their trimmed text, so that is also what gets sent and shown back.
const trimAll = (values: FormValues): FormValues => Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]));

// Reset to auto, then match the content height (+2px because scrollHeight leaves out the borders).
function growTextareas(els: Record<string, HTMLInputElement | HTMLTextAreaElement | null>) {
  for (const el of Object.values(els)) {
    if (!(el instanceof HTMLTextAreaElement)) continue;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }
}

// Floated label = moved up and shrunk. Three triggers: focus, has text (placeholder=" " is no longer
// shown), and browser autofill. Autofill gets two separate classes so a browser that doesn't know one
// of the selectors only drops that one rule.
const FLOAT =
  "peer-focus:-translate-y-[9px] peer-focus:scale-[0.76] " +
  "peer-[:not(:placeholder-shown)]:-translate-y-[9px] peer-[:not(:placeholder-shown)]:scale-[0.76] " +
  "peer-autofill:-translate-y-[9px] peer-autofill:scale-[0.76] " +
  "peer-[:-webkit-autofill]:-translate-y-[9px] peer-[:-webkit-autofill]:scale-[0.76]";

// Autofilled fields keep the dark look (an inset shadow paints over the browser's yellow/blue fill).
const AUTOFILL =
  "autofill:shadow-[inset_0_0_0_40px_#282219] autofill:[-webkit-text-fill-color:#ece4d6] " +
  "[&:-webkit-autofill]:shadow-[inset_0_0_0_40px_#282219] [&:-webkit-autofill]:[-webkit-text-fill-color:#ece4d6]";

export default function FloatingLabelForm({
  fields = DEFAULT_FIELDS,
  maxMessage = 500,
  minMessage = 10,
  warnAt = 50,
  onSend,
  demoDelay = 1200,
  successTitle = defaultTitle,
  successText = defaultText,
  text: textProp,
  width = 360,
  className = "",
}: FloatingLabelFormProps) {
  const t = { ...DEFAULT_TEXT, ...textProp };
  const id = useId();
  const refs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});
  const heading = useRef<HTMLHeadingElement>(null);
  const dirty = useRef(new Set<string>()); // fields the person has typed in
  const request = useRef<AbortController | null>(null);
  const focusNext = useRef<"heading" | "first" | null>(null);

  const [values, setValues] = useState<FormValues>(() => emptyValues(fields));
  // undefined = never checked; "" = checked and fine; text = the error showing
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [failed, setFailed] = useState(false);
  const sending = status === "sending";
  const valueOf = (name: string) => values[name] ?? "";

  const check = (f: FormField, raw: string) => {
    const v = raw.trim();
    if (!v) return f.optional ? "" : (f.requiredMessage ?? (f.multiline ? t.tooShort(minMessage) : t.required));
    if (f.type === "email" && !EMAIL_RE.test(v)) return t.email;
    if (f.multiline && v.length < minMessage) return t.tooShort(minMessage);
    return f.validate?.(v) ?? "";
  };

  // Textareas grow with their text (after every render, so typing and "send another" both resize).
  useLayoutEffect(() => growTextareas(refs.current));
  useEffect(() => {
    // Text re-wraps when the window is resized, so the height has to follow.
    const onResize = () => growTextareas(refs.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Never update state after unmount: cancel a send that's still in flight.
  useEffect(() => () => request.current?.abort(), []);

  // Focus follows the view, once per switch: the success heading after sending, the first field after
  // "send another". A one-shot request (not a dependency list) so parent re-renders never steal focus.
  useEffect(() => {
    const target = focusNext.current;
    if (!target) return;
    focusNext.current = null;
    if (target === "heading") heading.current?.focus();
    else if (fields[0]) refs.current[fields[0].name]?.focus();
  });

  const onChange = (f: FormField, e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    dirty.current.add(f.name);
    setValues((v) => ({ ...v, [f.name]: value }));
    // once a field has shown an error, re-check it live so the error clears the moment it's fixed
    if (errors[f.name]) setErrors((er) => ({ ...er, [f.name]: check(f, value) }));
  };

  // Check on leaving the field — but not a field the person only tabbed through without typing.
  const onBlur = (f: FormField, e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value || dirty.current.has(f.name) || errors[f.name] !== undefined) {
      setErrors((er) => ({ ...er, [f.name]: check(f, value) }));
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const found = Object.fromEntries(fields.map((f) => [f.name, check(f, valueOf(f.name))]));
    setErrors(found);
    setFailed(false);
    const firstBad = fields.find((f) => found[f.name]);
    if (firstBad) {
      refs.current[firstBad.name]?.focus();
      return;
    }
    const ctrl = new AbortController();
    request.current = ctrl;
    setStatus("sending");
    try {
      await (onSend ?? pretendSend(demoDelay))(trimAll(values), ctrl.signal);
      if (ctrl.signal.aborted) return;
      focusNext.current = "heading";
      setStatus("sent");
    } catch {
      if (ctrl.signal.aborted) return;
      setStatus("idle");
      setFailed(true);
    }
  };

  const reset = () => {
    focusNext.current = "first";
    dirty.current.clear();
    setValues(emptyValues(fields));
    setErrors({});
    setFailed(false);
    setStatus("idle");
  };

  const root = `max-w-full font-sans text-[#ece4d6] ${className}`;

  if (status === "sent") {
    const shown = trimAll(values);
    return (
      <div className={root} style={{ width }}>
        <div className="flex flex-col items-start gap-2.5 py-2 transition-[opacity,translate] duration-400 ease-out starting:translate-y-1.5 starting:opacity-0 motion-reduce:transition-none">
          <span className="flex size-10 items-center justify-center rounded-full bg-[#e0985f]/15 text-[#e0985f]" aria-hidden="true">
            <svg className="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 10.5l3.5 3.5 7.5-8" />
            </svg>
          </span>
          {/* tabIndex -1: focus lands here so screen readers read the result; it is not a Tab stop */}
          <h3 ref={heading} tabIndex={-1} className="m-0 text-lg font-semibold outline-none">
            {successTitle(shown)}
          </h3>
          <p className="m-0 text-sm text-[#a2977f]">{successText(shown)}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-1.5 cursor-pointer rounded-full border border-[#37302a] bg-transparent px-4 py-1.5 font-mono text-[11px] text-[#a2977f] transition-colors hover:border-[#e0985f] hover:text-[#e0985f] focus-visible:border-[#e0985f] focus-visible:text-[#e0985f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0985f] active:bg-[#e0985f]/10"
          >
            {t.again}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={root} style={{ width }}>
      <form noValidate onSubmit={onSubmit} aria-label={t.form} aria-busy={sending || undefined} className="m-0 flex flex-col gap-[18px]">
        {fields.map((f) => {
          const fid = `${id}-${f.name}`;
          const err = errors[f.name];
          const value = valueOf(f.name);
          const max = f.maxLength ?? (f.multiline ? maxMessage : ONE_LINE_MAX);
          const describedBy = [err && `${fid}-err`, f.multiline && `${fid}-count`].filter(Boolean).join(" ");
          const shared = {
            id: fid,
            name: f.name,
            value,
            maxLength: max,
            autoComplete: f.autoComplete ?? "off",
            placeholder: " ", // never visible — it only powers the :placeholder-shown float trick
            required: !f.optional,
            readOnly: sending, // locked while sending, but keeps focus where it was
            "aria-invalid": err ? true : undefined,
            "aria-describedby": describedBy || undefined,
            onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(f, e),
            onBlur: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onBlur(f, e),
            className: `peer m-0 block w-full appearance-none rounded-[10px] border bg-[#282219] px-3.5 pt-[22px] pb-2 font-sans text-[15px] leading-[1.4] text-[#ece4d6] caret-[#e0985f] outline-none transition-[border-color,box-shadow,opacity] duration-160 ease-out placeholder:text-transparent focus:ring-3 focus:ring-[#e0985f]/18 motion-reduce:transition-none ${AUTOFILL} ${
              err ? "border-[#e06a5f]" : "border-[#37302a] hover:border-[#4a4037] focus:border-[#e0985f]"
            } ${sending ? "cursor-not-allowed opacity-70" : ""} ${f.multiline ? "min-h-28 resize-none overflow-hidden" : ""}`,
          };
          const left = max - value.length;
          return (
            <div key={f.name} className="relative">
              {f.multiline ? (
                <textarea ref={(el) => { refs.current[f.name] = el; }} rows={4} {...shared} />
              ) : (
                <input
                  ref={(el) => { refs.current[f.name] = el; }}
                  type={f.type ?? "text"}
                  inputMode={f.type === "email" ? "email" : undefined}
                  {...shared}
                />
              )}
              <label
                htmlFor={fid}
                className={`pointer-events-none absolute top-4 left-[15px] origin-top-left text-[15px] leading-[1.55] transition-[translate,scale,color] duration-180 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none ${FLOAT} ${
                  err ? "text-[#e06a5f]" : "text-[#a2977f] peer-focus:text-[#e0985f]"
                }`}
              >
                {f.label}
                {f.optional && ` ${t.optional}`}
              </label>
              {(err || f.multiline) && (
                <div className="mt-1.5 flex min-h-4 justify-between gap-3 text-xs">
                  {err && (
                    <span id={`${fid}-err`} className="text-[#e98a80]">
                      {err}
                    </span>
                  )}
                  {f.multiline && (
                    <span
                      id={`${fid}-count`}
                      className={`ml-auto font-mono text-[11px] tabular-nums ${left <= warnAt ? "text-[#e0985f]" : "text-[#a2977f]"}`}
                    >
                      {value.length}/{max}
                      <span className="sr-only"> {t.characters}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <p role="alert" className="m-0 text-[13px] text-[#e98a80] empty:hidden">
          {failed ? t.failed : ""}
        </p>

        <div>
          {/* aria-disabled (not disabled) while sending, so keyboard focus stays on the button */}
          <button
            type="submit"
            aria-disabled={sending || undefined}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#e0985f] px-5 py-3 font-sans text-[15px] leading-tight font-medium text-[#16130f] transition-[translate,background-color,opacity] duration-160 ease-out hover:-translate-y-px hover:bg-[#f3b983] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#e0985f] active:translate-y-0 active:bg-[#e0985f] motion-reduce:transition-none motion-reduce:hover:translate-y-0 aria-disabled:cursor-progress aria-disabled:opacity-70 aria-disabled:hover:translate-y-0 aria-disabled:hover:bg-[#e0985f]"
          >
            {sending && (
              <span
                aria-hidden="true"
                className="size-3.5 animate-spin rounded-full border-2 border-[#16130f]/30 border-t-[#16130f] [animation-duration:700ms] motion-reduce:[animation-duration:2s]"
              />
            )}
            {sending ? t.sending : t.submit}
          </button>
          <span role="status" className="sr-only">
            {sending ? t.sending : ""}
          </span>
        </div>
      </form>
    </div>
  );
}
