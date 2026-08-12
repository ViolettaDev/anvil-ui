"use client";

/**
 * RadioGroup — one choice out of several. Native inputs, box drawn by the kit.
 *
 * Radio is not a checkbox with round corners, and the difference is behavioural:
 * arrow keys move between options and only the checked one is a tab stop, so
 * Tab enters and leaves the whole group in one press. The browser gives you all
 * of that for free from a set of `<input type="radio">` sharing a `name` — which
 * is why these are real inputs, hidden with `sr-only` rather than `hidden`, and
 * why `name` is required rather than optional.
 *
 * The visible circle is a `<span>`: styling the native control means
 * `accent-color`, which takes the accent and ignores the border, the disabled
 * treatment and the dot size, and paints differently per browser.
 *
 * A group has no "uncheck" — once a radio is selected the user cannot clear it
 * with the keyboard or mouse. Model the empty state as its own option, or use
 * checkboxes.
 */

import { createContext, useContext, useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface RadioContext {
  name: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const Ctx = createContext<RadioContext | null>(null);

function useRadioGroup(): RadioContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("<Radio> must be rendered inside a <RadioGroup>.");
  return ctx;
}

export interface RadioGroupProps {
  /** Shared across the inputs. This is what makes them one group. */
  name: string;
  value: string;
  onChange: (value: string) => void;
  /** Names the group for assistive tech. Required — a bare set of radios is not self-describing. */
  label: ReactNode;
  hideLabel?: boolean;
  description?: ReactNode;
  /** Disables every option in the group. */
  disabled?: boolean;
  orientation?: "vertical" | "horizontal";
  className?: string;
  children: ReactNode;
}

export function RadioGroup({
  name,
  value,
  onChange,
  label,
  hideLabel,
  description,
  disabled,
  orientation = "vertical",
  className,
  children,
}: RadioGroupProps) {
  const base = useId();
  const labelId = `${base}-label`;
  const descId = `${base}-desc`;

  return (
    // role="radiogroup" + aria-labelledby rather than a <fieldset>/<legend>:
    // legend is famously hard to position and resists flex layout, and the ARIA
    // pair is announced identically.
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      aria-describedby={description ? descId : undefined}
      className={cn("flex flex-col gap-1.5", className)}
    >
      <span id={labelId} className={cn("text-ui font-medium text-ink", hideLabel && "sr-only")}>
        {label}
      </span>
      {description ? (
        <p id={descId} className="text-nano text-ink-3">
          {description}
        </p>
      ) : null}
      <div
        className={cn(
          "flex gap-x-4 gap-y-2",
          orientation === "vertical" ? "flex-col" : "flex-row flex-wrap",
        )}
      >
        <Ctx.Provider value={{ name, value, onChange, disabled }}>{children}</Ctx.Provider>
      </div>
    </div>
  );
}

export interface RadioProps {
  value: string;
  label: ReactNode;
  /** Disables this option only. The group's `disabled` still wins. */
  disabled?: boolean;
  className?: string;
}

export function Radio({ value, label, disabled, className }: RadioProps) {
  const group = useRadioGroup();
  const checked = group.value === value;
  const isDisabled = disabled || group.disabled;

  return (
    <label
      className={cn(
        "group inline-flex items-center gap-2 text-ui text-ink",
        isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
    >
      <input
        type="radio"
        name={group.name}
        value={value}
        checked={checked}
        disabled={isDisabled}
        onChange={() => group.onChange(value)}
        className="peer sr-only"
        // Form fillers mutate this before hydration; the mismatch is theirs.
        suppressHydrationWarning
      />
      <span
        aria-hidden
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded-full border transition-colors",
          // The input is visually hidden, so the global focus ring lands where
          // nobody can see it. This moves that same ring onto the circle.
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-ring",
          checked ? "border-accent" : "border-line bg-card",
          !checked && !isDisabled && "group-hover:border-ink-3",
        )}
      >
        {checked ? <span className="size-2 rounded-full bg-accent" /> : null}
      </span>
      <span>{label}</span>
    </label>
  );
}
