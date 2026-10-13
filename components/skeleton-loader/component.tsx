// Skeleton Screen Loader — React + TypeScript + Tailwind CSS.
// Shows a shimmering placeholder shaped exactly like the real card, then fades to the card.
// The card's play button plays a 5-second lofi clip made live with the Web Audio API (no audio file).
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

export interface SkeletonLoaderProps {
  /** How long the pretend load lasts before the real card appears, in ms. Ignored when `loading` is set. Default 2200 */
  loadMs?: number;
  /** Controlled mode: true shows the skeleton, false shows the card. When set, the internal timer and the replay button are not used. Default undefined (uncontrolled) */
  loading?: boolean;
  /** Called each time the skeleton swaps to the real card. Default undefined */
  onLoaded?: () => void;
  /** Card title. Default "rainy window study mix" */
  title?: string;
  /** Smaller line under the title. Default "1 hr 12 min · tape hiss included" */
  meta?: string;
  /** Station name next to the avatar. Default "lofistack radio" */
  station?: string;
  /** Letters inside the round avatar. Default "lo" */
  initials?: string;
  /** Small label on the artwork, next to the play button. Default "side b · 5 sec preview" */
  artLabel?: string;
  /** Shows the play button and the 5-second clip. Default true */
  clip?: boolean;
  /** Play button's accessible name while stopped. Default "Play 5-second lofistack radio clip" */
  playLabel?: string;
  /** Play button's accessible name while playing. Default "Stop clip" */
  stopLabel?: string;
  /** Text of the button that restarts the loading. Default "replay loading" */
  replayLabel?: string;
  /** Shows the replay button (uncontrolled mode only). Default true */
  showReplay?: boolean;
  /** Screen-reader text while the skeleton is showing. Default "loading…" */
  loadingLabel?: string;
  /** Card width in px (it never grows wider than its container). Default 288 */
  width?: number;
  /** One sweep of the shimmer, in ms. Default 1400 */
  shimmerMs?: number;
  /** Fade-and-rise of the real card, in ms. Default 400 */
  fadeMs?: number;
}

/** Length of the radio clip in seconds. The chords and drums below are written for exactly 5 s. */
export const CLIP_SECONDS = 5;

// Keyframes Tailwind doesn't ship. The shimmer moves `translate` (not `transform`) because
// Tailwind's -translate-x-full also uses `translate`, so the two never stack.
const KEYFRAMES = `
@keyframes ls-skel-shimmer { from { translate: -100% 0; } to { translate: 100% 0; } }
@keyframes ls-skel-in { from { opacity: 0; transform: translateY(4px); } }
@keyframes ls-skel-progress { from { width: 0; } to { width: 100%; } }`;

// No rounding here: each block sets its own, so the avatar's rounded-full can't lose to a shared rounded-md.
const shimmer =
  "relative overflow-hidden bg-[#1f1b16] after:absolute after:inset-0 after:-translate-x-full after:bg-[linear-gradient(90deg,transparent,rgba(236,228,214,0.09),transparent)] after:[animation:ls-skel-shimmer_var(--ls-skel-shimmer)_infinite] motion-reduce:after:[animation:none]";

export default function SkeletonLoader({
  loadMs = 2200,
  loading,
  onLoaded,
  title = "rainy window study mix",
  meta = "1 hr 12 min · tape hiss included",
  station = "lofistack radio",
  initials = "lo",
  artLabel = "side b · 5 sec preview",
  clip = true,
  playLabel = "Play 5-second lofistack radio clip",
  stopLabel = "Stop clip",
  replayLabel = "replay loading",
  showReplay = true,
  loadingLabel = "loading…",
  width = 288,
  shimmerMs = 1400,
  fadeMs = 400,
}: SkeletonLoaderProps) {
  const controlled = loading !== undefined;
  const [selfLoading, setSelfLoading] = useState(true);
  const [run, setRun] = useState(0); // bumped by "replay loading" to restart the timer
  const isLoading = controlled ? loading : selfLoading;

  const audio = useRef<{ ctx: AudioContext; end: number } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [plays, setPlays] = useState(0); // remounts the progress line so it restarts from 0
  const [canPlay, setCanPlay] = useState(true);

  // Keep the latest callback without re-running the effects below when it changes.
  const onLoadedRef = useRef(onLoaded);
  useEffect(() => {
    onLoadedRef.current = onLoaded;
  });

  const stopClip = useCallback(() => {
    const a = audio.current;
    if (!a) return;
    audio.current = null;
    window.clearTimeout(a.end);
    a.ctx.close().catch(() => {}); // closing frees the audio hardware; ignore "already closed"
    setPlaying(false);
  }, []);

  const playClip = () => {
    const AC = audioContextClass();
    if (!AC) return;
    // Created on click only: browsers block sound that starts before the visitor interacts.
    const ctx = new AC();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    buildLofiClip(ctx, ctx.destination, ctx.currentTime + 0.05);
    audio.current = { ctx, end: window.setTimeout(stopClip, CLIP_SECONDS * 1000 + 150) };
    setPlays((n) => n + 1);
    setPlaying(true);
  };

  // Very old browsers have no Web Audio: show the play button as disabled instead of doing nothing.
  useEffect(() => setCanPlay(Boolean(audioContextClass())), []);

  // Close the audio if the component goes away mid-clip.
  useEffect(() => stopClip, [stopClip]);

  // Uncontrolled mode: pretend the content takes `loadMs` to arrive.
  useEffect(() => {
    if (controlled) return;
    const t = window.setTimeout(() => setSelfLoading(false), loadMs);
    return () => window.clearTimeout(t);
  }, [controlled, run, loadMs]);

  // Going back to the skeleton stops the music; arriving at the card tells the parent.
  const wasLoading = useRef(isLoading);
  useEffect(() => {
    if (isLoading) stopClip();
    else if (wasLoading.current) onLoadedRef.current?.();
    wasLoading.current = isLoading;
  }, [isLoading, stopClip]);

  const replay = () => {
    stopClip();
    setSelfLoading(true);
    setRun((n) => n + 1);
  };

  const vars = { "--ls-skel-shimmer": `${shimmerMs}ms`, "--ls-skel-fade": `${fadeMs}ms` } as CSSProperties;

  return (
    <div className="flex flex-col items-center gap-5 font-sans" style={vars}>
      <style>{KEYFRAMES}</style>
      <div
        className="box-border max-w-full rounded-xl border border-[#37302a] bg-[#282219] p-4 text-[#ece4d6]"
        style={{ width }}
        aria-live="polite"
        aria-busy={isLoading}
      >
        {isLoading ? (
          // Same shapes and spacing as the real card, so nothing jumps when it swaps.
          <div className="flex flex-col gap-3">
            <span className="sr-only">{loadingLabel}</span>
            <div className={`${shimmer} aspect-[4/3] w-full rounded-md`} aria-hidden="true" />
            {/* Each bar sits in a box one text line tall (h-lh) with the real text's size,
                so the card keeps the same height when the content swaps in. */}
            <div className="flex h-lh items-center text-sm leading-[1.3]" aria-hidden="true">
              <div className={`${shimmer} h-4 w-3/4 rounded-md`} />
            </div>
            <div className="flex h-lh items-center text-xs" aria-hidden="true">
              <div className={`${shimmer} h-3 w-1/2 rounded-md`} />
            </div>
            <div className="flex items-center gap-2 pt-1" aria-hidden="true">
              <div className={`${shimmer} size-8 shrink-0 rounded-full`} />
              <div className={`${shimmer} h-3 w-24 rounded-md`} />
            </div>
          </div>
        ) : (
          // Mounting fresh each time replays the fade-and-rise.
          <div className="flex flex-col gap-3 [animation:ls-skel-in_var(--ls-skel-fade)_ease-out] motion-reduce:[animation:none]">
            <div className="relative box-border flex aspect-[4/3] w-full items-end overflow-hidden rounded-md bg-[linear-gradient(160deg,#3a2f24_0%,#241d15_55%,#191410_100%)] p-3">
              <div className="flex items-center gap-2.5">
                {clip && (
                  <button
                    type="button"
                    onClick={playing ? stopClip : playClip}
                    disabled={!canPlay}
                    aria-label={playing ? stopLabel : playLabel}
                    className="flex size-[34px] shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-[#e0985f] p-0 text-[#16130f] transition-[scale,background-color] duration-160 hover:scale-[1.06] hover:bg-[#f3b983] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#e0985f] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100 disabled:hover:bg-[#e0985f] motion-reduce:transition-none"
                  >
                    {playing ? (
                      <svg className="block size-3.5 fill-current" viewBox="0 0 14 14" aria-hidden="true">
                        <rect x="2.5" y="2" width="3.2" height="10" rx="1" />
                        <rect x="8.3" y="2" width="3.2" height="10" rx="1" />
                      </svg>
                    ) : (
                      <svg className="block size-3.5 fill-current" viewBox="0 0 14 14" aria-hidden="true">
                        <path d="M3.5 1.8v10.4c0 .5.5.8.9.5l8-5.2a.6.6 0 0 0 0-1L4.4 1.3c-.4-.3-.9 0-.9.5z" />
                      </svg>
                    )}
                  </button>
                )}
                <span className="font-mono text-[11px] text-[#e0985f]">{artLabel}</span>
              </div>
              {clip && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-[#e0985f]/15" aria-hidden="true">
                  {/* 5s = CLIP_SECONDS. Still runs with reduced motion: it shows progress, not decoration. */}
                  {playing && (
                    <span key={plays} className="block h-full w-0 bg-[#e0985f] [animation:ls-skel-progress_5s_linear_forwards]" />
                  )}
                </span>
              )}
            </div>
            <h3 className="m-0 text-sm leading-[1.3] font-semibold">{title}</h3>
            <p className="m-0 text-xs text-[#a2977f]">{meta}</p>
            <div className="flex items-center gap-2 pt-1">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e0985f]/15 font-mono text-[11px] text-[#e0985f]" aria-hidden="true">
                {initials}
              </div>
              <span className="text-xs text-[#a2977f]">{station}</span>
            </div>
          </div>
        )}
      </div>
      {!controlled && showReplay && (
        <button
          type="button"
          onClick={replay}
          className="cursor-pointer rounded-full border border-[#37302a] bg-transparent px-4 py-1.5 font-mono text-[11px] text-[#a2977f] transition-[color,border-color,scale] duration-160 hover:border-[#e0985f] hover:text-[#e0985f] focus-visible:border-[#e0985f] focus-visible:text-[#e0985f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0985f] active:scale-[0.97] motion-reduce:transition-none"
        >
          {replayLabel}
        </button>
      )}
    </div>
  );
}

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

function audioContextClass(): typeof AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  return window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
}

/* ---------- the 5-second lofi clip, made live in the browser ----------
   Jazzy chords (Dm9 → G13 → Cmaj9 → Am7) on a soft electric-piano tone with a gentle tape wobble,
   a round sine bass, a lazy swung drum beat at 72 BPM, tape hiss and vinyl crackle.
   Takes any audio context (also an OfflineAudioContext, so the clip can be rendered and checked). */
export function buildLofiClip(ctx: BaseAudioContext, out: AudioNode, t0: number): void {
  const END = t0 + CLIP_SECONDS;
  const BEAT = 60 / 72;
  const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

  // master volume: quick fade in, gentle fade out, through a warm low-pass and a limiter
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, t0);
  master.gain.linearRampToValueAtTime(0.85, t0 + 0.12);
  master.gain.setValueAtTime(0.85, END - 0.9);
  master.gain.linearRampToValueAtTime(0, END);
  const warm = ctx.createBiquadFilter();
  warm.type = "lowpass";
  warm.frequency.value = 2600;
  warm.Q.value = 0.4;
  const limit = ctx.createDynamicsCompressor();
  limit.threshold.value = -10;
  limit.ratio.value = 6;
  limit.attack.value = 0.003;
  limit.release.value = 0.2;
  master.connect(warm);
  warm.connect(limit);
  limit.connect(out);

  // white noise, reused by drums and hiss
  const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * (CLIP_SECONDS + 0.5)), ctx.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  // tape wobble: a slow wave that bends the chord pitch a few cents
  const wow = ctx.createOscillator();
  wow.frequency.value = 0.55;
  const wowDepth = ctx.createGain();
  wowDepth.gain.value = 9;
  wow.connect(wowDepth);
  wow.start(t0);
  wow.stop(END + 0.1);

  // ---- chords: electric-piano tone = sine + a little triangle + a quiet octave ----
  const chords = [
    { at: 0, bass: 38, notes: [53, 57, 60, 64] }, // Dm9   (bass D)
    { at: 1.25, bass: 43, notes: [53, 59, 64, 69] }, // G13   (bass G)
    { at: 2.5, bass: 36, notes: [52, 55, 59, 62] }, // Cmaj9 (bass C)
    { at: 3.75, bass: 45, notes: [55, 60, 64, 67] }, // Am7   (bass A)
  ];
  const partials: [OscillatorType, number, number][] = [
    ["sine", 1, 1],
    ["triangle", 1, 0.35],
    ["sine", 2, 0.12],
  ];
  chords.forEach((c) => {
    const start = t0 + c.at;
    const stop = Math.min(start + 1.45, END);
    c.notes.forEach((m, k) => {
      const s = start + k * 0.018; // tiny strum
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(0.075, s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.03, s + 0.7);
      g.gain.exponentialRampToValueAtTime(0.0008, stop);
      partials.forEach(([type, mult, level]) => {
        const o = ctx.createOscillator();
        const og = ctx.createGain();
        o.type = type;
        o.frequency.value = hz(m) * mult;
        og.gain.value = level;
        wowDepth.connect(o.detune);
        o.connect(og);
        og.connect(g);
        o.start(s);
        o.stop(stop + 0.05);
      });
      g.connect(master);
    });
    // bass
    const b = ctx.createOscillator();
    const bg = ctx.createGain();
    b.type = "sine";
    b.frequency.value = hz(c.bass);
    bg.gain.setValueAtTime(0, start);
    bg.gain.linearRampToValueAtTime(0.28, start + 0.03);
    bg.gain.exponentialRampToValueAtTime(0.08, start + 0.9);
    bg.gain.exponentialRampToValueAtTime(0.0008, stop);
    b.connect(bg);
    bg.connect(master);
    b.start(start);
    b.stop(stop + 0.05);
  });

  // ---- drums (positions in beats; off-beat eighths are swung) ----
  const kick = (t: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(115, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    g.gain.setValueAtTime(0.75, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + 0.4);
  };
  const snare = (t: number) => {
    const n = ctx.createBufferSource();
    n.buffer = noise;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1700;
    bp.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.32, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    n.connect(bp);
    bp.connect(g);
    g.connect(master);
    n.start(t, Math.random() * 2, 0.22);
    const body = ctx.createOscillator();
    const bg = ctx.createGain();
    body.frequency.value = 185;
    bg.gain.setValueAtTime(0.12, t);
    bg.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    body.connect(bg);
    bg.connect(master);
    body.start(t);
    body.stop(t + 0.1);
  };
  const hat = (t: number, vol: number) => {
    const n = ctx.createBufferSource();
    n.buffer = noise;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    n.connect(hp);
    hp.connect(g);
    g.connect(master);
    n.start(t, Math.random() * 2, 0.06);
  };
  [0, 1.75, 2.5, 4].forEach((b) => kick(t0 + b * BEAT));
  [1, 3, 5].forEach((b) => snare(t0 + b * BEAT));
  for (let e = 0; e < 12; e++) {
    const beat = Math.floor(e / 2) + (e % 2 ? 0.6 : 0); // swing: the off-beat lands late
    const t = t0 + beat * BEAT;
    if (t < END - 0.05) hat(t, e % 2 ? 0.035 : 0.06);
  }

  // ---- tape hiss (steady, quiet) ----
  const hiss = ctx.createBufferSource();
  hiss.buffer = noise;
  const hf = ctx.createBiquadFilter();
  hf.type = "bandpass";
  hf.frequency.value = 5000;
  hf.Q.value = 0.3;
  const hg = ctx.createGain();
  hg.gain.value = 0.02;
  hiss.connect(hf);
  hf.connect(hg);
  hg.connect(limit); // skips the warm filter so it stays airy
  hiss.start(t0);
  hiss.stop(END);

  // ---- vinyl crackle (random soft pops) ----
  const crack = ctx.createBuffer(1, Math.floor(ctx.sampleRate * CLIP_SECONDS), ctx.sampleRate);
  const cd = crack.getChannelData(0);
  for (let j = 0; j < cd.length; j++) if (Math.random() < 0.00035) cd[j] = (Math.random() * 2 - 1) * 0.7;
  const cs = ctx.createBufferSource();
  cs.buffer = crack;
  const cf = ctx.createBiquadFilter();
  cf.type = "highpass";
  cf.frequency.value = 1200;
  const cgn = ctx.createGain();
  cgn.gain.setValueAtTime(0, t0);
  cgn.gain.linearRampToValueAtTime(0.35, t0 + 0.1);
  cgn.gain.setValueAtTime(0.35, END - 0.6);
  cgn.gain.linearRampToValueAtTime(0, END);
  cs.connect(cf);
  cf.connect(cgn);
  cgn.connect(limit);
  cs.start(t0);
}
