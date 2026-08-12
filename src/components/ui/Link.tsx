"use client";

/**
 * Link — an inline text link. For a link that looks like a button, use
 * `ButtonLink`.
 *
 * `external` is opt-in rather than sniffed from the href, and adds three things
 * together: `rel="noopener noreferrer"`, a visible arrow, and an `sr-only`
 * phrase — the arrow is `aria-hidden`, so on its own it warns nobody who cannot
 * see it.
 *
 * `subtle` drops the accent colour but never the underline: colour alone does
 * not mark a link accessibly.
 */

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface LinkProps extends ComponentPropsWithoutRef<"a"> {
  /** Opens in a new tab, safely, and says so. */
  external?: boolean;
  /** Body-coloured instead of accent. Keeps the underline. */
  subtle?: boolean;
  /** Announced after the label when `external`. */
  externalLabel?: string;
  children: ReactNode;
}

export function Link({
  external = false,
  subtle = false,
  externalLabel = "opens in a new tab",
  className,
  children,
  ...rest
}: LinkProps) {
  return (
    <a
      {...rest}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
      className={cn(
        "rounded-btn underline underline-offset-2 transition-colors",
        subtle ? "text-ink decoration-line hover:decoration-ink-3" : "text-accent decoration-accent-tint hover:decoration-accent",
        className,
      )}
    >
      {children}
      {external ? (
        <>
          <span aria-hidden className="ms-0.5 inline-block align-baseline text-[0.85em]">
            ↗
          </span>
          <span className="sr-only"> ({externalLabel})</span>
        </>
      ) : null}
    </a>
  );
}
