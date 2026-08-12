"use client";

/**
 * Input — a text field on the kit's tokens, with the label/hint/error wiring
 * attached via `Field`. Extends the native props, so `type`, `name`,
 * `autoComplete` and the rest behave as usual.
 *
 * `suppressHydrationWarning` earns its place: password managers mutate inputs
 * before React hydrates, and the resulting console error only reproduces on
 * machines that have the extension — expensive to chase, and not our bug.
 *
 * `error` is a node rather than a boolean so the message and the invalid state
 * cannot drift apart.
 */

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Field } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

export interface InputProps
  // `prefix` is omitted because it is a real global HTML attribute, typed
  // `string`, and an interface cannot narrow an inherited member to ReactNode —
  // TS2430. The affordance is called `leading`/`trailing` here instead of
  // `prefix`/`suffix`, which also reads better next to `dir="rtl"`: what sits at
  // the start of the field is not "before" it in every writing direction.
  extends Omit<ComponentPropsWithoutRef<"input">, "id" | "required" | "prefix"> {
  label: ReactNode;
  hideLabel?: boolean;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Rendered inside the field, at the start. Icons, a currency sign. */
  leading?: ReactNode;
  /** Rendered inside the field, at the end. A unit, a clear button. */
  trailing?: ReactNode;
  /** Applied to the outer Field wrapper, not the input. */
  className?: string;
  inputClassName?: string;
}

export function Input({
  label,
  hideLabel,
  description,
  error,
  required,
  leading,
  trailing,
  className,
  inputClassName,
  disabled,
  ...rest
}: InputProps) {
  return (
    <Field
      label={label}
      hideLabel={hideLabel}
      description={description}
      error={error}
      required={required}
      className={className}
    >
      {(control) => (
        // The wrapper carries the border so prefix and suffix sit INSIDE the
        // field. `focus-within` mirrors the focus state onto it, because the
        // ring lands on the bare <input>, which is inset from this edge.
        <div
          className={cn(
            "flex items-center gap-2 rounded-btn border bg-card px-3 transition-colors",
            error ? "border-danger" : "border-line",
            !error && !disabled && "hover:border-ink-3",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          {leading ? (
            <span aria-hidden className="shrink-0 text-ink-3">
              {leading}
            </span>
          ) : null}
          <input
            {...control}
            {...rest}
            disabled={disabled}
            className={cn(
              "w-full bg-transparent py-2 text-body text-ink outline-none",
              "placeholder:text-ink-3 disabled:cursor-not-allowed",
              inputClassName,
            )}
            // See the note in the file header: extensions mutate this node
            // before hydration. The mismatch is theirs.
            suppressHydrationWarning
          />
          {trailing ? <span className="shrink-0 text-ink-3">{trailing}</span> : null}
        </div>
      )}
    </Field>
  );
}
