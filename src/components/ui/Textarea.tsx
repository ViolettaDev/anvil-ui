"use client";

/**
 * Textarea — the multi-line twin of `Input`, same tokens, same wiring.
 *
 * Optional auto-grow, off by default. When on, the height is recomputed from
 * `scrollHeight` on every change AND on mount, because a field rendered with a
 * value already in it (an edit form, a restored draft) would otherwise open at
 * one row and jump on the first keystroke.
 *
 * The measure runs in a layout effect, not a plain effect, so the browser never
 * paints the wrong height. And `rows` still applies: it sets the FLOOR the field
 * grows from, which is why the reset below is to `auto` and not to zero.
 *
 * `maxRows` caps the growth and hands scrolling back to the element. Without it
 * a pasted essay pushes the submit button off the screen.
 */

import {
  useCallback,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { Field } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

export interface TextareaProps
  extends Omit<ComponentPropsWithoutRef<"textarea">, "id" | "required"> {
  label: ReactNode;
  hideLabel?: boolean;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Grow with the content instead of scrolling. */
  autoGrow?: boolean;
  /** Only with `autoGrow`. Past this many rows it scrolls instead. */
  maxRows?: number;
  className?: string;
  textareaClassName?: string;
}

export function Textarea({
  label,
  hideLabel,
  description,
  error,
  required,
  autoGrow = false,
  maxRows,
  className,
  textareaClassName,
  disabled,
  rows = 3,
  onChange,
  ...rest
}: TextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el || !autoGrow) return;
    // Collapse first: scrollHeight never shrinks below the current height.
    el.style.height = "auto";
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
    const max = maxRows ? maxRows * lineHeight : Infinity;
    const next = Math.min(el.scrollHeight, max);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, [autoGrow, maxRows]);

  // Layout effect, so a pre-filled field is already the right height on the
  // first paint rather than snapping after it.
  useLayoutEffect(resize, [resize]);

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
        <textarea
          {...control}
          {...rest}
          ref={ref}
          rows={rows}
          disabled={disabled}
          onChange={(e) => {
            resize();
            onChange?.(e);
          }}
          className={cn(
            "w-full rounded-btn border bg-card px-3 py-2 text-body text-ink transition-colors",
            "placeholder:text-ink-3 disabled:cursor-not-allowed disabled:opacity-60",
            autoGrow ? "resize-none" : "resize-y",
            error ? "border-danger" : "border-line",
            !error && !disabled && "hover:border-ink-3",
            textareaClassName,
          )}
          suppressHydrationWarning
        />
      )}
    </Field>
  );
}
