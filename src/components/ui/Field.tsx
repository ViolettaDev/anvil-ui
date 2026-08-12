"use client";

/**
 * Field — the label / description / error wiring every form control needs,
 * written once. Works for controls that render their own trigger too (`Select`,
 * `Combobox`, `DatePicker`), which cannot take a plain `<label htmlFor>`.
 *
 * Children is a function so the ids cannot be half-wired:
 *
 *   <Field label="Email" error={err}>
 *     {(f) => <input {...f} type="email" />}
 *   </Field>
 *
 * `describedBy` collapses to `undefined` rather than `""`, which points at
 * nothing and trips some screen readers. Error replaces the description instead
 * of stacking under it.
 */

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** What a control needs to be correctly labelled and described. Spread it. */
export interface FieldControlProps {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": boolean | undefined;
  required: boolean | undefined;
}

export interface FieldProps {
  label: ReactNode;
  /** Hidden visually, still read out. For controls whose purpose is obvious. */
  hideLabel?: boolean;
  /** Steady-state guidance. Replaced by `error` while one is present. */
  description?: ReactNode;
  /** Presence marks the control invalid; the text is announced. */
  error?: ReactNode;
  required?: boolean;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

export function Field({
  label,
  hideLabel,
  description,
  error,
  required,
  className,
  children,
}: FieldProps) {
  const base = useId();
  const id = `${base}-control`;
  const descId = `${base}-desc`;
  const errId = `${base}-err`;

  const describedBy =
    [error ? errId : null, !error && description ? descId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className={cn(
          "text-ui font-medium text-ink",
          hideLabel && "sr-only",
        )}
      >
        {label}
        {required ? (
          // aria-hidden: `required` on the control already announces it, and a
          // literal "asterisk" read after every label is pure noise.
          <span aria-hidden className="ms-0.5 text-danger">
            *
          </span>
        ) : null}
      </label>

      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        required: required || undefined,
      })}

      {error ? (
        <p id={errId} role="alert" className="text-nano text-danger">
          {error}
        </p>
      ) : description ? (
        <p id={descId} className="text-nano text-ink-3">
          {description}
        </p>
      ) : null}
    </div>
  );
}
