/**
 * The showcase.
 *
 * A server component holding the document outline — landmarks, headings and
 * prose — with each demo card imported from `src/components/site` as its own
 * client island. That split is the point: the page ships interactivity only
 * where something is actually interactive, and everything you see below is the
 * real component running, never a screenshot of one.
 *
 * Nothing here is styled with a colour that is not a kit token, and there is
 * not a single `dark:` variant on the page — the theme flips because the
 * variables flip.
 */

import { Toaster } from "@/components/ui/Toaster";
import { DemoGetKit } from "@/components/site/DemoGetKit";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import {
  DatePickerDemo,
  DateRangePickerDemo,
  TimePickerDemo,
} from "@/components/site/PickerDemos";
import {
  ComboboxDemo,
  DropdownMenuDemo,
  SelectDemo,
} from "@/components/site/SelectionDemos";
import {
  ConfirmDialogDemo,
  DialogDemo,
  TooltipDemo,
} from "@/components/site/OverlayDemos";
import { ButtonDemo, LinkDemo } from "@/components/site/ActionDemos";
import {
  CheckboxDemo,
  FieldDemo,
  IconDemo,
  InputDemo,
  RadioDemo,
  TextareaDemo,
  ToastDemo,
} from "@/components/site/FormDemos";
import { RevealDemo, StaggerDemo } from "@/components/site/MotionDemos";
import { kbd } from "@/components/site/styles";

/* ── page data ────────────────────────────────────────────────────────────── */

const SECTIONS = [
  { id: "dates", label: "Dates" },
  { id: "selection", label: "Selection" },
  { id: "actions", label: "Actions" },
  { id: "overlays", label: "Overlays" },
  { id: "forms", label: "Forms" },
  { id: "motion", label: "Motion" },
];

/**
 * Every demo on the page, in the order it appears. This is the whole index at
 * the top — add a demo without adding a row here and it becomes unreachable for
 * anyone who does not scroll the entire page, which is how five components once
 * shipped without ever being seen.
 */
const INDEX = [
  { id: "date-picker", name: "DatePicker" },
  { id: "date-range-picker", name: "DateRangePicker" },
  { id: "time-picker", name: "TimePicker" },
  { id: "select", name: "Select" },
  { id: "combobox", name: "Combobox" },
  { id: "dropdown-menu", name: "DropdownMenu" },
  { id: "button", name: "Button" },
  { id: "link", name: "Link" },
  { id: "dialog", name: "Dialog" },
  { id: "confirm-dialog", name: "ConfirmDialog" },
  { id: "tooltip", name: "Tooltip" },
  { id: "input", name: "Input" },
  { id: "textarea", name: "Textarea" },
  { id: "checkbox", name: "Checkbox" },
  { id: "radio-group", name: "RadioGroup" },
  { id: "field", name: "Field" },
  { id: "toaster", name: "Toaster" },
  { id: "icon", name: "Icon" },
  { id: "reveal", name: "Reveal" },
  { id: "stagger", name: "Stagger" },
];

const TOKENS = [
  { name: "ink", className: "bg-ink" },
  { name: "ink-2", className: "bg-ink-2" },
  { name: "ink-3", className: "bg-ink-3" },
  { name: "surface", className: "bg-surface" },
  { name: "card", className: "bg-card" },
  { name: "line", className: "bg-line" },
  { name: "accent", className: "bg-accent" },
  { name: "accent-tint", className: "bg-accent-tint" },
  { name: "danger", className: "bg-danger" },
];

const CALENDAR_KEYS = [
  { keys: ["←", "→"], does: "±1 day, mirrored automatically when the grid renders RTL" },
  { keys: ["↑", "↓"], does: "±1 week" },
  { keys: ["PageUp", "PageDown"], does: "±1 month" },
  { keys: ["Shift", "PageUp"], does: "±1 year" },
  { keys: ["Home", "End"], does: "first and last day of the focused week" },
  { keys: ["Enter", "Space"], does: "select — native button activation, not re-implemented" },
  { keys: ["Esc"], does: "close, with focus restored to the trigger" },
];

const INSTALL = `# run this page locally
pnpm install
pnpm dev          # http://localhost:3200

# or take one component into your own app
cp src/components/ui/DatePicker.tsx  ../your-app/src/components/ui/`;

/* ── page ─────────────────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <>
      {/* Revealed on :focus-visible only — a plain :focus flashes the pill
          during ordinary clicks and route changes. */}
      <a
        href="#main"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:start-4 focus-visible:top-4 focus-visible:z-overlay focus-visible:rounded-btn focus-visible:border focus-visible:border-line focus-visible:bg-card focus-visible:px-4 focus-visible:py-2 focus-visible:text-ui focus-visible:font-medium focus-visible:text-ink"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
          <a href="#top" className="text-ui font-semibold tracking-tight text-ink">
            Anvil UI
          </a>
          <nav aria-label="Sections" className="order-3 w-full sm:order-none sm:w-auto">
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-ui text-ink-2 transition-colors hover:text-ink"
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ms-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-5 pb-24 focus:outline-none">
        {/* ── intro ───────────────────────────────────────────────────── */}
        <section id="top" aria-labelledby="intro-heading" className="scroll-mt-24 py-14 sm:py-20">
          <p className="text-nano font-semibold tracking-wider text-accent uppercase">
            MIT · Next.js 16 · React 19 · Tailwind v4
          </p>
          <h1
            id="intro-heading"
            className="mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl"
          >
            Accessible React primitives, styled from CSS variables.
          </h1>
          <p className="mt-5 max-w-2xl text-lead leading-relaxed text-ink-2">
            The part you probably came for: <strong className="text-ink">date, range and time
            pickers written by hand</strong>, with no calendar library underneath. No
            react-day-picker, no date-fns, no dayjs. Radix supplies popover positioning and focus
            management; the calendar grid, the keyboard model and the range logic are plain React
            you can read in one sitting.
          </p>

          <DemoGetKit />

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="rounded-card border border-line bg-card p-5">
              <h2 className="text-ui font-semibold tracking-wider text-ink-3 uppercase">
                Install
              </h2>
              <pre className="mt-3 overflow-x-auto text-ui leading-relaxed text-ink-2">
                <code className="font-mono">{INSTALL}</code>
              </pre>
              <p className="mt-4 border-t border-line pt-4 text-body leading-relaxed text-ink-2">
                There is no npm package, and that is deliberate. Copy the files you want — every
                component imports nothing but React, one Radix package and a four-line{" "}
                <code className="font-mono text-ui text-ink">cn()</code>. Only the overlays, the
                pickers and Select reach for Radix at all: the form controls, Button, Link, Icon and
                both motion helpers have no dependency whatsoever.
              </p>
            </div>

            <div className="rounded-card border border-line bg-card p-5">
              <h2 className="text-ui font-semibold tracking-wider text-ink-3 uppercase">
                Theming
              </h2>
              <p className="mt-3 text-body leading-relaxed text-ink-2">
                Every component reads these tokens and hard-codes no colour. Rebind the variables
                and the whole kit follows — including this page, which has no{" "}
                <code className="font-mono text-ui text-ink">dark:</code> variant anywhere on it.
                Use the switch above.
              </p>
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                {TOKENS.map((token) => (
                  <li key={token.name} className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={`size-4 shrink-0 rounded-btn border border-line ${token.className}`}
                    />
                    <code className="font-mono text-nano text-ink-2">{token.name}</code>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <nav aria-label="Components" className="mt-10">
            {/* Counted from the list rather than written out, so the heading
                cannot quietly go stale the next time one is added. */}
            <h2 className="text-ui font-semibold tracking-wider text-ink-3 uppercase">
              {INDEX.length} components
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {INDEX.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="inline-block rounded-btn border border-line bg-card px-3 py-1.5 font-mono text-ui text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </section>

        {/* ── dates ───────────────────────────────────────────────────── */}
        <section id="dates" aria-labelledby="dates-heading" className="scroll-mt-20 py-10">
          <h2 id="dates-heading" className="text-3xl font-semibold tracking-tight text-ink">
            Dates and time
          </h2>
          <p className="mt-3 max-w-2xl text-body leading-relaxed text-ink-2">
            Three fields, one shape of data: ISO calendar strings in, ISO calendar strings out.
            Never a Date object, never UTC, never a timezone silently applied to something that is
            just a day on a wall calendar. Parsing anchors at midday local, so a DST jump at
            midnight cannot roll a day over.
          </p>

          <div className="mt-8 grid gap-6">
            <DatePickerDemo />
            <DateRangePickerDemo />
            <TimePickerDemo />

            <div className="rounded-card border border-line bg-card p-5">
              <h3 className="text-lead font-semibold tracking-tight text-ink">
                The calendar keyboard model
              </h3>
              <p className="mt-1.5 max-w-prose text-body leading-relaxed text-ink-2">
                Both calendars are ARIA grids with a roving tabindex: exactly one cell is ever
                tabbable, and the visible month is derived from the focused day so the two can
                never disagree. Open a picker above and try these.
              </p>
              <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {CALENDAR_KEYS.map((row) => (
                  <div key={row.does} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <dt className="flex shrink-0 gap-1">
                      {row.keys.map((key) => (
                        <kbd key={key} className={kbd}>
                          {key}
                        </kbd>
                      ))}
                    </dt>
                    <dd className="min-w-0 flex-1 text-ui text-ink-2">{row.does}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 border-t border-line pt-4 text-nano text-ink-3">
                Days outside the allowed range use aria-disabled rather than the disabled
                attribute: a natively disabled cell cannot take focus, which dead-ends a roving
                grid.
              </p>
            </div>
          </div>
        </section>

        {/* ── selection ───────────────────────────────────────────────── */}
        <section id="selection" aria-labelledby="selection-heading" className="scroll-mt-20 py-10">
          <h2 id="selection-heading" className="text-3xl font-semibold tracking-tight text-ink">
            Selection
          </h2>
          <p className="mt-3 max-w-2xl text-body leading-relaxed text-ink-2">
            Three components that all look like “a list appears”, and are not interchangeable. A
            Select holds a value. A Combobox holds text that a list happens to filter. A menu holds
            actions and holds no value at all — assistive tech announces the difference, so getting
            it wrong is not only a matter of taste.
          </p>

          <div className="mt-8 grid gap-6">
            <SelectDemo />
            <ComboboxDemo />
            <DropdownMenuDemo />
          </div>
        </section>

        {/* ── actions ─────────────────────────────────────────────────── */}
        <section id="actions" aria-labelledby="actions-heading" className="scroll-mt-20 py-10">
          <h2 id="actions-heading" className="text-3xl font-semibold tracking-tight text-ink">
            Actions
          </h2>
          <p className="mt-3 max-w-2xl text-body leading-relaxed text-ink-2">
            A button DOES something; a link GOES somewhere. Space activates one and Enter the
            other, only one of them can be middle-clicked into a new tab, and assistive tech
            announces them differently — so the kit ships a real{" "}
            <code className="font-mono text-ui text-ink">&lt;button&gt;</code>, an anchor wearing
            the same clothes, and an inline link for prose, rather than one component with a prop
            that decides which it secretly is.
          </p>

          <div className="mt-8 grid gap-6">
            <ButtonDemo />
            <LinkDemo />
          </div>
        </section>

        {/* ── overlays ────────────────────────────────────────────────── */}
        <section id="overlays" aria-labelledby="overlays-heading" className="scroll-mt-20 py-10">
          <h2 id="overlays-heading" className="text-3xl font-semibold tracking-tight text-ink">
            Overlays
          </h2>
          <p className="mt-3 max-w-2xl text-body leading-relaxed text-ink-2">
            Everything that portals to the end of the document, all sharing one z-index on purpose:
            portals mount in the order they open, so the last thing opened paints on top by DOM
            order — which is exactly what you want when a select opens inside a modal.
          </p>

          <div className="mt-8 grid gap-6">
            <DialogDemo />
            <ConfirmDialogDemo />
            <TooltipDemo />
          </div>
        </section>

        {/* ── forms and feedback ──────────────────────────────────────── */}
        <section id="forms" aria-labelledby="forms-heading" className="scroll-mt-20 py-10">
          <h2 id="forms-heading" className="text-3xl font-semibold tracking-tight text-ink">
            Form controls and feedback
          </h2>
          <p className="mt-3 max-w-2xl text-body leading-relaxed text-ink-2">
            Text fields, a checkbox and a radio group that are all still real native controls
            underneath, sharing one piece of label / description / error wiring —{" "}
            <code className="font-mono text-ui text-ink">Field</code>, which is also the thing to
            reach for when a control renders its own trigger. Then toasts that follow the theme
            without being told about it, and an icon set short enough to read in full.
          </p>

          <div className="mt-8 grid gap-6">
            <InputDemo />
            <TextareaDemo />
            <CheckboxDemo />
            <RadioDemo />
            <FieldDemo />
            <ToastDemo />
            <IconDemo />
          </div>
        </section>

        {/* ── motion ──────────────────────────────────────────────────── */}
        <section id="motion" aria-labelledby="motion-heading" className="scroll-mt-20 py-10">
          <h2 id="motion-heading" className="text-3xl font-semibold tracking-tight text-ink">
            Motion
          </h2>
          <p className="mt-3 max-w-2xl text-body leading-relaxed text-ink-2">
            Scroll reveals that survive server rendering. Both components paint their hidden state
            on the first render — identical on the server and in the browser — and only reveal from
            an observer created in an effect. Deriving that first render from{" "}
            <code className="font-mono text-ui text-ink">matchMedia</code> instead is the mismatch
            that type-checks, lints, passes its tests, and then breaks in a browser.
          </p>

          <div className="mt-8 grid gap-6">
            <RevealDemo />
            <StaggerDemo />
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-x-8 gap-y-2 px-5 py-8 text-ui text-ink-3">
          <p>
            MIT licensed. Use it in commercial work, no attribution required — and delete whatever
            you do not need.
          </p>
          <p>
            Built by{" "}
            <a
              href="https://violettadev.com"
              className="text-ink-2 underline underline-offset-4 transition-colors hover:text-ink"
            >
              Violetta Studio
            </a>
            .
          </p>
        </div>
      </footer>

      {/* Mounted once. Every demo above fires toasts through it. */}
      <Toaster />
    </>
  );
}
