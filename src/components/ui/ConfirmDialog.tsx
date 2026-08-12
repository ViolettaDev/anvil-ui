"use client";

/**
 * ConfirmDialog — the "are you sure?" step in front of an irreversible action.
 *
 * Composed on Dialog, not a fork of it: same surface, same focus trap, same
 * dismiss guard. What it adds is the shape of the decision — two buttons, the
 * safe one first, and two accessibility details Dialog cannot assume:
 *
 *   role="alertdialog"  the panel interrupts, so it is announced as an alert
 *                       rather than a plain dialog
 *   focus on Cancel     Radix focuses the first tabbable element, which here
 *                       would be the close X. Landing on the safe choice means
 *                       a reflex Enter or Space cancels instead of confirming.
 *
 * Controlled: pass `open` + `onOpenChange`. `onConfirm` fires and the dialog
 * closes itself. `destructive` repaints the confirm button in the danger token.
 *
 * Props that matter:
 *   labels  { confirm, cancel, close } — all optional, English by default
 */
import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { cn } from "@/lib/cn";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Paint the confirm button as destructive. Use it for anything you cannot undo. */
  destructive?: boolean;
  onConfirm: () => void;
  /** Extra classes on the panel. Applied last so they win. */
  className?: string;
  labels?: {
    /** Default: "Confirm". */
    confirm?: string;
    /** Default: "Cancel". */
    cancel?: string;
    /** aria-label of the close button. Default: "Close". */
    close?: string;
  };
}

const buttonBase =
  "h-9 cursor-pointer rounded-btn px-4 text-ui font-semibold transition-colors active:opacity-90";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  destructive = false,
  onConfirm,
  className,
  labels,
}: ConfirmDialogProps) {
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={title}
        description={description}
        role="alertdialog"
        className={className}
        labels={{ close: labels?.close }}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelRef.current?.focus();
        }}
      >
        <div className="flex justify-end gap-2.5 pt-4">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(buttonBase, "border border-line bg-card text-ink hover:border-ink-3")}
          >
            {labels?.cancel ?? "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={cn(
              buttonBase,
              destructive
                ? // Tinted at rest, solid on hover, so the button reads as
                  // dangerous without shouting louder than the dialog itself.
                  // `text-card` is the on-danger colour: the kit has no
                  // `danger-ink`, and card is the one token that inverts with
                  // the theme exactly like a foreground on a filled surface has
                  // to — near-white in light, near-black in dark.
                  "border border-danger bg-danger-tint text-danger hover:bg-danger hover:text-card"
                : "bg-accent text-accent-ink hover:opacity-90",
            )}
          >
            {labels?.confirm ?? "Confirm"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
