"use client";

/**
 * Checkbox — native input semantics, box drawn by the kit.
 *
 * The control is a real `<input type="checkbox">`, kept in the DOM (`sr-only`,
 * not `hidden`) so it keeps everything the platform gives you for free: Space to
 * toggle, form participation via `name` / `value`, the `indeterminate` DOM
 * property that makes assistive tech announce "mixed", and click-to-toggle from
 * the wrapping `<label>`.
 *
 * The visible box is a `<span>` rather than the browser's own widget. Styling
 * the native control means `accent-color`, and `accent-color` takes the accent
 * but ignores everything else — border colour, `rounded-btn`, the disabled
 * treatment — and paints a differently-shaped tick per browser. Drawing the box
 * ourselves keeps the checkbox on the same tokens as every other surface in the
 * kit, in both themes, everywhere.
 *
 * The one thing that costs: the focus ring. Our input is visually hidden, so the
 * global `:focus-visible` outline lands on something nobody can see. The box
 * re-asserts that same ring through `peer-focus-visible:` using the same
 * `accent-ring` token — it is the global ring moved, not a second ring invented.
 *
 * `indeterminate` is a DOM property, not an attribute, so React cannot render
 * it; it is written imperatively through a ref. Checked beats indeterminate,
 * matching the header-checkbox case it exists for: some rows selected → mixed,
 * all rows selected → checked.
 *
 * Labelling is enforced by the type: pass `label` for a visible one (associated
 * implicitly by the wrapping `<label>` — keep it to inline content, never a link
 * or a button) or `ariaLabel` when the label lives elsewhere, e.g. a table
 * header. There is no way to render this component unlabelled.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

interface CheckboxBaseProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Tri-state for "select all": shown only while `checked` is false. */
  indeterminate?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  value?: string;
  /** Applied to the wrapping label, so callers control layout and spacing. */
  className?: string;
}

export type CheckboxProps = CheckboxBaseProps &
  (
    | { label: ReactNode; ariaLabel?: string }
    | { label?: never; ariaLabel: string }
  );

export function Checkbox({
  checked,
  onChange,
  indeterminate = false,
  disabled,
  id,
  name,
  value,
  className,
  label,
  ariaLabel,
}: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  const mixed = indeterminate && !checked;
  const filled = checked || mixed;

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = mixed;
  }, [mixed]);

  return (
    <label
      className={cn(
        "group inline-flex items-center gap-2 text-ui text-ink",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
    >
      <input
        ref={ref}
        type="checkbox"
        id={id}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
        // Password managers and form fillers mutate this control before React
        // hydrates; the mismatch is theirs, not ours.
        suppressHydrationWarning
      />
      <span
        aria-hidden
        className={cn(
          // rounded-sm, not rounded-btn: at 8px on a 16px box the corners meet
          // and the control reads as a radio button.
          "grid size-4 shrink-0 place-items-center rounded-sm border transition-colors",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-ring",
          filled
            ? "border-accent bg-accent text-accent-ink"
            : "border-line bg-card",
          !filled && !disabled && "group-hover:border-ink-3",
        )}
      >
        {filled ? (
          <Icon name={mixed ? "minus" : "check"} size={10} strokeWidth={3} />
        ) : null}
      </span>
      {label != null ? <span>{label}</span> : null}
    </label>
  );
}
