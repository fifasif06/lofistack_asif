// OTP Input — React + TypeScript + Tailwind CSS.
// One box per digit for a one-time code: type, paste or let the phone autofill it. Checks the
// code the moment the last digit is in, and has a resend button with a countdown.
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export interface OtpInputText {
  /** Hidden legend of the box group. */
  legend: (length: number) => string;
  /** Accessible name of each box. */
  digit: (n: number, length: number) => string;
  /** Status while the code is being checked. */
  checking: string;
  /** Status when the code is right. */
  verified: string;
  /** Status when the code is wrong. */
  mismatch: string;
  /** Status when `verify` throws (e.g. network error). */
  failed: string;
  /** Resend button once the countdown is over. */
  resend: string;
  /** Resend button during the countdown; gets the time as "0:30". */
  resendIn: (time: string) => string;
  /** Button shown after a successful check. */
  startOver: string;
}

export const DEFAULT_TEXT: OtpInputText = {
  legend: (length) => `One-time code, ${length} digits`,
  digit: (n, length) => `Digit ${n} of ${length}`,
  checking: "Checking…",
  verified: "Verified — you're in.",
  mismatch: "That code didn't match. Try again.",
  failed: "Couldn't check the code. Try again.",
  resend: "resend code",
  resendIn: (time) => `resend code in ${time}`,
  startOver: "start over",
};

export interface OtpInputProps {
  /** How many digit boxes. Default 6 */
  length?: number;
  /** Seconds before "resend code" can be clicked. Default 30 */
  resendSeconds?: number;
  /** Checks a complete code: resolve true to accept, false to reject; throwing shows `text.failed`. The signal aborts on start over, resend or unmount. Default: a demo check that accepts `demoCode` after `demoDelay` */
  verify?: (code: string, signal: AbortSignal) => Promise<boolean>;
  /** The code the demo check accepts (only used without `verify`). Default "246810" */
  demoCode?: string;
  /** How long the demo check takes, in ms (only used without `verify`). Default 700 */
  demoDelay?: number;
  /** How long a wrong code stays red before the boxes clear, in ms. Default 900 */
  errorDelay?: number;
  /** Where the code went, shown in the subtitle. Default "••• ••• 4821" */
  sentTo?: string;
  /** Heading above the boxes. Default "Enter your code" */
  title?: ReactNode;
  /** Line under the heading. Default "We sent a {length}-digit code to {sentTo}" */
  subtitle?: ReactNode;
  /** Status, button and screen-reader wording; merged over DEFAULT_TEXT. Default DEFAULT_TEXT */
  text?: Partial<OtpInputText>;
  /** Called with the code once it is accepted. Default none */
  onVerified?: (code: string) => void;
  /** Called when "resend code" is clicked — send a new code here. Default none */
  onResend?: () => void;
  /** Extra classes for the outer wrapper. Default "" */
  className?: string;
}

type Phase = "idle" | "checking" | "ok" | "bad";

// Demo check: waits, then compares. Stops its timer if the check is cancelled.
const demoVerify = (accept: string, ms: number) => (code: string, signal: AbortSignal) =>
  new Promise<boolean>((resolve, reject) => {
    const t = window.setTimeout(() => resolve(code === accept), ms);
    signal.addEventListener("abort", () => {
      window.clearTimeout(t);
      reject(signal.reason);
    }, { once: true });
  });

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const blank = (n: number) => Array<string>(n).fill("");

export default function OtpInput({
  length = 6,
  resendSeconds = 30,
  verify,
  demoCode = "246810",
  demoDelay = 700,
  errorDelay = 900,
  sentTo = "••• ••• 4821",
  title = "Enter your code",
  subtitle,
  text: textProp,
  onVerified,
  onResend,
  className = "",
}: OtpInputProps) {
  const t = { ...DEFAULT_TEXT, ...textProp };
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const check = useRef<AbortController | null>(null);
  const focusAfterRender = useRef<number | null>(null);

  const [digits, setDigits] = useState<string[]>(() => blank(length));
  const [phase, setPhase] = useState<Phase>("idle");
  const [notice, setNotice] = useState(""); // last error — stays readable until the next digit is typed
  const [wait, setWait] = useState(resendSeconds);

  // Always exactly `length` cells, even if the prop changes.
  const cells = Array.from({ length }, (_, i) => digits[i] ?? "");
  const locked = phase === "checking" || phase === "ok";
  const paused = phase === "ok";

  // Resend countdown: one tick per second, paused once the code is verified.
  useEffect(() => {
    if (wait <= 0 || paused) return;
    const tick = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(tick);
  }, [wait, paused]);

  // A wrong code stays red for a moment, then the boxes clear and focus goes back to the first one.
  // Typing again (phase -> idle) or unmounting cancels the timer.
  useEffect(() => {
    if (phase !== "bad") return;
    const clear = window.setTimeout(() => {
      setDigits(blank(length));
      setPhase("idle");
      focusAfterRender.current = 0;
    }, errorDelay);
    return () => window.clearTimeout(clear);
  }, [phase, errorDelay, length]);

  // Focus requests that must wait until the boxes are enabled again (after clear / start over).
  useEffect(() => {
    if (focusAfterRender.current === null) return;
    focusBox(focusAfterRender.current);
    focusAfterRender.current = null;
  });

  // Cancel a check still in flight on unmount, so nothing updates state afterwards.
  useEffect(() => () => check.current?.abort(), []);

  function focusBox(i: number) {
    const el = boxes.current[Math.max(0, Math.min(length - 1, i))];
    el?.focus();
    el?.select();
  }

  const submit = async (code: string) => {
    check.current?.abort();
    const ctrl = new AbortController();
    check.current = ctrl;
    setPhase("checking");
    let good = false;
    let failed = false;
    try {
      good = await (verify ?? demoVerify(demoCode, demoDelay))(code, ctrl.signal);
    } catch {
      failed = true;
    }
    if (ctrl.signal.aborted) return; // started over, resent or unmounted meanwhile
    if (good) {
      setPhase("ok");
      onVerified?.(code);
      return;
    }
    setNotice(failed ? t.failed : t.mismatch);
    setPhase("bad");
  };

  // Put a run of digits in, starting at box i (typing, paste and phone autofill all land here).
  const fillFrom = (i: number, raw: string) => {
    const incoming = raw.replace(/\D/g, "").slice(0, length - i).split("");
    if (!incoming.length) return;
    const next = [...cells];
    incoming.forEach((d, k) => {
      next[i + k] = d;
    });
    setDigits(next);
    setNotice("");
    if (phase === "bad") setPhase("idle");
    if (next.every(Boolean)) void submit(next.join("")); // all in: check it right away
    else focusBox(i + incoming.length);
  };

  const onChange = (i: number, e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (!v) {
      setDigits(cells.map((d, k) => (k === i ? "" : d)));
      return;
    }
    // Typing into a box that already holds a digit (caret beside it): keep only the new digit.
    if (v.length === 2 && cells[i]) fillFrom(i, v[0] === cells[i] ? v[1] : v[0]);
    else fillFrom(i, v);
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    const move = (to: number) => {
      e.preventDefault();
      focusBox(to);
    };
    if (e.key === "Backspace" && !cells[i] && i > 0) {
      // Backspace in an empty box clears the one before it and steps back.
      setDigits(cells.map((d, k) => (k === i - 1 ? "" : d)));
      move(i - 1);
    } else if (e.key === "ArrowLeft") move(i - 1);
    else if (e.key === "ArrowRight") move(i + 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(length - 1);
  };

  const onPaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    fillFrom(i, e.clipboardData.getData("text"));
  };

  const restart = () => {
    check.current?.abort();
    setDigits(blank(length));
    setPhase("idle");
    setNotice("");
    setWait(resendSeconds);
    focusAfterRender.current = 0; // the boxes may still be disabled right now
  };

  const status = phase === "checking" ? t.checking : phase === "ok" ? t.verified : notice;
  const statusTone = phase === "ok" ? "text-[#b9dcae]" : notice ? "text-[#e98a80]" : "text-[#a2977f]";
  const half = Math.ceil(length / 2);

  // One class per property per state, so no two colour classes ever compete.
  const boxTone = (d: string) => {
    const lift = d ? "-translate-y-px" : ""; // filled boxes sit 1px higher
    if (phase === "ok") return `${lift} cursor-default border-[#8fbf7f] text-[#b9dcae]`;
    if (phase === "checking") return `${lift} cursor-progress border-[#5a4a3a] text-[#ece4d6] opacity-60`;
    if (phase === "bad") return `${lift} border-[#e06a5f] text-[#ece4d6] focus:border-[#e06a5f]`;
    const line = d ? "border-[#5a4a3a]" : "border-[#37302a] hover:border-[#4a4037]";
    return `${lift} ${line} text-[#ece4d6] focus:border-[#e0985f]`;
  };

  const linkButton =
    "cursor-pointer rounded-sm border-0 border-b border-transparent bg-transparent px-0 py-0.5 font-mono text-xs text-[#e0985f] tabular-nums transition-colors hover:border-[#e0985f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0985f] active:text-[#f3b983] disabled:cursor-default disabled:border-transparent disabled:text-[#a2977f] motion-reduce:transition-none";

  return (
    <div
      data-state={phase}
      className={`@container flex w-full flex-col items-center gap-4 text-center font-sans text-[#ece4d6] ${className}`}
    >
      {/* the one keyframe Tailwind has no built-in for */}
      <style>{"@keyframes ls-otp-shake{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}"}</style>
      <div>
        <h3 className="m-0 text-[17px] leading-snug font-semibold">{title}</h3>
        <p className="mt-1 mb-0 text-[13px] text-[#a2977f]">
          {subtitle ?? `We sent a ${length}-digit code to ${sentTo}`}
        </p>
      </div>

      <fieldset
        className={`m-0 flex max-w-full min-w-0 items-center gap-1.5 border-0 p-0 @[22rem]:gap-2 ${
          phase === "bad" ? "motion-safe:[animation:ls-otp-shake_360ms_ease]" : ""
        }`}
      >
        <legend className="sr-only">{t.legend(length)}</legend>
        {cells.map((d, i) => (
          <Fragment key={i}>
            {i === half && (
              <span aria-hidden="true" className="h-0.5 w-0.5 shrink-0 rounded-sm bg-[#37302a] @[22rem]:w-1.5" />
            )}
            <input
              ref={(el) => {
                boxes.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              // the first box takes the whole code, so phone autofill (one-time-code) can drop it all in
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={i === 0 ? length : 2}
              value={d}
              aria-label={t.digit(i + 1, length)}
              aria-invalid={phase === "bad" || undefined}
              disabled={locked}
              onChange={(e) => onChange(i, e)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onPaste={(e) => onPaste(i, e)}
              onFocus={(e) => e.target.select()}
              className={`m-0 h-12 w-[38px] min-w-0 shrink appearance-none rounded-[10px] border bg-[#282219] p-0 text-center font-mono text-xl font-medium caret-[#e0985f] outline-none transition-[border-color,box-shadow,translate,opacity,color] duration-140 ease-out focus:ring-3 focus:ring-[#e0985f]/18 motion-reduce:transition-none @[22rem]:h-14 @[22rem]:w-[46px] @[22rem]:text-2xl ${boxTone(d)}`}
            />
          </Fragment>
        ))}
      </fieldset>

      <p role="status" className={`m-0 min-h-[18px] text-[13px] ${statusTone}`}>
        {status}
      </p>

      {phase === "ok" ? (
        <button type="button" onClick={restart} className={linkButton}>
          {t.startOver}
        </button>
      ) : (
        <button
          type="button"
          disabled={wait > 0}
          onClick={() => {
            restart();
            onResend?.();
          }}
          className={linkButton}
        >
          {wait > 0 ? t.resendIn(clock(wait)) : t.resend}
        </button>
      )}
    </div>
  );
}
