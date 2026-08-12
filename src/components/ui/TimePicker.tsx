"use client";

/**
 * TimePicker — a time field with no dependencies at all: no time library, and
 * not even Radix. It is a button with `role="combobox"` and a `role="listbox"`
 * of generated slots, wired by hand.
 *
 * Why hand-wired rather than built on the kit's Select: focus never leaves the
 * trigger. The active option is pointed at with `aria-activedescendant`, so
 * there is no focus trap to manage, no portal, and nothing to restore on close
 * — which is the whole reason the ARIA combobox pattern exists. The tradeoff is
 * that the list is absolutely positioned inside the field instead of being
 * collision-aware; if you drop this into a short scroll container near the
 * bottom of the viewport, that is the thing that will bite you.
 *
 * Value shape: `value` and the argument to `onChange` are 24-hour "HH:MM"
 * strings — "09:00", "17:30" — with "" for empty. Always 24-hour and always
 * zero-padded, whatever the display locale does; the 12/24-hour clock, the AM
 * marker and the separator are presentation only, from Intl.DateTimeFormat.
 * A `value` that is not one of the generated slots still shows correctly on the
 * trigger, it simply matches no option.
 *
 * The option list runs `fromMin` → `toMin` inclusive in `stepMin` steps, all in
 * minutes past midnight (8 * 60 = 08:00). Labels come from `locale`, a BCP-47
 * tag defaulting to "en-US" rather than the runtime default — an undefined
 * locale resolves to the server's during SSR and the browser's on hydration,
 * and the two disagree. `hour12` overrides the locale's clock when you need to.
 *
 * Keyboard: ↑ ↓ move, PageUp/PageDown jump 5, Home/End ends of the list,
 * Enter/Space select, Escape closes without changing the value, Tab closes and
 * moves on, and typing jumps ("14" → 14:00, "9" → 09:00).
 *
 * Usage:
 *   <TimePicker value={time} onChange={setTime} fromMin={9 * 60} toMin={18 * 60} />
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

function isHHMM(s: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

/** "HH:MM" → a throwaway Date, only ever used as an Intl formatting vehicle. */
function asDate(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(2024, 0, 1, h, m);
}

export interface TimePickerProps {
  /** 24-hour "HH:MM", or "" for empty. */
  value: string;
  /** Receives a 24-hour "HH:MM". */
  onChange: (hhmm: string) => void;
  /** Trigger text while empty. Default "Select time". */
  placeholder?: string;
  /** First slot, in minutes past midnight. Default 480 (08:00). */
  fromMin?: number;
  /** Last slot, inclusive, in minutes past midnight. Default 1200 (20:00). */
  toMin?: number;
  /** Slot spacing in minutes. Default 30. */
  stepMin?: number;
  /** BCP-47 tag for the option labels. Default "en-US". */
  locale?: string;
  /** Forces the 12- or 24-hour clock; omit to follow the locale. */
  hour12?: boolean;
  id?: string;
  /** Accessible name for the trigger when there is no visible <label>. */
  ariaLabel?: string;
  invalid?: boolean;
  disabled?: boolean;
  /** Appended to the trigger's classes, last. */
  className?: string;
}

export function TimePicker({
  value,
  onChange,
  placeholder,
  fromMin = 8 * 60,
  toMin = 20 * 60,
  stepMin = 30,
  locale = "en-US",
  hour12,
  id,
  ariaLabel,
  invalid,
  disabled,
  className,
}: TimePickerProps) {
  const reactId = useId();
  const listId = `${reactId}-list`;
  const optionId = (i: number) => `${reactId}-opt-${i}`;

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typed = useRef({ buffer: "", at: 0 });

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const fmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", hour12 }),
    [locale, hour12],
  );

  const options = useMemo(() => {
    const out: { value: string; label: string }[] = [];
    const step = Math.max(1, Math.round(stepMin)); // a step of 0 would spin forever
    for (let m = fromMin; m <= toMin; m += step) {
      const hhmm = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      out.push({ value: hhmm, label: fmt.format(asDate(hhmm)) });
    }
    return out;
  }, [fromMin, toMin, stepMin, fmt]);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const lastIndex = options.length - 1;

  // Close on any pointer landing outside the field.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep the active option visible; `nearest` never scrolls when it already is.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function openList() {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function commit(index: number) {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
  }

  function move(to: number) {
    setActiveIndex(Math.min(lastIndex, Math.max(0, to)));
  }

  /** Type-ahead: "14" → 14:00, "9" → 09:00, "9:3" → 09:30. */
  function jumpTo(char: string) {
    const now = Date.now();
    const buffer = (now - typed.current.at < 800 ? typed.current.buffer : "") + char.toLowerCase();
    typed.current = { buffer, at: now };
    const match = options.findIndex((o) =>
      [o.value, o.value.replace(/^0/, ""), o.label.toLowerCase().replace(/\s/g, "")].some((c) =>
        c.startsWith(buffer),
      ),
    );
    if (match < 0) return;
    setActiveIndex(match);
    if (!open) setOpen(true);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (open) move(activeIndex + 1);
        else openList();
        return;
      case "ArrowUp":
        e.preventDefault();
        if (open) move(activeIndex - 1);
        else openList();
        return;
      case "PageDown":
        if (!open) return;
        e.preventDefault();
        move(activeIndex + 5);
        return;
      case "PageUp":
        if (!open) return;
        e.preventDefault();
        move(activeIndex - 5);
        return;
      case "Home":
        if (!open) return;
        e.preventDefault();
        move(0);
        return;
      case "End":
        if (!open) return;
        e.preventDefault();
        move(lastIndex);
        return;
      case "Enter":
      case " ":
        e.preventDefault(); // Space would scroll the page
        if (open) commit(activeIndex);
        else openList();
        return;
      case "Escape":
        if (!open) return;
        e.preventDefault();
        setOpen(false); // focus is already on the trigger — nothing to restore
        return;
      case "Tab":
        setOpen(false);
        return;
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) jumpTo(e.key);
    }
  }

  const hasValue = isHHMM(value);
  const triggerLabel = hasValue ? fmt.format(asDate(value)) : (placeholder ?? "Select time");

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? optionId(activeIndex) : undefined}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          "inline-flex h-10 w-full items-center justify-between gap-2 rounded-btn border bg-card px-3 text-start text-ui transition-colors",
          invalid ? "border-danger" : "border-line",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          !disabled && !invalid && "hover:border-ink-3",
          hasValue ? "text-ink" : "text-ink-3",
          className,
        )}
      >
        <span className="truncate">{triggerLabel}</span>
        <ClockIcon />
      </button>

      {open ? (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          // Keeps the mousedown from blurring the trigger, so the click that
          // follows still lands on an option that is still mounted.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-btn border border-line bg-card p-1 shadow-2xl"
        >
          {options.map((o, i) => {
            const isSelected = o.value === value;
            const isActive = i === activeIndex;
            return (
              <div
                key={o.value}
                id={optionId(i)}
                role="option"
                data-index={i}
                aria-selected={isSelected}
                onClick={() => commit(i)}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  "cursor-pointer select-none rounded-btn px-3 py-2 text-ui tabular-nums transition-colors",
                  isSelected ? "font-semibold text-ink" : "text-ink-2",
                  isActive && "bg-accent-tint",
                )}
              >
                {o.label}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// Inline SVG rather than the kit's Icon component: this file stays
// copy-pasteable on its own.
function ClockIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      focusable="false"
      className="shrink-0 text-ink-3"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.6V8l2.4 1.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
