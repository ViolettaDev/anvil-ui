"use client";

/**
 * The three pickers, running for real. These are the reason the kit exists, so
 * they lead the page and they get the most room.
 *
 * Every value below is a plain string — "YYYY-MM-DD" for dates, 24-hour
 * "HH:MM" for times, "" for empty. No Date objects cross the boundary, which
 * is what lets the range comparisons be `<` and `>` and what keeps a timezone
 * out of a calendar date.
 */

import { useState, useSyncExternalStore } from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { TimePicker } from "@/components/ui/TimePicker";
import { Demo, DemoField, Readout } from "@/components/site/Demo";

/**
 * Today, as an ISO calendar date — read only in the browser.
 *
 * `new Date()` during render is the same trap as `localStorage`: the server is
 * in one timezone and at one instant, the browser is in another, and near
 * midnight the two disagree about what day it is. So the server snapshot is ""
 * — which every picker here reads as "no minimum" — and React swaps in the
 * real date once hydration is done.
 */
const NEVER_CHANGES = () => () => {};
const NO_DATE = () => "";

function todayISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function useToday() {
  return useSyncExternalStore(NEVER_CHANGES, todayISO, NO_DATE);
}

/* ── DatePicker ───────────────────────────────────────────────────────────── */

const DATE_CODE = `
import { DatePicker } from "@/components/ui/DatePicker";

// "" or an ISO calendar date, "YYYY-MM-DD". Never a Date.
const [date, setDate] = useState("");

<DatePicker
  id="appointment"
  value={date}
  onChange={setDate}
  min="2026-01-01"
/>
`;

export function DatePickerDemo() {
  const [date, setDate] = useState("");
  const today = useToday();

  return (
    <Demo
      id="date-picker"
      name="DatePicker"
      meta="Radix Popover"
      summary="A month grid drawn by hand: 42 cells, a roving tabindex, and month arithmetic that is about forty lines of string helpers. Open it and arrow around — every key in the ARIA grid pattern is wired."
      code={DATE_CODE}
    >
      <DemoField
        label="Appointment date"
        htmlFor="demo-date"
        className="max-w-72"
        hint="Past dates are blocked with min. Try PageDown, then Shift+PageDown."
      >
        <DatePicker id="demo-date" value={date} onChange={setDate} min={today} />
      </DemoField>

      <div className="mt-5 grid max-w-md gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-nano font-semibold tracking-wider text-ink-3 uppercase">
            invalid
          </p>
          <DatePicker
            value={date}
            onChange={setDate}
            invalid
            ariaLabel="Appointment date, invalid state"
          />
        </div>
        <div>
          <p className="mb-1.5 text-nano font-semibold tracking-wider text-ink-3 uppercase">
            disabled
          </p>
          <DatePicker
            value={date}
            onChange={setDate}
            disabled
            ariaLabel="Appointment date, disabled state"
          />
        </div>
      </div>

      <Readout>{JSON.stringify(date)}</Readout>
    </Demo>
  );
}

/* ── DateRangePicker ──────────────────────────────────────────────────────── */

const RANGE_CODE = `
import { DateRangePicker } from "@/components/ui/DateRangePicker";

const [range, setRange] = useState({ from: "", to: "" });

// Two month grids by default — a range is far easier
// to place when the month it ends in is already on
// screen. They stack below the sm breakpoint.
<DateRangePicker
  startValue={range.from}
  endValue={range.to}
  onChange={(from, to) => setRange({ from, to })}
  ariaLabel="Stay"
/>

// One grid, for a sidebar or a narrow filter bar.
<DateRangePicker months={1} … />
`;

export function DateRangePickerDemo() {
  const [range, setRange] = useState({ from: "", to: "" });
  const today = useToday();

  const nights =
    range.from && range.to
      ? Math.round(
          (Date.parse(`${range.to}T12:00:00`) - Date.parse(`${range.from}T12:00:00`)) / 86_400_000,
        )
      : null;

  return (
    <Demo
      id="date-range-picker"
      name="DateRangePicker"
      meta="Radix Popover"
      summary="Two clicks: the first anchors the start, the second closes the range. While it is half-open the days under the pointer are previewed — and so are the days under the keyboard, because a hover-only affordance tells a keyboard user nothing. Two month grids by default, months={1} for the compact one."
      code={RANGE_CODE}
    >
      <div className="grid max-w-md gap-4 sm:grid-cols-2">
        <DemoField
          label="Stay (months=2, the default)"
          htmlFor="demo-range"
          hint="Pick a start, then move around before committing to the end."
        >
          <DateRangePicker
            id="demo-range"
            startValue={range.from}
            endValue={range.to}
            onChange={(from, to) => setRange({ from, to })}
            min={today}
          />
        </DemoField>

        <DemoField
          label="Stay (months=1)"
          htmlFor="demo-range-single"
          hint="One grid, same range, same state — for a sidebar or a filter bar."
        >
          <DateRangePicker
            id="demo-range-single"
            startValue={range.from}
            endValue={range.to}
            onChange={(from, to) => setRange({ from, to })}
            min={today}
            months={1}
          />
        </DemoField>
      </div>

      <Readout label="start / end">
        {JSON.stringify(range.from)} / {JSON.stringify(range.to)}
        {nights !== null ? (
          <span className="text-ink-3">
            {" "}
            — {nights} night{nights === 1 ? "" : "s"}
          </span>
        ) : null}
      </Readout>
    </Demo>
  );
}

/* ── TimePicker ───────────────────────────────────────────────────────────── */

const TIME_CODE = `
import { TimePicker } from "@/components/ui/TimePicker";

// Always 24-hour "HH:MM", whatever the display clock says.
const [time, setTime] = useState("");

<TimePicker
  value={time}
  onChange={setTime}
  fromMin={9 * 60}   // 09:00
  toMin={18 * 60}    // 18:00
  stepMin={15}
/>
`;

export function TimePickerDemo() {
  const [time, setTime] = useState("");

  return (
    <Demo
      id="time-picker"
      name="TimePicker"
      meta="No dependencies"
      summary="Not even Radix. A button with role=combobox and a listbox of generated slots, pointed at by aria-activedescendant so focus never leaves the trigger. Type 14 with it open and it jumps."
      code={TIME_CODE}
    >
      <div className="grid max-w-md gap-4 sm:grid-cols-2">
        <DemoField label="Start (12-hour)" htmlFor="demo-time-12">
          <TimePicker
            id="demo-time-12"
            value={time}
            onChange={setTime}
            fromMin={9 * 60}
            toMin={18 * 60}
            stepMin={15}
          />
        </DemoField>
        <DemoField label="Start (24-hour)" htmlFor="demo-time-24">
          <TimePicker
            id="demo-time-24"
            value={time}
            onChange={setTime}
            fromMin={9 * 60}
            toMin={18 * 60}
            stepMin={15}
            hour12={false}
          />
        </DemoField>
      </div>

      <p className="mt-3 max-w-prose text-nano text-ink-3">
        Both fields hold the same state. The clock is presentation — the value never is.
      </p>

      <Readout>{JSON.stringify(time)}</Readout>
    </Demo>
  );
}
