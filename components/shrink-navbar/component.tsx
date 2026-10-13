// Shrink-on-Scroll Navbar — React + TypeScript + Tailwind CSS.
// A sticky top bar that is tall and see-through at the top of the page and eases into a compact, blurred bar
// once you scroll, with an optional amber scroll-progress line. In narrow spaces the links fold into a menu.
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";

export interface NavLink {
  /** Text of the link. */
  label: string;
  /** Where it goes, e.g. "#pricing" or "/blog". */
  href: string;
}

export interface NavCta {
  /** Text of the call-to-action pill. */
  label: string;
  /** Renders the pill as a link to this address. Default none (renders a button) */
  href?: string;
  /** Click handler (for the button form, or extra work on the link). Default none */
  onClick?: () => void;
}

export interface ShrinkNavbarProps {
  /** Logo or name on the left (scaled down with the bar). Required */
  brand: ReactNode;
  /** The navigation links. Required */
  links: NavLink[];
  /** href of the current link: gets aria-current="page" and the amber underline. Default none */
  activeHref?: string;
  /** Called when a link is chosen (bar or menu). Call event.preventDefault() to handle it yourself. Default none */
  onNavigate?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
  /** Amber call-to-action pill at the right (moves into the menu when space is tight). Default none */
  cta?: NavCta;
  /** Scroll distance in px after which the bar shrinks. Default 24 */
  shrinkAt?: number;
  /** Thin amber line along the bottom that fills as you scroll. Default true */
  showProgress?: boolean;
  /** The element that scrolls, if it isn't the window (e.g. a scrollable box). Default the window */
  scrollContainer?: RefObject<HTMLElement | null>;
  /** Bar height in px at the top of the page. Default 80 */
  tallHeight?: number;
  /** Bar height in px once shrunk. Default 56 */
  compactHeight?: number;
  /** Scale of the brand once shrunk (1 = no change). Default 0.86 */
  brandScale?: number;
  /** Accessible name of the nav landmark. Default "Main" */
  label?: string;
  /** Screen-reader text of the menu button. Default "Menu" */
  menuLabel?: string;
  /** Extra classes for the header. Default "" */
  className?: string;
}

// Clicking one of these outside the open menu keeps its own focus (we don't pull focus back to the button).
const CONTROLS = "a[href],button,input,select,textarea,summary,[contenteditable=true],[role=button],[role=link]";
// No `outline-none` with it: in Tailwind v4 that sets --tw-outline-style to none and the ring would inherit it.
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e0985f]";

export default function ShrinkNavbar({
  brand,
  links,
  activeHref,
  onNavigate,
  cta,
  shrinkAt = 24,
  showProgress = true,
  scrollContainer,
  tallHeight = 80,
  compactHeight = 56,
  brandScale = 0.86,
  label = "Main",
  menuLabel = "Menu",
  className = "",
}: ShrinkNavbarProps) {
  const root = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const shrunkRef = useRef(false);
  const refocusTimer = useRef(0);
  const [shrunk, setShrunk] = useState(false);
  const [open, setOpen] = useState(false);
  const panelId = useId();

  // One passive scroll listener, throttled to one read per frame. React only re-renders when the bar
  // flips between tall and compact; the progress line is a CSS variable written straight to the DOM.
  useEffect(() => {
    const box = scrollContainer?.current ?? null;
    const target: HTMLElement | Window = box ?? window;
    let frame = 0;
    const read = () => {
      frame = 0;
      const top = box ? box.scrollTop : window.scrollY;
      const max = box
        ? box.scrollHeight - box.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight;
      root.current?.style.setProperty("--ls-nav-progress", String(max > 0 ? Math.min(top / max, 1) : 0));
      const next = top > shrinkAt;
      if (next !== shrunkRef.current) {
        shrunkRef.current = next;
        setShrunk(next);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    target.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [scrollContainer, shrinkAt]);

  // While the menu is open: Escape or a click outside closes it and puts focus back on the menu button.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus({ preventScroll: true });
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panel.current?.contains(t) || button.current?.contains(t)) return;
      setOpen(false);
      // If the click landed on a control (link, button, field), let it keep focus. Otherwise refocus the
      // button, after the browser's own mousedown focus change (which would blur it again).
      if (!(t instanceof Element && t.closest(CONTROLS))) {
        // (kept in a ref: closing re-runs this effect's cleanup, which must not cancel it)
        refocusTimer.current = window.setTimeout(() => button.current?.focus({ preventScroll: true }));
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);
  useEffect(() => () => window.clearTimeout(refocusTimer.current), []);

  // Tabbing out of the menu closes it without moving focus.
  const onNavBlur = (e: FocusEvent<HTMLElement>) => {
    if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
  };

  const choose = (href: string, e: MouseEvent<HTMLAnchorElement>, fromMenu: boolean) => {
    onNavigate?.(href, e);
    if (fromMenu) {
      setOpen(false);
      button.current?.focus({ preventScroll: true });
    }
  };

  // no display class here: each use sets its own, so "hidden" can never lose to it
  const ctaClass = `shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#e0985f] font-semibold text-[#16130f] shadow-[0_8px_20px_-12px_rgba(224,152,95,0.8)] transition-[background-color,scale,height,padding] duration-300 ease-out hover:bg-[#f3b983] active:scale-[0.96] motion-reduce:transition-none ${FOCUS}`;
  const renderCta = (extra: string, fromMenu: boolean) => {
    if (!cta) return null;
    const onClick = () => {
      cta.onClick?.();
      if (fromMenu) {
        setOpen(false);
        button.current?.focus({ preventScroll: true });
      }
    };
    return cta.href ? (
      <a href={cta.href} onClick={onClick} className={`${ctaClass} ${extra}`}>
        {cta.label}
      </a>
    ) : (
      <button type="button" onClick={onClick} className={`${ctaClass} ${extra}`}>
        {cta.label}
      </button>
    );
  };

  return (
    // The header keeps the tall height in the page flow the whole time, so content never jumps when the
    // bar shrinks; only the inner bar changes size. Its empty part lets clicks through.
    <header
      ref={root}
      className={`@container pointer-events-none sticky top-0 z-40 font-sans ${className}`}
      style={{ height: tallHeight }}
    >
      <div
        data-shrunk={shrunk || undefined}
        className={`pointer-events-auto relative flex items-center gap-3 border-b transition-[height,padding,background-color,border-color,box-shadow] duration-300 ease-out motion-reduce:transition-none ${
          shrunk
            ? "border-[#37302a] bg-[#1f1b16]/80 px-3 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)] backdrop-blur-md @md:px-4"
            : "border-transparent bg-transparent px-4 @md:px-6"
        }`}
        style={{ height: shrunk ? compactHeight : tallHeight }}
      >
        <div
          className="min-w-0 origin-left transition-[scale] duration-300 ease-out motion-reduce:transition-none"
          style={{ scale: shrunk ? brandScale : 1 }}
        >
          {brand}
        </div>

        <nav aria-label={label} onBlur={onNavBlur} className="ml-auto flex items-center gap-2">
          <ul role="list" className="hidden items-center gap-1 @2xl:flex">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  aria-current={l.href === activeHref ? "page" : undefined}
                  onClick={(e) => choose(l.href, e, false)}
                  className={`relative block rounded-full px-3 py-1.5 text-[14px]/5 font-medium text-[#a2977f] transition-[color,background-color] duration-150 after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-[#e0985f] after:transition-transform after:duration-200 hover:bg-[#ece4d6]/6 hover:text-[#ece4d6] active:bg-[#ece4d6]/10 aria-[current=page]:text-[#ece4d6] aria-[current=page]:after:scale-x-100 motion-reduce:transition-none motion-reduce:after:transition-none ${FOCUS}`}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          {renderCta(`hidden @md:inline-flex @2xl:ml-2 ${shrunk ? "h-8 px-3.5 text-[13px]" : "h-9 px-4 text-[14px]"}`, false)}

          <button
            ref={button}
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((o) => !o)}
            className={`relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#37302a] text-[#ece4d6] transition-[background-color,border-color,scale] duration-150 hover:border-[#4a4037] hover:bg-[#ece4d6]/6 active:scale-95 aria-expanded:border-[#4a4037] aria-expanded:bg-[#ece4d6]/8 motion-reduce:transition-none @2xl:hidden ${FOCUS}`}
          >
            <span className="sr-only">{menuLabel}</span>
            {/* three lines that fold into an X */}
            <span aria-hidden="true" className="relative block h-3 w-4">
              {["top-0", "top-[5px]", "top-[10px]"].map((pos, i) => (
                <span
                  key={pos}
                  className={`absolute left-0 block h-[1.5px] w-4 rounded-full bg-current transition-[translate,rotate,opacity] duration-200 motion-reduce:transition-none ${pos} ${
                    open ? (i === 0 ? "translate-y-[5px] rotate-45" : i === 1 ? "opacity-0" : "-translate-y-[5px] -rotate-45") : ""
                  }`}
                />
              ))}
            </span>
          </button>

          <div
            ref={panel}
            id={panelId}
            hidden={!open}
            className="absolute inset-x-3 top-full mt-2 rounded-2xl border border-[#37302a] bg-[#1f1b16]/95 p-2 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.85)] backdrop-blur-md transition-[opacity,translate] duration-200 ease-out starting:-translate-y-1 starting:opacity-0 motion-reduce:transition-none @2xl:hidden"
          >
            <ul role="list" className="flex flex-col">
              {links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    aria-current={l.href === activeHref ? "page" : undefined}
                    onClick={(e) => choose(l.href, e, true)}
                    className={`block rounded-xl px-3 py-2.5 text-[15px]/5 font-medium text-[#a2977f] decoration-[#e0985f] decoration-2 underline-offset-[6px] transition-[color,background-color] duration-150 hover:bg-[#ece4d6]/6 hover:text-[#ece4d6] active:bg-[#ece4d6]/10 aria-[current=page]:text-[#ece4d6] aria-[current=page]:underline motion-reduce:transition-none ${FOCUS} focus-visible:outline-offset-0`}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            {cta && <div className="mt-1 border-t border-[#37302a] p-1 pt-2 @md:hidden">{renderCta("flex h-10 w-full px-4 text-[14px]", true)}</div>}
          </div>
        </nav>

        {showProgress && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 origin-left bg-[#e0985f] [transform:scaleX(var(--ls-nav-progress,0))]"
          />
        )}
      </div>
    </header>
  );
}
