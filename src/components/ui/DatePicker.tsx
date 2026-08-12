"use client";

/**
 * DatePicker — a date field built from a Radix Popover and a month grid this
 * file draws by hand.
 *
 * There is no calendar library underneath and there is no date library either:
 * the 42-cell month, the week offset and the month arithmetic are the ~40 lines
 * of helpers at the top. They are duplicated in DateRangePicker on purpose —
 * the kit promises that a component file can be copied into your app on its
 * own, and a shared `lib/date.ts` would quietly break that promise.
 *
 * Date shape — read this before wiring it up:
 *   `value`, `min`, `max` and the argument passed to `onChange` are all ISO
 *   CALENDAR DATE strings, "YYYY-MM-DD". Never Date objects, never ISO
 *   date-times, never UTC. The empty string means "nothing selected".
 *   Those strings sort lexicographically in chronological order, which is why
 *   the min/max comparisons below are plain `<` and `>`.
 *   Parsing anchors at 12:00 LOCAL time (`new Date("2026-03-29T12:00:00")`, no
 *   trailing Z) so that a DST jump at midnight can never roll a day over.
 *
 * Localisation without a dependency: pass `locale` (any BCP-47 tag) and month
 * and weekday names come from `Intl.DateTimeFormat`. It defaults to "en-US"
 * rather than the runtime default on purpose — an undefined locale resolves to
 * the server's locale during SSR and the browser's on hydration, which is a
 * mismatch waiting to happen. Every piece of chrome text is a prop.
 *
 * Keyboard (the grid follows the ARIA grid pattern, roving tabindex):
 *   ← →           ±1 day (mirrored automatically when the grid renders RTL)
 *   ↑ ↓           ±1 week
 *   PageUp/Down   ±1 month, ±1 year with Shift
 *   Home/End      first/last day of the focused week
 *   Enter/Space   select (native button activation, not re-implemented)
 *   Escape        close and return focus to the trigger (Radix)
 *
 * Usage:
 *   <DatePicker value={date} onChange={setDate} min={todayISO} />
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/lib/cn";

/* ── date helpers: pure, string-in/string-out, no library ─────────────────── */

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** Midday anchor: immune to DST transitions that happen at 00:00. */
function parseISO(iso: string) {
  return new Date(`${iso}T12:00:00`);
}
function isISO(s: string | undefined): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function addDays(iso: string, n: number) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}
/** Clamps the day so 31 Jan + 1 month is 28/29 Feb, not 2/3 March. */
function addMonths(iso: string, n: number) {
  const d = parseISO(iso);
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1, 12);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), lastDay));
  return toISO(target);
}
function clampISO(iso: string, min?: string, max?: string) {
  if (isISO(min) && iso < min) return min;
  if (isISO(max) && iso > max) return max;
  return iso;
}
/** How far a date sits from the start of its week, given the week start. */
function weekOffset(d: Date, weekStartsOn: number) {
  return (d.getDay() - weekStartsOn + 7) % 7;
}

/* ── props ────────────────────────────────────────────────────────────────── */

export interface DatePickerLabels {
  /** Accessible name of the popover itself. Default "Calendar". */
  calendar?: string;
  /** Default "Previous month". */
  previousMonth?: string;
  /** Default "Next month". */
  nextMonth?: string;
  /** Default "Previous year". */
  previousYear?: string;
  /** Default "Next year". */
  nextYear?: string;
  /** Footer shortcut. Default "Today". */
  today?: string;
  /** Footer shortcut, only rendered when `clearable` and a value is set. Default "Clear". */
  clear?: string;
}

const DEFAULT_LABELS: Required<DatePickerLabels> = {
  calendar: "Calendar",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  previousYear: "Previous year",
  nextYear: "Next year",
  today: "Today",
  clear: "Clear",
};

export interface DatePickerProps {
  /** ISO "YYYY-MM-DD", or "" for empty. */
  value: string;
  /** Receives an ISO "YYYY-MM-DD", or "" when cleared. */
  onChange: (iso: string) => void;
  /** Trigger text while empty. Default "Select date". */
  placeholder?: string;
  /** Earliest selectable ISO date, inclusive. */
  min?: string;
  /** Latest selectable ISO date, inclusive. */
  max?: string;
  /** BCP-47 tag for month/weekday names. Default "en-US" (see the note above). */
  locale?: string;
  /** 0 = Sunday … 6 = Saturday. Default 1 (Monday). */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Show the footer "Clear" shortcut once a date is picked. Default true. */
  clearable?: boolean;
  /** English strings for every piece of chrome; all optional. */
  labels?: DatePickerLabels;
  id?: string;
  /** Accessible name for the trigger when there is no visible <label>. */
  ariaLabel?: string;
  invalid?: boolean;
  disabled?: boolean;
  /** Appended to the trigger's classes, last. */
  className?: string;
}

/* ── component ────────────────────────────────────────────────────────────── */

export function DatePicker({
  value,
  onChange,
  placeholder,
  min,
  max,
  locale = "en-US",
  weekStartsOn = 1,
  clearable = true,
  labels,
  id,
  ariaLabel,
  invalid,
  disabled,
  className,
}: DatePickerProps) {
  const l = { ...DEFAULT_LABELS, ...labels };
  const titleId = useId();
  const popoverId = useId();
  const gridRef = useRef<HTMLDivElement>(null);
  /** Set just before a state change that should pull DOM focus with it. */
  const pullFocus = useRef(false);

  const [open, setOpen] = useState(false);
  const todayISO = toISO(new Date());

  /**
   * One piece of state runs the calendar: the roving day. The visible month is
   * derived from it, which guarantees the invariant the roving tabindex needs —
   * the focused date is always one of the 42 rendered cells, so exactly one
   * cell is ever tabbable.
   */
  const [focusedISO, setFocusedISO] = useState(() =>
    clampISO(isISO(value) ? value : todayISO, min, max),
  );

  const view = parseISO(focusedISO);
  const viewYear = view.getFullYear();
  const viewMonth = view.getMonth();

  const fmt = useMemo(
    () => ({
      title: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
      trigger: new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }),
      cell: new Intl.DateTimeFormat(locale, { dateStyle: "full" }),
      weekdayShort: new Intl.DateTimeFormat(locale, { weekday: "short" }),
      weekdayLong: new Intl.DateTimeFormat(locale, { weekday: "long" }),
    }),
    [locale],
  );

  // 7 January 2024 was a Sunday, so index 0 of this walk is always Sunday.
  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(2024, 0, 7 + ((weekStartsOn + i) % 7));
        return {
          short: fmt.weekdayShort.format(d).slice(0, 2),
          long: fmt.weekdayLong.format(d),
        };
      }),
    [fmt, weekStartsOn],
  );

  // Deliberately NOT wrapped in useMemo. The React Compiler could not preserve
  // the manual memoization here and skipped compiling the component for it
  // (react-hooks/preserve-manual-memoization) — which costs more than it saves,
  // since this is 42 date strings from three pure helpers. Let the compiler
  // memoize it.
  const first = new Date(viewYear, viewMonth, 1, 12);
  const gridStart = addDays(toISO(first), -weekOffset(first, weekStartsOn));
  const weeks = Array.from({ length: 6 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(gridStart, w * 7 + d)),
  );

  function focusCell(iso: string) {
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)?.focus();
  }

  /** Moves the roving day and takes DOM focus with it. Keyboard paths only. */
  function moveFocus(iso: string) {
    const next = clampISO(iso, min, max);
    if (next === focusedISO) {
      focusCell(next); // clamped against min/max — re-focus rather than strand the flag
      return;
    }
    pullFocus.current = true;
    setFocusedISO(next);
  }

  /** Month/year arrows: repaint the grid but leave focus on the button clicked. */
  function shiftView(months: number) {
    setFocusedISO(clampISO(addMonths(focusedISO, months), min, max));
  }

  useEffect(() => {
    if (!open || !pullFocus.current) return;
    pullFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focusedISO}"]`)?.focus();
  }, [open, focusedISO]);

  function isDisabledDay(iso: string) {
    return (isISO(min) && iso < min) || (isISO(max) && iso > max);
  }

  function select(iso: string) {
    if (isDisabledDay(iso)) return;
    onChange(iso);
    setOpen(false);
  }

  function onGridKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    // Horizontal arrows are direction-relative: in RTL, ← means "next day".
    const rtl =
      typeof window !== "undefined" && gridRef.current
        ? getComputedStyle(gridRef.current).direction === "rtl"
        : false;
    const back = rtl ? 1 : -1;
    let next: string;

    switch (e.key) {
      case "ArrowLeft":
        next = addDays(focusedISO, back);
        break;
      case "ArrowRight":
        next = addDays(focusedISO, -back);
        break;
      case "ArrowUp":
        next = addDays(focusedISO, -7);
        break;
      case "ArrowDown":
        next = addDays(focusedISO, 7);
        break;
      case "PageUp":
        next = addMonths(focusedISO, e.shiftKey ? -12 : -1);
        break;
      case "PageDown":
        next = addMonths(focusedISO, e.shiftKey ? 12 : 1);
        break;
      case "Home":
        next = addDays(focusedISO, -weekOffset(parseISO(focusedISO), weekStartsOn));
        break;
      case "End":
        next = addDays(focusedISO, 6 - weekOffset(parseISO(focusedISO), weekStartsOn));
        break;
      default:
        return; // Enter, Space and Escape are left to the button and to Radix
    }
    e.preventDefault();
    moveFocus(next);
  }

  const hasValue = isISO(value);
  const triggerLabel = hasValue
    ? fmt.trigger.format(parseISO(value))
    : (placeholder ?? "Select date");
  const todaySelectable = !isDisabledDay(todayISO);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        // Every opening starts from the current value again, so a browsing
        // session that was abandoned does not leak into the next one.
        if (next) setFocusedISO(clampISO(isISO(value) ? value : todayISO, min, max));
        setOpen(next);
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-label={ariaLabel}
          // role=combobox rather than the implicit button role: aria-invalid is
          // not supported on a button, and a control that opens a calendar to
          // pick a value is the APG "date picker combobox".
          //
          // Radix sets aria-expanded and aria-controls at runtime, but static
          // analysis cannot see that and role=combobox requires both, so they
          // are written here too. Same values Radix would produce — the popover
          // id is ours, and `open` is the state driving it.
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? popoverId : undefined}
          aria-invalid={invalid || undefined}
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
          <CalendarIcon />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          id={popoverId}
          align="start"
          sideOffset={6}
          aria-label={l.calendar}
          onOpenAutoFocus={(e) => {
            // Radix would focus the first button in the header; the grid is the
            // point of the popover, so focus lands on the roving day instead.
            e.preventDefault();
            focusCell(focusedISO);
          }}
          className="z-50 w-72 rounded-card border border-line bg-card p-3 shadow-2xl"
        >
          <div className="mb-2 flex items-center gap-1">
            <NavButton label={l.previousYear} onClick={() => shiftView(-12)}>
              <ChevronIcon double />
            </NavButton>
            <NavButton label={l.previousMonth} onClick={() => shiftView(-1)}>
              <ChevronIcon />
            </NavButton>
            <span
              id={titleId}
              aria-live="polite"
              className="flex-1 text-center text-ui font-semibold text-ink"
            >
              {fmt.title.format(view)}
            </span>
            <NavButton label={l.nextMonth} onClick={() => shiftView(1)}>
              <ChevronIcon className="rotate-180" />
            </NavButton>
            <NavButton label={l.nextYear} onClick={() => shiftView(12)}>
              <ChevronIcon double className="rotate-180" />
            </NavButton>
          </div>

          <div
            ref={gridRef}
            role="grid"
            aria-labelledby={titleId}
            onKeyDown={onGridKeyDown}
            className="grid grid-cols-7 gap-0.5"
          >
            {/* `contents` keeps the semantic rows out of the layout: the cells
                stay direct children of the 7-column grid. */}
            <div role="row" className="contents">
              {weekdays.map((w) => (
                <span
                  key={w.long}
                  role="columnheader"
                  aria-label={w.long}
                  className="py-1 text-center text-nano font-semibold uppercase tracking-wide text-ink-3"
                >
                  {w.short}
                </span>
              ))}
            </div>

            {weeks.map((week) => (
              <div role="row" className="contents" key={week[0]}>
                {week.map((iso) => {
                  const d = parseISO(iso);
                  const inMonth = d.getMonth() === viewMonth;
                  const isSelected = iso === value;
                  const isToday = iso === todayISO;
                  const dayDisabled = isDisabledDay(iso);
                  return (
                    <button
                      key={iso}
                      type="button"
                      role="gridcell"
                      data-date={iso}
                      // Disabled days stay focusable (aria-disabled, not
                      // disabled) — a native-disabled cell cannot receive
                      // focus, which would dead-end the roving tabindex.
                      aria-disabled={dayDisabled || undefined}
                      aria-selected={isSelected}
                      aria-label={fmt.cell.format(d)}
                      tabIndex={iso === focusedISO ? 0 : -1}
                      onClick={() => select(iso)}
                      className={cn(
                        "inline-flex aspect-square items-center justify-center rounded-full text-body tabular-nums transition-colors",
                        isSelected
                          ? "bg-accent font-semibold text-accent-ink"
                          : inMonth
                            ? "text-ink"
                            : "text-ink-3",
                        dayDisabled
                          ? "cursor-not-allowed opacity-40"
                          : cn("cursor-pointer", !isSelected && "hover:bg-surface"),
                        isToday && !isSelected && "border border-ink",
                      )}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <FooterButton onClick={() => select(todayISO)} disabled={!todaySelectable}>
              {l.today}
            </FooterButton>
            {clearable && hasValue ? (
              <FooterButton
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                {l.clear}
              </FooterButton>
            ) : null}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/* ── local chrome ─────────────────────────────────────────────────────────── */

function NavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-btn text-ink-2 transition-colors hover:bg-surface hover:text-ink"
    >
      {children}
    </button>
  );
}

function FooterButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer rounded-btn px-2 py-1 text-ui text-ink-2 transition-colors hover:bg-surface hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

// Inline SVG rather than the kit's Icon component: these three files stay
// copy-pasteable on their own.
function ChevronIcon({ double, className }: { double?: boolean; className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      focusable="false"
      className={className}
    >
      <path
        d={double ? "M8.5 3.5 4 8l4.5 4.5M13 3.5 8.5 8l4.5 4.5" : "M10.5 3.5 6 8l4.5 4.5"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
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
      <rect
        x="2"
        y="3"
        width="12"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M2 6.5h12M5.5 1.8v2.4M10.5 1.8v2.4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
