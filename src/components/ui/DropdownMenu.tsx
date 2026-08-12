"use client";

/**
 * DropdownMenu — a menu of ACTIONS, built on Radix DropdownMenu.
 *
 * This is the component people reach for by mistake, so the line is worth
 * drawing: a menu RUNS something. "Duplicate", "Export CSV", "Sign out", a link
 * to Settings. It has no value, nothing stays checked, and the menu closes
 * because the thing happened. If instead you are choosing one of N values and
 * the choice has to show up in the trigger afterwards, that is a Select — use
 * `@/components/ui/Select`. Screen readers hear the difference (`menuitem` vs
 * `option` in a `listbox`), and so do keyboard users: a Select reopens on the
 * current value, a menu never does.
 *
 * Usage:
 *   <DropdownMenu>
 *     <DropdownMenuTrigger>
 *       <button className="…">Actions</button>
 *     </DropdownMenuTrigger>
 *     <DropdownMenuContent align="end">
 *       <DropdownMenuLabel>Record</DropdownMenuLabel>
 *       <DropdownMenuItem onSelect={duplicate}>Duplicate</DropdownMenuItem>
 *       <DropdownMenuItem href="/settings">Settings</DropdownMenuItem>
 *       <DropdownMenuSeparator />
 *       <DropdownMenuItem variant="danger" onSelect={remove}>Delete</DropdownMenuItem>
 *     </DropdownMenuContent>
 *   </DropdownMenu>
 *
 * Props worth knowing:
 *   DropdownMenuTrigger — `asChild` defaults to TRUE, because a menu trigger
 *                         should be your own button, not a second one nested
 *                         inside it. Pass exactly one element child.
 *   DropdownMenuItem    — `onSelect` to run something, `href` (+ `external`) to
 *                         navigate, `asChild` to supply your own link component
 *                         (a framework <Link>, say), `variant="danger"` for
 *                         destructive actions, `disabled`.
 *
 * Radix owns the hard parts — roving focus, typeahead, Escape, click-outside,
 * returning focus to the trigger on close — and none of it is overridden here.
 * Styling is kit tokens only, and focus stays on the single global ring from
 * globals.css: nothing here sets `outline-none`, which is what usually kills it.
 */

import * as DM from "@radix-ui/react-dropdown-menu";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

export const DropdownMenu = DM.Root;
export const DropdownMenuGroup = DM.Group;

export type DropdownMenuTriggerProps = ComponentPropsWithoutRef<
  typeof DM.Trigger
>;

export const DropdownMenuTrigger = forwardRef<
  ComponentRef<typeof DM.Trigger>,
  DropdownMenuTriggerProps
>(function DropdownMenuTrigger({ asChild = true, ...props }, ref) {
  return <DM.Trigger ref={ref} asChild={asChild} {...props} />;
});

export type DropdownMenuContentProps = ComponentPropsWithoutRef<
  typeof DM.Content
>;

export const DropdownMenuContent = forwardRef<
  ComponentRef<typeof DM.Content>,
  DropdownMenuContentProps
>(function DropdownMenuContent(
  { className, children, align = "start", sideOffset = 8, collisionPadding = 8, ...props },
  ref,
) {
  return (
    <DM.Portal>
      <DM.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          "z-50 min-w-40 overflow-hidden rounded-btn border border-line bg-card p-1 text-ink shadow-xl",
          className,
        )}
        {...props}
      >
        {children}
      </DM.Content>
    </DM.Portal>
  );
});

type ItemVariant = "default" | "danger";

export interface DropdownMenuItemProps
  extends Omit<ComponentPropsWithoutRef<typeof DM.Item>, "onSelect"> {
  children: ReactNode;
  /** Runs on click, Enter and Space. Call `event.preventDefault()` to keep the menu open. */
  onSelect?: (event: Event) => void;
  /** Renders the item as an anchor. Ignored when `asChild` is set. */
  href?: string;
  /** For `href` items: open in a new tab, with the rel that makes that safe. */
  external?: boolean;
  /** Destructive actions read in the danger token, including their highlight. */
  variant?: ItemVariant;
}

const ITEM_VARIANTS: Record<ItemVariant, string> = {
  default: "text-ink data-highlighted:bg-accent-tint",
  danger: "text-danger data-highlighted:bg-danger-tint",
};

export const DropdownMenuItem = forwardRef<
  ComponentRef<typeof DM.Item>,
  DropdownMenuItemProps
>(function DropdownMenuItem(
  { children, className, href, external, variant = "default", asChild, ...props },
  ref,
) {
  const itemCls = cn(
    // Same note as Select: the highlight is data-highlighted, which Radix sets
    // for pointer and keyboard alike, so no `hover:` rule is needed on top.
    "flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-ui transition-colors select-none data-disabled:pointer-events-none data-disabled:opacity-50",
    ITEM_VARIANTS[variant],
    className,
  );

  if (href && !asChild) {
    return (
      <DM.Item ref={ref} asChild className={itemCls} {...props}>
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
        >
          {children}
        </a>
      </DM.Item>
    );
  }

  return (
    <DM.Item ref={ref} asChild={asChild} className={itemCls} {...props}>
      {children}
    </DM.Item>
  );
});

export type DropdownMenuLabelProps = ComponentPropsWithoutRef<typeof DM.Label>;

export const DropdownMenuLabel = forwardRef<
  ComponentRef<typeof DM.Label>,
  DropdownMenuLabelProps
>(function DropdownMenuLabel({ className, ...props }, ref) {
  return (
    <DM.Label
      ref={ref}
      className={cn(
        "px-3 py-1.5 text-nano font-semibold tracking-wider text-ink-3 uppercase",
        className,
      )}
      {...props}
    />
  );
});

export const DropdownMenuSeparator = forwardRef<
  ComponentRef<typeof DM.Separator>,
  ComponentPropsWithoutRef<typeof DM.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <DM.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-line", className)}
      {...props}
    />
  );
});
