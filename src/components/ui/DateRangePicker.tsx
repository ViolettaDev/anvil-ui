"use client";

/**
 * DateRangePicker — one trigger, two month grids, a two-click range.
 *
 * Same hand-written calendar as DatePicker (no calendar library, no date
 * library) with the selection model swapped: the first click anchors the start
 * and drops any previous end, the second click on or after the anchor closes
 * the range; a click before the anchor re-anchors instead of producing an
 * inverted range, so `start <= end` always holds.
 *
 * Two months are drawn by default (`months={1}` for the single grid): a range
 * is far easier to place when the month it ends in is already on screen. Below
 * the `sm` breakpoint the two grids stack instead, so a phone gets a calendar
 * at full size rather than two squeezed ones. The one thing here that must not
 * be "simplified" away is that a second grid drops the adjacent-month days —
 * the long version of why sits on the branch that does it.
 *
 * The preview is the part that makes two-click ranges legible: while the range
 * is half-open, the days between the anchor and the day under the pointer are
 * tinted. That preview also follows the KEYBOARD — the roving day drives it
 * whenever focus is inside the grid — because a hover-only affordance tells a
 * keyboard user nothing. The source this was lifted from had no preview at all.
 *
 * Date shape: `startValue`, `endValue`, `min`, `max` and both arguments of
 * `onChange` are ISO CALENDAR DATE strings, "YYYY-MM-DD", never Date objects
 * and never UTC date-times. "" means unset; a half-open range is
 * `("2026-03-04", "")`. The strings sort chronologically, hence the plain `<`
 * and `>` comparisons throughout. Parsing anchors at 12:00 local so a DST
 * change at midnight cannot roll a day over.
 *
 * `locale` (BCP-47, default "en-US") feeds Intl.DateTimeFormat for month and
 * weekday names; every other string is a prop with an English default. The
 * default is a fixed tag rather than the runtime's, which would resolve
 * differently on the server and in the browser and break hydration.
 *
 * Keyboard: ← → ±1 day (mirrored in RTL), ↑ ↓ ±1 week, PageUp/PageDown ±1
 * month (Shift for ±1 year), Home/End ends of the focused week, Enter/Space to
 * place the anchor and then the end, Escape to close. The days run straight
 * across the seam between the two grids, and the pair of months slides by one
 * the moment the roving day steps outside it.
 *
 * Usage:
 *   <DateRangePicker startValue={from} endValue={to} onChange={setRange} />
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
function weekOffset(d: Date, weekStartsOn: number) {
  return (d.getDay() - weekStartsOn + 7) % 7;
}
/** First day of the month `iso` falls in — the anchor a rendered grid is built from. */
function monthStartISO(iso: string) {
  const d = parseISO(iso);
  return toISO(new Date(d.getFullYear(), d.getMonth(), 1, 12));
}
/** Whole months from `a`'s month to `b`'s month, signed. The days are ignored. */
function monthSpan(a: string, b: string) {
  const x = parseISO(a);
  const y = parseISO(b);
  return (y.getFullYear() - x.getFullYear()) * 12 + (y.getMonth() - x.getMonth());
}

/* ── props ────────────────────────────────────────────────────────────────── */

export interface DateRangePickerLabels {
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
  /** Footer shortcut, only rendered when `clearable` and something is set. Default "Clear". */
  clear?: string;
  /**
   * Separator drawn between the two dates on the trigger, and between the two
   * month names in the calendar's title. Default "–" (en dash).
   */
  rangeSeparator?: string;
}

const DEFAULT_LABELS: Required<DateRangePickerLabels> = {
  calendar: "Calendar",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  previousYear: "Previous year",
  nextYear: "Next year",
  clear: "Clear",
  rangeSeparator: "–",
};

export interface DateRangePickerProps {
  /** ISO "YYYY-MM-DD", or "" for empty. */
  startValue: string;
  /** ISO "YYYY-MM-DD", or "" while the range is half-open. */
  endValue: string;
  /** Both arguments are ISO "YYYY-MM-DD"; `("", "")` when cleared. */
  onChange: (startISO: string, endISO: string) => void;
  /** Trigger text while empty. Default "Select dates". */
  placeholder?: string;
  /** Earliest selectable ISO date, inclusive. */
  min?: string;
  /** Latest selectable ISO date, inclusive. */
  max?: string;
  /** BCP-47 tag for month/weekday names. Default "en-US". */
  locale?: string;
  /**
   * How many month grids to draw: the view month and, at 2, the one after it.
   * Default 2 — most ranges are picked across a month boundary. The two grids
   * sit side by side from the `sm` breakpoint up and stack below it, so the
   * popover is one column wide on a phone either way. Pass 1 for the compact
   * single-month calendar.
   */
  months?: 1 | 2;
  /** 0 = Sunday … 6 = Saturday. Default 1 (Monday). */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Show the footer "Clear" shortcut once something is picked. Default true. */
  clearable?: boolean;
  /** English strings for every piece of chrome; all optional. */
  labels?: DateRangePickerLabels;
  id?: string;
  /** Accessible name for the trigger when there is no visible <label>. */
  ariaLabel?: string;
  invalid?: boolean;
  disabled?: boolean;
  /** Appended to the trigger's classes, last. */
  className?: string;
}

/* ── component ────────────────────────────────────────────────────────────── */

export function DateRangePicker({
  startValue,
  endValue,
  onChange,
  placeholder,
  min,
  max,
  locale = "en-US",
  months = 2,
  weekStartsOn = 1,
  clearable = true,
  labels,
  id,
  ariaLabel,
  invalid,
  disabled,
  className,
}: DateRangePickerProps) {
  const l = { ...DEFAULT_LABELS, ...labels };
  const titleId = useId();
  const popoverId = useId();
  const captionId = useId();
  const gridRef = useRef<HTMLDivElement>(null);
  const pullFocus = useRef(false);

  const [open, setOpen] = useState(false);
  const [hoverISO, setHoverISO] = useState("");
  const [gridFocused, setGridFocused] = useState(false);
  const todayISO = toISO(new Date());
  const twoMonths = months === 2;

  /** Where the calendar lands on mount and again on every re-open. */
  function openingISO() {
    return clampISO(isISO(startValue) ? startValue : todayISO, min, max);
  }

  // As in DatePicker the roving day is the state that matters; what changes
  // here is that the window of months around it is a second piece of state,
  // because with two grids the arrows have to move the view past a day that is
  // already on screen. See paneStartISO for how the two are kept coherent.
  const [focusedISO, setFocusedISO] = useState(openingISO);
  const [viewISO, setViewISO] = useState(() => monthStartISO(openingISO()));

  /**
   * The leading month actually drawn. `viewISO` is only what the arrows asked
   * for: this slides the window until it contains the roving day. Deriving it
   * instead of trusting the state is what keeps DatePicker's invariant alive
   * with two grids — the focused date is always one of the rendered cells, so
   * exactly one cell in the whole popover carries tabIndex 0.
   */
  const paneStartISO = useMemo(() => {
    const offset = monthSpan(viewISO, focusedISO);
    if (offset < 0) return monthStartISO(focusedISO);
    if (offset > months - 1) return addMonths(monthStartISO(focusedISO), 1 - months);
    return viewISO;
  }, [viewISO, focusedISO, months]);

  const fmt = useMemo(
    () => ({
      title: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
      month: new Intl.DateTimeFormat(locale, { month: "long" }),
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

  const panes = useMemo(
    () =>
      Array.from({ length: months }, (_, i) => {
        const monthISO = addMonths(paneStartISO, i);
        const first = parseISO(monthISO);
        const gridStart = addDays(monthISO, -weekOffset(first, weekStartsOn));
        return {
          monthISO,
          month: first.getMonth(),
          title: fmt.title.format(first),
          // Six rows even when five would do, and the same six for both panes:
          // the popover must not change height as the months go by, and two
          // grids of different heights would not line up.
          weeks: Array.from({ length: 6 }, (_, w) =>
            Array.from({ length: 7 }, (_, d) => addDays(gridStart, w * 7 + d)),
          ),
        };
      }),
    [paneStartISO, months, weekStartsOn, fmt],
  );

  // Exactly one live region for the popover, announcing the months on screen
  // as a range. The per-grid captions below are static on purpose: two live
  // captions would both fire on every arrow press and bury the day being read.
  const firstMonth = parseISO(panes[0].monthISO);
  const lastMonth = parseISO(panes[panes.length - 1].monthISO);
  const sameYear = firstMonth.getFullYear() === lastMonth.getFullYear();
  const viewTitle = twoMonths
    ? `${sameYear ? fmt.month.format(firstMonth) : fmt.title.format(firstMonth)} ${l.rangeSeparator} ${fmt.title.format(lastMonth)}`
    : fmt.title.format(firstMonth);

  function focusCell(iso: string) {
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)?.focus();
  }

  function moveFocus(iso: string) {
    const next = clampISO(iso, min, max);
    if (next === focusedISO) {
      focusCell(next);
      return;
    }
    pullFocus.current = true;
    setFocusedISO(next);
  }

  /**
   * Month/year arrows. They step from the month currently drawn (paneStartISO,
   * not the `viewISO` it may have overruled) and drag the roving day the same
   * distance, so the single tab stop is never left behind in a month that is no
   * longer rendered. min/max still bound the day, and paneStartISO then pulls
   * the window back onto it — which is what keeps the arrows from paging past
   * the selectable range and stranding the selection off screen.
   */
  function shiftView(delta: number) {
    setViewISO(addMonths(paneStartISO, delta));
    setFocusedISO(clampISO(addMonths(focusedISO, delta), min, max));
  }

  useEffect(() => {
    if (!open || !pullFocus.current) return;
    pullFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focusedISO}"]`)?.focus();
  }, [open, focusedISO]);

  function isDisabledDay(iso: string) {
    return (isISO(min) && iso < min) || (isISO(max) && iso > max);
  }

  /** The two-click model. Only closing the range dismisses the popover. */
  function select(iso: string) {
    if (isDisabledDay(iso)) return;
    const halfOpen = isISO(startValue) && !isISO(endValue);
    if (!halfOpen || iso < startValue) {
      onChange(iso, ""); // fresh anchor: nothing picked yet, a complete range, or a click before the anchor
      return;
    }
    onChange(startValue, iso);
    setOpen(false);
  }

  function onGridKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
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
        return;
    }
    e.preventDefault();
    setHoverISO(""); // the keyboard takes the preview back from the pointer
    moveFocus(next);
  }

  // Preview end: the pointer wins while it is over the grid, otherwise the
  // roving day does, and only while the range is half-open.
  const halfOpen = isISO(startValue) && !isISO(endValue);
  const previewISO = halfOpen ? hoverISO || (gridFocused ? focusedISO : "") : "";
  const rangeEnd = isISO(endValue)
    ? endValue
    : previewISO > startValue
      ? previewISO
      : "";

  const hasValue = isISO(startValue) || isISO(endValue);
  const triggerLabel = isISO(startValue)
    ? isISO(endValue)
      ? `${fmt.trigger.format(parseISO(startValue))} ${l.rangeSeparator} ${fmt.trigger.format(parseISO(endValue))}`
      : `${fmt.trigger.format(parseISO(startValue))} ${l.rangeSeparator}`
    : (placeholder ?? "Select dates");

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (next) {
          const opening = openingISO();
          setFocusedISO(opening);
          setViewISO(monthStartISO(opening));
          setHoverISO("");
        }
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

          // are written here too.

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
            e.preventDefault();
            focusCell(focusedISO);
          }}
          className={cn(
            "z-50 w-72 rounded-card border border-line bg-card p-3 shadow-2xl",
            // One column wide until there is room for a second grid beside the
            // first; from `sm` up the popover shrink-wraps the two panes.
            twoMonths && "sm:w-auto",
          )}
        >
          <div className="mb-2 flex items-center gap-1">
            <NavButton label={l.previousYear} onClick={() => shiftView(-12)}>
              <ChevronIcon double />
            </NavButton>
            <NavButton label={l.previousMonth} onClick={() => shiftView(-1)}>
              <ChevronIcon />
            </NavButton>
            <span className="flex-1 text-center text-ui font-semibold text-ink">
              {/* With two grids their names are already drawn as captions, so
                  the range title is announced without being shown twice. */}
              <span
                id={titleId}
                aria-live="polite"
                className={twoMonths ? "sr-only" : undefined}
              >
                {viewTitle}
              </span>
            </span>
            <NavButton label={l.nextMonth} onClick={() => shiftView(1)}>
              <ChevronIcon className="rotate-180" />
            </NavButton>
            <NavButton label={l.nextYear} onClick={() => shiftView(12)}>
              <ChevronIcon double className="rotate-180" />
            </NavButton>
          </div>

          {/* Deliberately not role="grid": it carries the roving focus and the
              key handler for every month at once, and a grid inside a grid is
              not a thing. The months are the grids; this is the group. */}
          <div
            ref={gridRef}
            role="group"
            onKeyDown={onGridKeyDown}
            onMouseLeave={() => setHoverISO("")}
            onFocus={() => setGridFocused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setGridFocused(false);
            }}
            className={cn("flex flex-col gap-3", twoMonths && "sm:flex-row sm:gap-4")}
          >
            {panes.map((pane, i) => (
              <div key={pane.monthISO} className={cn("w-full", twoMonths && "sm:w-64")}>
                {twoMonths ? (
                  <div
                    id={`${captionId}-${i}`}
                    className="mb-1 text-center text-ui font-semibold text-ink"
                  >
                    {pane.title}
                  </div>
                ) : null}

                <div
                  role="grid"
                  aria-labelledby={twoMonths ? `${captionId}-${i}` : titleId}
                  aria-multiselectable
                  className="grid grid-cols-7 gap-0.5"
                >
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

                  {pane.weeks.map((week) => (
                    <div role="row" className="contents" key={week[0]}>
                      {week.map((iso) => {
                        const d = parseISO(iso);
                        const inMonth = d.getMonth() === pane.month;

                        // Each grid draws six full weeks, so January's trailing
                        // cells and February's leading cells are the SAME days.
                        // Draw both and `data-date` exists twice in the DOM —
                        // and focusCell takes the first match, which would park
                        // the roving tab stop in the wrong grid and set the
                        // arrow keys jumping between the two. So with a second
                        // grid on screen the adjacent-month days become inert
                        // blanks: no button, no `data-date`, nothing to match
                        // twice, and the six-row geometry still holds. With a
                        // single grid there is nothing to collide with, so they
                        // stay visible and clickable exactly as before. Do not
                        // "tidy" the two branches into one.
                        if (twoMonths && !inMonth) {
                          return <span key={iso} role="gridcell" className="aspect-square" />;
                        }

                        const isStart = iso === startValue;
                        const isEnd = isISO(endValue) && iso === endValue;
                        const isEndpoint = isStart || isEnd;
                        const inRange =
                          isISO(startValue) && !!rangeEnd && iso > startValue && iso < rangeEnd;
                        const isPreviewEnd = !!previewISO && iso === rangeEnd && !isISO(endValue);
                        const isToday = iso === todayISO;
                        const dayDisabled = isDisabledDay(iso);
                        return (
                          <button
                            key={iso}
                            type="button"
                            role="gridcell"
                            data-date={iso}
                            // aria-disabled, not disabled: a natively disabled cell
                            // cannot take focus and would dead-end the roving grid.
                            aria-disabled={dayDisabled || undefined}
                            aria-selected={isEndpoint || inRange}
                            aria-label={fmt.cell.format(d)}
                            tabIndex={iso === focusedISO ? 0 : -1}
                            onClick={() => select(iso)}
                            onMouseEnter={() => !dayDisabled && setHoverISO(iso)}
                            className={cn(
                              "inline-flex aspect-square items-center justify-center text-body tabular-nums transition-colors",
                              // Endpoints are accent discs, the days strictly between
                              // them are a square tint so the run reads as one band.
                              inRange && !isEndpoint ? "rounded-none" : "rounded-full",
                              isEndpoint
                                ? "bg-accent font-semibold text-accent-ink"
                                : inMonth
                                  ? "text-ink"
                                  : "text-ink-3",
                              !isEndpoint && (inRange || isPreviewEnd) && "bg-accent-tint",
                              dayDisabled
                                ? "cursor-not-allowed opacity-40"
                                : cn(
                                    "cursor-pointer",
                                    !isEndpoint && !inRange && !isPreviewEnd && "hover:bg-surface",
                                  ),
                              isToday && !isEndpoint && "border border-ink",
                            )}
                          >
                            {d.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {clearable && hasValue ? (
            <div className="mt-2 flex justify-end">
              {/* Clearing leaves the popover open: the reason to clear a range
                  is almost always to pick a different one straight away. */}
              <button
                type="button"
                onClick={() => {
                  onChange("", "");
                  setHoverISO("");
                }}
                className="cursor-pointer rounded-btn px-2 py-1 text-ui text-ink-2 transition-colors hover:bg-surface hover:text-ink"
              >
                {l.clear}
              </button>
            </div>
          ) : null}
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
