"use client";

/**
 * Toaster — sonner, repainted in kit tokens.
 *
 * Mount once, near the root of the app. Fire toasts from anywhere:
 *
 *   import { toast } from "sonner";
 *   toast("Saved")  ·  toast.success("Done")  ·  toast.error("Failed")
 *
 * Two things about sonner drive everything below.
 *
 * First, it exposes its palette as CSS variables on the toaster element, so
 * theming is a matter of pointing those at the kit's own variables. Because they
 * resolve at paint time and the kit's variables flip with `prefers-color-scheme`
 * and `[data-theme]`, a single mounted Toaster is correct in light and dark with
 * no `theme` prop, no state, and no re-render.
 *
 * Second, sonner injects its stylesheet into <head> at import time, UNLAYERED.
 * Unlayered declarations beat anything in a cascade layer no matter how specific
 * — and every Tailwind utility lives in a layer. So a plain `text-ink-2` here
 * silently loses to sonner's own rule, which is why the class overrides below
 * all carry `!`. Importance outranks layer order; specificity never enters into
 * it. Drop the `!` and the classes become decoration.
 *
 * What that fixes, concretely: sonner hard-codes the description grey, the close
 * button's colours and the buttons' focus ring, and picks between light and dark
 * values using ITS OWN theme attribute — which knows nothing about the kit's.
 * Left alone, a dark-mode toast renders a near-black description on a dark card
 * and a focus ring of near-transparent black, invisible against it. Everything
 * type-coloured is re-pointed at kit tokens instead.
 *
 * The kit has one accent, so success does not get its own hue: the type shows in
 * the icon (accent for success, danger for error) rather than in a green or red
 * panel. Info and warning keep the neutral icon colour. The `richColors` variant
 * is wired to tokens too, so turning it on stays readable in dark rather than
 * falling back to sonner's light-only palettes.
 *
 * Every prop is forwarded. `className`, `style` and `toastOptions` are merged
 * rather than replaced — passing `toastOptions` to add a duration should not
 * quietly wipe the theming, which a plain spread would do.
 */

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { cn } from "@/lib/cn";
import type { CSSProperties } from "react";

type ToastClassNames = NonNullable<
  NonNullable<ToasterProps["toastOptions"]>["classNames"]
>;

/**
 * sonner's palette, re-pointed at the kit's raw variables. These deliberately
 * reference `--card` / `--ink` / … and not the `--color-*` theme aliases: the
 * raw ones are declared on `:root` in globals.css, which is what makes them
 * usable from an inline style like this.
 */
const TOKEN_VARS = {
  "--normal-bg": "var(--card)",
  "--normal-text": "var(--ink)",
  "--normal-border": "var(--line)",

  "--success-bg": "var(--accent-tint)",
  "--success-text": "var(--ink)",
  "--success-border": "var(--accent)",

  "--error-bg": "var(--danger-tint)",
  "--error-text": "var(--ink)",
  "--error-border": "var(--danger)",

  /* No amber or blue in the palette — these stay neutral on purpose. */
  "--info-bg": "var(--card)",
  "--info-text": "var(--ink)",
  "--info-border": "var(--line)",

  "--warning-bg": "var(--card)",
  "--warning-text": "var(--ink)",
  "--warning-border": "var(--line)",
} as CSSProperties;

/** The one focus ring, re-stated because sonner sets `outline: none` first. */
const FOCUS =
  "focus-visible:outline-2! focus-visible:outline-offset-2! focus-visible:outline-accent-ring!";

const CLASSNAMES: ToastClassNames = {
  toast: cn("rounded-btn!", "text-body!", FOCUS),
  description: "text-ink-2!",
  icon: "text-ink-3!",

  /* Descendant selector, so it outranks `icon` above without needing to. */
  success: "[&_[data-icon]]:text-accent!",
  error: "[&_[data-icon]]:text-danger!",

  closeButton:
    "bg-card! text-ink-2! border-line! hover:bg-surface! hover:text-ink! hover:border-line!",
  actionButton: cn(
    "rounded-btn! bg-accent! text-accent-ink! focus-visible:shadow-none!",
    FOCUS,
  ),
  cancelButton: cn(
    "rounded-btn! bg-surface! text-ink! focus-visible:shadow-none!",
    FOCUS,
  ),
};

export function Toaster({
  className,
  style,
  toastOptions,
  ...props
}: ToasterProps) {
  return (
    <Sonner
      position="bottom-center"
      {...props}
      // sonner hard-codes its own font stack on the container; `font-sans!`
      // hands typography back to the app's.
      className={cn("font-sans!", className)}
      style={{ ...TOKEN_VARS, ...style }}
      toastOptions={{
        ...toastOptions,
        classNames: { ...CLASSNAMES, ...toastOptions?.classNames },
      }}
    />
  );
}
