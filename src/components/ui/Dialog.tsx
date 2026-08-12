"use client";

/**
 * Dialog — modal surface built on @radix-ui/react-dialog.
 *
 * Radix gives you the hard parts: focus trap, focus restore on close, Escape to
 * dismiss, `aria-modal`, and inert background content. This wrapper adds the
 * surface, a titled header, a bottom sheet variant, and one guard Radix does
 * not ship — see `guardPopperClose`.
 *
 * `title` is required and becomes the accessible name, so never render your own
 * heading. Omitting `description` leaves the dialog with none, rather than one
 * that repeats the title back.
 */
import * as React from "react";
import * as D from "@radix-ui/react-dialog";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

/**
 * Structural shape shared by Radix's PointerDownOutside / InteractOutside
 * events: a custom event carrying the raw `originalEvent` under `detail`. Kept
 * loose so one handler satisfies both callback slots.
 */
type DismissGuardEvent = {
  target: EventTarget | null;
  detail?: { originalEvent?: { target?: EventTarget | null } };
  preventDefault: () => void;
};

/**
 * Keep the dialog open when a pointer interaction starts inside another
 * portaled layer (Select, DropdownMenu, Popover, Tooltip). Those render outside
 * the dialog's DOM subtree, so Radix would otherwise read a click on a select
 * item as an "outside" click and close the modal underneath it. Pure function,
 * no hooks, so it lives at module scope and is shared by every Content.
 */
function guardPopperClose(event: DismissGuardEvent) {
  const target = event.target as HTMLElement | null;
  if (
    target?.closest(
      "[data-radix-popper-content-wrapper],[data-radix-select-viewport],[data-radix-menu-content],[data-radix-popover-content],[data-radix-tooltip-content],[role=listbox],[role=menu]",
    )
  ) {
    event.preventDefault();
    return;
  }
  // Belt and braces: a popper can be detached from the DOM before this fires,
  // so `closest()` above sees nothing. If the interaction started on a node
  // that is no longer connected, treat it as "inside" and stay open.
  const origin = event.detail?.originalEvent?.target as Node | null;
  if (origin && origin.isConnected === false) {
    event.preventDefault();
  }
}

/** Spread onto every Content so all modals share one definition of "outside". */
const dismissGuardProps = {
  onPointerDownOutside: guardPopperClose,
  onInteractOutside: guardPopperClose,
};

export const Dialog = D.Root;

/**
 * Radix's trigger, re-exported unchanged. Pass `asChild` to make your own
 * element the trigger instead of getting a nested button.
 */
export const DialogTrigger = D.Trigger;

/** Closes the dialog from anywhere inside it. Also accepts `asChild`. */
export const DialogClose = D.Close;

export interface DialogContentProps {
  children: React.ReactNode;
  /** Accessible name of the dialog. Rendered as the visible heading. */
  title: string;
  /** Optional supporting line, wired up as the dialog's accessible description. */
  description?: string;
  /** Hide the default close (X) button. Escape and the overlay still dismiss. */
  hideClose?: boolean;
  /** Max width utility (default `max-w-md`). Ignored when `sheet`. */
  widthClass?: string;
  /**
   * Render as a bottom sheet: full width, pinned to the bottom of the viewport
   * with a rounded top edge, instead of a centered panel. For mobile surfaces.
   */
  sheet?: boolean;
  /**
   * `alertdialog` for interruptions the user must answer (see ConfirmDialog).
   * Leave unset for everything else — Radix already applies `dialog`.
   */
  role?: "dialog" | "alertdialog";
  /**
   * Runs when the dialog takes focus on open. `preventDefault()` stops Radix
   * focusing the first tabbable element, letting you focus a safer one; the
   * focus trap stays active either way.
   */
  onOpenAutoFocus?: (event: Event) => void;
  /** Extra classes on the panel. Applied last so they win. */
  className?: string;
  labels?: {
    /** aria-label of the close button. Default: "Close". */
    close?: string;
  };
}

export function DialogContent({
  children,
  title,
  description,
  hideClose = false,
  widthClass = "max-w-md",
  sheet = false,
  role,
  onOpenAutoFocus,
  className,
  labels,
}: DialogContentProps) {
  const closeLabel = labels?.close ?? "Close";
  // Sheet and centered panel differ only in placement and corner radius;
  // surface, padding and max height are shared.
  const placementClass = sheet
    ? "inset-x-0 bottom-0 w-full rounded-t-card"
    : cn("left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 rounded-card", widthClass);
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-overlay bg-scrim backdrop-blur-sm" />
      <D.Content
        {...dismissGuardProps}
        // Radix spreads YOUR props over its own defaults, so a prop passed as
        // `undefined` still wins and blanks the default. Both of these are
        // therefore spread conditionally, never passed as `undefined`:
        //   role  — omitted, Radix keeps its own `dialog`
        //   aria-describedby — omitted, Radix keeps the link to <Description>
        {...(role ? { role } : null)}
        // No description means no description. The source repeated the title
        // into a visually hidden one, which makes a screen reader read the same
        // sentence twice; `undefined` is Radix's documented opt-out.
        {...(description ? null : { "aria-describedby": undefined })}
        onOpenAutoFocus={onOpenAutoFocus}
        // Radix moves focus to the panel itself on open. That focus is
        // programmatic, not a keyboard journey, so the global ring would be
        // noise here — every control INSIDE the panel still gets it.
        className={cn(
          "fixed z-overlay max-h-[90svh] overflow-y-auto border border-line bg-card px-5 py-5 text-ink shadow-xl focus:outline-none sm:p-6",
          placementClass,
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <D.Title className="text-lead font-semibold tracking-tight text-ink">
            {title}
          </D.Title>
          {!hideClose && (
            <D.Close
              className="-mt-1 -me-1 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-btn bg-transparent text-ink-2 transition-colors hover:text-ink"
              aria-label={closeLabel}
            >
              {/* Decorative: the button already carries the accessible name. */}
              <Icon name="x" size={14} strokeWidth={2.4} />
            </D.Close>
          )}
        </div>
        {description ? (
          <D.Description className="mt-1.5 text-body leading-relaxed text-ink-2">
            {description}
          </D.Description>
        ) : null}
        <div className="mt-5">{children}</div>
      </D.Content>
    </D.Portal>
  );
}
