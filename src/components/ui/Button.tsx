"use client";

/**
 * Button — four intents, three sizes, on the kit's tokens.
 *
 * Renders a real `<button>`. There is no `asChild`: that pattern relies on
 * cloning a single child and merging props onto it, it breaks in confusing ways
 * when the child is a fragment or a component that does not forward props, and
 * it is the first thing to rot when the underlying library changes its mind
 * about it. When you need a link that looks like a button, use `ButtonLink`
 * below — an `<a>` is not a button and pretending otherwise costs you keyboard
 * behaviour (Space activates a button, Enter activates a link) and the right
 * role in assistive tech.
 *
 * `loading` disables the button and swaps in a spinner while KEEPING the label
 * mounted and the width stable, so the layout does not jump mid-click. The busy
 * state is announced through `aria-busy`, and the label stays in the accessible
 * name rather than being replaced by "Loading".
 *
 * `type` defaults to "button". The platform default is "submit", which inside a
 * form turns every unlabelled button into an accidental submit — a bug that only
 * shows up once the button is dropped into a form months later.
 */

import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-ink border-accent hover:opacity-90",
  secondary: "bg-card text-ink border-line hover:border-ink-3",
  ghost: "bg-transparent text-ink-2 border-transparent hover:bg-accent-tint hover:text-ink",
  danger: "bg-danger text-accent-ink border-danger hover:opacity-90",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-nano gap-1.5",
  md: "h-10 px-4 text-ui gap-2",
  lg: "h-12 px-6 text-body gap-2",
};

const BASE =
  "inline-flex items-center justify-center rounded-btn border font-medium transition-[opacity,background-color,border-color] " +
  "disabled:cursor-not-allowed disabled:opacity-50";

function Spinner() {
  return (
    <span
      aria-hidden
      // Motion is clamped globally under prefers-reduced-motion, so this stops
      // spinning for anyone who asked it to.
      className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

export interface ButtonLinkProps extends ComponentPropsWithoutRef<"a"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * A link wearing the button's clothes. Use it whenever the thing navigates.
 * Drop-in for `next/link` too: `<ButtonLink href=… />` or wrap it.
 */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <a
      {...rest}
      className={cn(BASE, VARIANTS[variant], SIZES[size], "no-underline", className)}
    >
      {children}
    </a>
  );
}
