"use client";

/**
 * Tooltip — hover/focus label built on @radix-ui/react-tooltip.
 *
 * A tooltip is a DESCRIPTION, not a name: Radix wires it up with
 * `aria-describedby`, so an icon-only trigger still needs its own `aria-label`.
 * If the tooltip text IS the only label, put it on the button too. Radix also
 * opens on keyboard focus and closes on Escape — both come for free, and both
 * break the moment you replace this with a `title` attribute or a CSS-only
 * `:hover` label.
 *
 * Props that matter:
 *   label     the tooltip content
 *   side      which edge of the trigger it hangs off (default "top")
 *   enabled   false renders the trigger alone, no tooltip at all — for rails
 *             that only need labels while collapsed
 *
 * Usage — the provider is optional, group tooltips in one to share its delay:
 *   <TooltipProvider>
 *     <Tooltip label="Calendar" side="right">
 *       <button aria-label="Calendar">…</button>
 *     </Tooltip>
 *   </TooltipProvider>
 */
import * as React from "react";
import * as RT from "@radix-ui/react-tooltip";
import { cn } from "@/lib/cn";

/**
 * Marks "there is already a provider above me". Radix throws when a tooltip
 * renders outside one, which is a nasty surprise in a drop-in kit, so `Tooltip`
 * falls back to a local provider when this reads false.
 */
const HasProvider = React.createContext(false);

export interface TooltipProviderProps {
  children: React.ReactNode;
  /** Hover time before opening, ms. Radix's own default (700) is sluggish for icon rails. */
  delayDuration?: number;
  /** Grace period in which moving to a neighbouring trigger skips the delay, ms. */
  skipDelayDuration?: number;
}

/**
 * Wrap a group of tooltips — an icon rail, a toolbar — so moving between them
 * opens instantly instead of re-waiting the delay. Optional: a lone `Tooltip`
 * provides for itself.
 */
export function TooltipProvider({
  children,
  delayDuration = 200,
  skipDelayDuration = 300,
}: TooltipProviderProps) {
  return (
    <HasProvider.Provider value={true}>
      <RT.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
        {children}
      </RT.Provider>
    </HasProvider.Provider>
  );
}

export interface TooltipProps {
  /** The trigger. Must be a single element that accepts a ref — Radix renders onto it. */
  children: React.ReactNode;
  label: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  /** Gap between trigger and tooltip, px. */
  sideOffset?: number;
  /** Hover time before opening, ms. Overrides the provider. */
  delayDuration?: number;
  /** Render the tooltip only when true (e.g. only while a rail is collapsed). */
  enabled?: boolean;
  /** Extra classes on the tooltip surface. Applied last so they win. */
  className?: string;
}

export function Tooltip({
  children,
  label,
  side = "top",
  align = "center",
  sideOffset = 8,
  delayDuration,
  enabled = true,
  className,
}: TooltipProps) {
  const hasProvider = React.useContext(HasProvider);

  if (!enabled) return <>{children}</>;

  const root = (
    <RT.Root delayDuration={delayDuration}>
      <RT.Trigger asChild>{children}</RT.Trigger>
      <RT.Portal>
        <RT.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            "z-overlay rounded-btn border border-line bg-card px-2.5 py-1.5 text-ui font-medium text-ink shadow-lg",
            className,
          )}
        >
          {label}
          <RT.Arrow className="fill-card" />
        </RT.Content>
      </RT.Portal>
    </RT.Root>
  );

  if (hasProvider) return root;
  return (
    <RT.Provider delayDuration={200} skipDelayDuration={300}>
      {root}
    </RT.Provider>
  );
}
