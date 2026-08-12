"use client";

/**
 * Reveal — fades and lifts its children the first time they scroll into view.
 *
 * Built on nothing: an IntersectionObserver and two CSS classes. No animation
 * library, no variants, no motion runtime shipped to the browser.
 *
 * WHY IT IS WRITTEN THIS WAY — the hydration trap
 * -----------------------------------------------
 * The obvious implementation reads `matchMedia("(prefers-reduced-motion)")` (or
 * a hook wrapping it) and picks the initial markup from the answer. That is a
 * hydration mismatch: on the server the answer is always null/false, on the
 * first client render it is the real value, so the two renders disagree. It
 * type-checks, it lints, it passes unit tests, and it only ever fails in a real
 * browser. So this component reads NOTHING client-only while rendering: the
 * first render is unconditionally the hidden state, identical on both sides.
 * The observer is created in an effect — after hydration — and flipping the
 * state afterwards is a normal update, not a mismatch.
 *
 * Reduced motion is therefore not a JS branch at all. globals.css clamps every
 * transition under `prefers-reduced-motion: reduce` AND force-shows anything
 * carrying `data-reveal`, so the entrance simply does not exist for those users
 * and content is visible from the first paint. The same rule set covers the
 * no-JavaScript case via `@media (scripting: none)` — an element must never be
 * left stranded at opacity 0 because the observer never ran.
 *
 * Props that matter:
 *   as        — tag to render (default "div"); use "li"/"section"/… so the
 *               reveal wrapper does not break the surrounding semantics.
 *   delay     — milliseconds before this element starts. Note: milliseconds,
 *               not the seconds a motion library would take.
 *   duration  — milliseconds of transition (default 600).
 *   once      — reveal once and stop observing (default). Set false to re-hide
 *               on the way out and replay on the way back in.
 *   amount    — fraction of the element that must be visible to trigger.
 *   rootMargin— shrinks the trigger box; the default -8% bottom means the
 *               reveal starts a little before the element touches the fold.
 *
 * The wrapper is a real element in the layout. It sets no colour, spacing or
 * display of its own — pass `className` for that (a grid child stays a grid
 * child).
 *
 * The hidden state is `opacity: 0`, never `visibility` or `display`, so the
 * content stays in the accessibility tree and stays focusable. A keyboard user
 * tabbing into a not-yet-revealed link scrolls it into view, which is precisely
 * what fires the observer — focus and the reveal cannot get out of step.
 */

import {
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/lib/cn";

export interface UseInViewOptions {
  /** Fraction of the element that must be visible to count as in view. 0–1. */
  amount?: number;
  /** Stop observing after the first hit. Default true. */
  once?: boolean;
  /** IntersectionObserver rootMargin. */
  rootMargin?: string;
}

/**
 * Tracks whether an element has entered the viewport. Shared by Reveal and
 * Stagger — Stagger imports it from here rather than growing a second copy.
 *
 * The threshold is clamped to what the element can physically reach: a section
 * three viewports tall can never be 15% visible, so a naive `threshold: 0.15`
 * would leave it hidden forever. Measuring happens in the effect, so it cannot
 * affect the first render.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>({
  amount = 0.15,
  once = true,
  rootMargin = "0px 0px -8% 0px",
}: UseInViewOptions = {}): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  // `false` on both the server and the first client render — reading anything
  // about the environment here is the hydration mismatch this component exists
  // to avoid. The environment is inspected only inside the effect below.
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Ancient or non-DOM environments: show the content rather than trap it.
    // Scheduled rather than set synchronously — a setState in the effect body
    // is a cascading render, and the lint rule that forbids it is right. A
    // microtask still lands before paint, so nothing flashes.
    if (typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(id);
    }

    const viewport = window.innerHeight || document.documentElement.clientHeight;
    const height = el.getBoundingClientRect().height;
    const reachable = height > viewport && height > 0 ? (viewport * 0.9) / height : amount;
    const threshold = Math.max(0, Math.min(1, Math.min(amount, reachable)));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [amount, once, rootMargin]);

  return [ref, inView];
}

/**
 * Tags worth wrapping content in. Widen it if your markup needs more.
 * Note that an inline element ignores `translate` — a `span` fades but does not
 * lift unless you also give it `inline-block`.
 */
export type RevealTag =
  | "div"
  | "span"
  | "section"
  | "article"
  | "aside"
  | "header"
  | "footer"
  | "figure"
  | "ul"
  | "ol"
  | "li"
  | "p"
  | "h2"
  | "h3";

export interface RevealProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  children: ReactNode;
  as?: RevealTag;
  /** Milliseconds before the transition starts. */
  delay?: number;
  /** Milliseconds the transition runs for. */
  duration?: number;
  once?: boolean;
  amount?: number;
  rootMargin?: string;
}

export function Reveal({
  children,
  as = "div",
  delay = 0,
  duration = 600,
  once = true,
  amount = 0.15,
  rootMargin = "0px 0px -8% 0px",
  className,
  style,
  ...rest
}: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ amount, once, rootMargin });

  // Cast to a single tag so the ref and the spread type-check. The runtime tag
  // is whatever `as` says; every member of RevealTag takes the same attributes.
  const Tag = as as "div";

  return (
    <Tag
      ref={ref}
      // Marks the element for the safety-net rules in globals.css. Keep it even
      // once revealed — the rules are inert on a visible element.
      data-reveal=""
      data-revealed={inView ? "" : undefined}
      className={cn(
        "transition-[opacity,translate] ease-[cubic-bezier(0.2,0.7,0.3,1)]",
        inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className,
      )}
      // Delay and duration are per-instance, so they cannot be Tailwind classes
      // — the compiler only sees class strings that exist in the source. The
      // reduced-motion clamp in globals.css is `!important` and still wins over
      // these. Consumer `style` is spread last and beats both.
      style={{ transitionDelay: `${delay}ms`, transitionDuration: `${duration}ms`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
