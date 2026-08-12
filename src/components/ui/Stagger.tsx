"use client";

/**
 * Stagger / StaggerItem — one scroll trigger, children entering in sequence.
 *
 * Built on the same IntersectionObserver as Reveal (it imports `useInView`
 * from there). The container is what gets observed; the items animate. That is
 * deliberate: N cards in a grid should not mean N observers, and they should
 * start together relative to the grid rather than each on its own crossing.
 *
 * Hydration: nothing client-only is read while rendering. Every item's first
 * render is unconditionally the hidden state, identical on server and client,
 * and the observer that flips it lives in an effect. Reading a motion query, a
 * media query or `document` to choose the initial markup is the mismatch that
 * passes tsc, eslint and vitest and then breaks in a browser. Reduced motion is
 * handled entirely by the `data-reveal` rules in globals.css.
 *
 * Sequencing is a transition-delay, not a timer: item i waits `i * gap`.
 * Indices are assigned automatically to direct <StaggerItem> children, so the
 * common case takes no props at all:
 *
 *   <Stagger className="grid gap-4 sm:grid-cols-3">
 *     {items.map((it) => <StaggerItem key={it.id}>…</StaggerItem>)}
 *   </Stagger>
 *
 * Auto-numbering only sees DIRECT children (a wrapping fragment counts as one
 * child). If your items sit deeper, pass `index` yourself — an explicit index
 * is never overwritten.
 *
 * A StaggerItem rendered outside a Stagger renders visible instead of hidden.
 * Content is never left stranded because a container was refactored away.
 *
 * Props that matter:
 *   gap      — milliseconds between consecutive items (default 80).
 *   delay    — milliseconds before item 0 starts.
 *   duration — milliseconds each item's transition runs for.
 *   once / amount / rootMargin — passed to the observer, same as Reveal.
 */

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { useInView, type RevealTag } from "@/components/ui/Reveal";

interface StaggerContextValue {
  revealed: boolean;
  gap: number;
  delay: number;
  duration: number;
}

const StaggerContext = createContext<StaggerContextValue | null>(null);

export interface StaggerProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  children: ReactNode;
  as?: RevealTag;
  /** Milliseconds between consecutive items. */
  gap?: number;
  /** Milliseconds before the first item starts. */
  delay?: number;
  /** Milliseconds each item's transition runs for. */
  duration?: number;
  once?: boolean;
  amount?: number;
  rootMargin?: string;
}

export function Stagger({
  children,
  as = "div",
  gap = 80,
  delay = 0,
  duration = 600,
  once = true,
  amount = 0.1,
  rootMargin = "0px 0px -8% 0px",
  className,
  ...rest
}: StaggerProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ amount, once, rootMargin });

  // Numbering happens during render and is derived purely from `children`, so
  // it is deterministic and survives re-renders. Only real StaggerItems are
  // touched — injecting `index` into a plain <div> would hit the DOM as an
  // unknown attribute.
  let next = 0;
  const numbered = Children.map(children, (child) => {
    if (!isValidElement(child) || child.type !== StaggerItem) return child;
    const props = child.props as StaggerItemProps;
    if (props.index !== undefined) return child;
    return cloneElement(child as ReactElement<StaggerItemProps>, { index: next++ });
  });

  // The container itself never hides: only the items carry the entrance, which
  // keeps the layout box (and any grid it establishes) stable throughout.
  const Tag = as as "div";

  return (
    <StaggerContext.Provider value={{ revealed: inView, gap, delay, duration }}>
      <Tag ref={ref} className={className} {...rest}>
        {numbered}
      </Tag>
    </StaggerContext.Provider>
  );
}

export interface StaggerItemProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  children: ReactNode;
  as?: RevealTag;
  /** Position in the sequence. Filled in automatically for direct children. */
  index?: number;
}

export function StaggerItem({
  children,
  as = "div",
  index = 0,
  className,
  style,
  ...rest
}: StaggerItemProps) {
  const ctx = useContext(StaggerContext);

  // No container → nothing will ever flip this on, so start visible.
  const revealed = ctx ? ctx.revealed : true;
  const gap = ctx?.gap ?? 80;
  const base = ctx?.delay ?? 0;
  const duration = ctx?.duration ?? 600;

  const Tag = as as "div";

  return (
    <Tag
      data-reveal=""
      data-revealed={revealed ? "" : undefined}
      className={cn(
        "transition-[opacity,translate] ease-[cubic-bezier(0.2,0.7,0.3,1)]",
        revealed ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className,
      )}
      style={{
        transitionDelay: `${base + index * gap}ms`,
        transitionDuration: `${duration}ms`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
