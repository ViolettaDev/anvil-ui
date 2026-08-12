"use client";

/**
 * The form controls, plus toasts and the icon registry.
 *
 * Input, Textarea and RadioGroup all sit on `Field` — same label, description
 * and error wiring, written once — so the demos here are mostly about what each
 * one adds on top: slots inside the box, auto-growth with a ceiling, a native
 * radio group's roving focus. `Field` itself is demoed last, wrapping the one
 * kind of control that cannot label itself.
 *
 * The Toaster is mounted once in page.tsx; everything here just fires `toast()`
 * from sonner, which is exactly how it works in an app.
 */

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Radio, RadioGroup } from "@/components/ui/Radio";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Demo, Readout } from "@/components/site/Demo";

/* ── Input ────────────────────────────────────────────────────────────────── */

const INPUT_CODE = `
import { Input } from "@/components/ui/Input";

const [email, setEmail] = useState("");
const bad = email.length > 3 && !email.includes("@");

<Input
  label="Work email"
  type="email"
  required
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  description="Only ever used for the receipt."
  // A node, not a boolean: the message and the
  // invalid state cannot drift apart.
  error={bad ? "That address is missing an @." : undefined}
/>

// Slots sit INSIDE the box. leading/trailing, not
// prefix/suffix — prefix is a real HTML attribute
// typed string, so the name is already taken.
<Input label="Budget" leading="$" trailing="/ month" />
`;

export function InputDemo() {
  const [email, setEmail] = useState("");
  const [budget, setBudget] = useState("120");

  // Deliberately lenient: an error that fires on the first keystroke shouts at
  // someone who is still typing.
  const emailError =
    email.length > 3 && !email.includes("@") ? "That address is missing an @." : undefined;

  return (
    <Demo
      id="input"
      name="Input"
      meta="No dependencies"
      summary="A text field on the kit's tokens, with label, description and error wired through Field. Extends the native props, so type, name and autoComplete behave as usual — and the error is announced, not just coloured."
      code={INPUT_CODE}
    >
      <div className="grid max-w-md gap-4">
        <Input
          label="Work email"
          type="email"
          required
          autoComplete="email"
          placeholder="ada@analytical.co"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          description="Only ever used for the receipt."
          error={emailError}
        />

        <Input
          label="Budget"
          inputMode="decimal"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          leading="$"
          trailing={<span className="text-nano">/ month</span>}
          description="leading and trailing render inside the border, so the focus ring wraps the lot."
        />

        <Input
          label="Card number"
          defaultValue="4242 4242"
          error="This card number is eight digits short."
        />
      </div>

      <p className="mt-4 max-w-prose text-nano text-ink-3">
        Type three characters into the email field without an @: the border turns danger-coloured
        AND a role=alert message appears, wired to the input with aria-describedby. The last field
        is stuck invalid so both can be seen at once.
      </p>

      <Readout label="email">{JSON.stringify(email)}</Readout>
    </Demo>
  );
}

/* ── Textarea ─────────────────────────────────────────────────────────────── */

const TEXTAREA_CODE = `
import { Textarea } from "@/components/ui/Textarea";

// Grows with the content, then stops and scrolls.
// Without maxRows a pasted essay pushes the submit
// button off the screen.
<Textarea
  label="Notes"
  autoGrow
  maxRows={6}
  rows={2}          // the FLOOR it grows from
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
/>

// Off by default: a plain resizable field.
<Textarea label="Notes" rows={3} />
`;

const SEED_NOTES = "Client prefers the morning slot.\nParking is behind the building.";

export function TextareaDemo() {
  const [notes, setNotes] = useState(SEED_NOTES);
  const [brief, setBrief] = useState("");

  return (
    <Demo
      id="textarea"
      name="Textarea"
      meta="No dependencies"
      summary="The multi-line twin of Input. Auto-growth is opt-in, measured in a layout effect so a field that opens with a value in it is already the right height on the first paint rather than snapping after it — and maxRows is the ceiling that hands scrolling back to the element."
      code={TEXTAREA_CODE}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Textarea
          label="Notes (autoGrow, maxRows 6)"
          autoGrow
          maxRows={6}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          description="Press Enter a few times: it grows to six rows and then scrolls instead."
        />
        <Textarea
          label="Brief (plain)"
          rows={3}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Drag the corner to resize this one yourself."
          description="No autoGrow, so the browser's own resize handle stays."
        />
      </div>

      <p className="mt-4 max-w-prose text-nano text-ink-3">
        The left field starts two lines tall with two lines already in it — that is the layout
        effect doing its job. Reload the page and watch for a jump: there is none.
      </p>

      <Readout label="rows in notes">{notes.split("\n").length}</Readout>
    </Demo>
  );
}

/* ── Checkbox ─────────────────────────────────────────────────────────────── */

const CHECKBOX_CODE = `
import { Checkbox } from "@/components/ui/Checkbox";

const [rows, setRows] = useState([false, true, false]);
const all  = rows.every(Boolean);
const some = rows.some(Boolean);

// indeterminate is a DOM property, not an attribute:
// the component writes it through a ref so assistive
// tech announces "mixed".
<Checkbox
  label="Select all"
  checked={all}
  indeterminate={some && !all}
  onChange={(next) => setRows(rows.map(() => next))}
/>
`;

const ROWS = ["Invoice #1041", "Invoice #1042", "Invoice #1043"];

export function CheckboxDemo() {
  const [rows, setRows] = useState([false, true, false]);

  const all = rows.every(Boolean);
  const some = rows.some(Boolean);

  return (
    <Demo
      id="checkbox"
      name="Checkbox"
      meta="No dependencies"
      summary="A real <input type=checkbox>, kept in the DOM so Space, form participation and the indeterminate property all still work. Only the box is drawn by the kit, because accent-color ignores every other token."
      code={CHECKBOX_CODE}
    >
      <div className="max-w-72 rounded-btn border border-line">
        <div className="border-b border-line px-3 py-2.5">
          <Checkbox
            label="Select all"
            checked={all}
            indeterminate={some && !all}
            onChange={(next) => setRows(rows.map(() => next))}
          />
        </div>
        {/* A column, not `space-y-*`: the Checkbox label is `inline-flex`, so
            the rows would otherwise flow onto one line and the vertical
            margins would do nothing. */}
        <div className="flex flex-col items-start gap-2.5 px-3 py-2.5">
          {ROWS.map((row, i) => (
            <Checkbox
              key={row}
              label={row}
              checked={rows[i]}
              onChange={(next) => setRows(rows.map((v, j) => (j === i ? next : v)))}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-5">
        <Checkbox label="Disabled" checked={false} disabled onChange={() => {}} />
        <Checkbox label="Disabled, checked" checked disabled onChange={() => {}} />
      </div>

      <p className="mt-4 max-w-prose text-nano text-ink-3">
        Tab to the header box: the focus ring is the kit&rsquo;s global one, moved onto the drawn
        box because the real input is visually hidden.
      </p>

      <Readout label="checked rows">{rows.filter(Boolean).length} of 3</Readout>
    </Demo>
  );
}

/* ── RadioGroup ───────────────────────────────────────────────────────────── */

const RADIO_CODE = `
import { RadioGroup, Radio } from "@/components/ui/Radio";

const [cadence, setCadence] = useState("daily");

// name is required — it is what makes the inputs one
// group, and what gives you arrow-key navigation and
// a single tab stop for free.
<RadioGroup
  name="cadence"
  value={cadence}
  onChange={setCadence}
  label="Notification cadence"
  description="Applies to every calendar you own."
>
  <Radio value="instant" label="As it happens" />
  <Radio value="daily"   label="Daily digest" />
  <Radio value="weekly"  label="Weekly summary" />
  {/* One option out, rather than the whole group —
      RadioGroup takes a disabled prop too. */}
  <Radio value="never"   label="Never" disabled />
</RadioGroup>

<RadioGroup … orientation="horizontal" />
`;

export function RadioDemo() {
  const [cadence, setCadence] = useState("daily");
  const [billing, setBilling] = useState("yearly");

  return (
    <Demo
      id="radio-group"
      name="RadioGroup"
      meta="No dependencies"
      summary="Native inputs sharing a name, so the browser gives you the radio keyboard model for free: arrows move between options and only the checked one is a tab stop, which is what makes Tab skip the whole group in one press. Only the circle is drawn by the kit."
      code={RADIO_CODE}
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <RadioGroup
          name="demo-cadence"
          value={cadence}
          onChange={setCadence}
          label="Notification cadence"
          description="Vertical is the default — one option per line, easy to scan."
        >
          <Radio value="instant" label="As it happens" />
          <Radio value="daily" label="Daily digest" />
          <Radio value="weekly" label="Weekly summary" />
          <Radio value="never" label="Never (ask your admin)" disabled />
        </RadioGroup>

        <RadioGroup
          name="demo-billing"
          value={billing}
          onChange={setBilling}
          label="Billing period"
          description="orientation=horizontal, for two or three short options."
          orientation="horizontal"
        >
          <Radio value="monthly" label="Monthly" />
          <Radio value="yearly" label="Yearly" />
          <Radio value="once" label="One-off" />
        </RadioGroup>
      </div>

      <p className="mt-5 max-w-prose text-nano text-ink-3">
        Tab into either group and use the arrow keys — the disabled option is skipped, and Tab
        leaves the whole group rather than stepping through every option. A group has no
        &ldquo;uncheck&rdquo;: model the empty state as its own option, or use checkboxes.
      </p>

      <Readout label="cadence / billing">
        {JSON.stringify(cadence)} / {JSON.stringify(billing)}
      </Readout>
    </Demo>
  );
}

/* ── Field ────────────────────────────────────────────────────────────────── */

const FIELD_CODE = `
import { Field } from "@/components/ui/Field";

// Input, Textarea and RadioGroup already sit on this.
// Reach for it directly when the control renders its
// own trigger — a Select, a Combobox, a DatePicker —
// which cannot take a plain <label htmlFor>.
<Field
  label="Timezone"
  description="Slots are shown in this zone."
  error={touched && !zone ? "Pick a timezone." : undefined}
>
  {/* Children is a FUNCTION, so the ids cannot be
      half-wired: spread what it hands you onto the
      focusable element. */}
  {(control) => (
    <Select value={zone} onValueChange={setZone}>
      <SelectTrigger {...control}>
        <SelectValue placeholder="Choose" />
      </SelectTrigger>
      …
    </Select>
  )}
</Field>
`;

export function FieldDemo() {
  const [zone, setZone] = useState("");
  const [touched, setTouched] = useState(false);

  const error = touched && !zone ? "Pick a timezone before saving." : undefined;

  return (
    <Demo
      id="field"
      name="Field"
      meta="No dependencies"
      summary="The label, description and error wiring under Input, Textarea and RadioGroup, usable on its own. Children is a function that hands you the id, aria-describedby, aria-invalid and required to spread — because a control that renders its own trigger cannot be reached by a plain <label htmlFor>."
      code={FIELD_CODE}
    >
      <div className="max-w-72">
        <Field
          label="Timezone"
          description="Every slot on the booking page is shown in this zone."
          error={error}
        >
          {(control) => (
            <Select
              value={zone}
              onValueChange={(next) => {
                setZone(next);
                setTouched(true);
              }}
            >
              <SelectTrigger {...control}>
                <SelectValue placeholder="Choose a timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Europe/Lisbon">Lisbon</SelectItem>
                <SelectItem value="Europe/Paris">Paris</SelectItem>
                <SelectItem value="America/New_York">New York</SelectItem>
                <SelectItem value="America/Santiago">Santiago</SelectItem>
              </SelectContent>
            </Select>
          )}
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <Button
          variant="secondary"
          onClick={() => {
            setTouched(true);
            if (zone) toast.success("Timezone saved");
          }}
        >
          Save
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setZone("");
            setTouched(false);
          }}
        >
          Reset
        </Button>
      </div>

      <p className="mt-4 max-w-prose text-nano text-ink-3">
        Press Save with nothing chosen: the trigger picks up aria-invalid and the message replaces
        the description rather than stacking under it — one describedby, so a screen reader reads
        the error instead of both.
      </p>

      <Readout label="timezone">{JSON.stringify(zone)}</Readout>
    </Demo>
  );
}

/* ── Toaster ──────────────────────────────────────────────────────────────── */

const TOAST_CODE = `
// Mount once, near the root of the app:
import { Toaster } from "@/components/ui/Toaster";
<Toaster />

// Fire from anywhere:
import { toast } from "sonner";

toast("Draft saved");
toast.success("Booking confirmed");
toast.error("Card declined");
toast("Invite sent", {
  action: { label: "Undo", onClick: undo },
});
`;

export function ToastDemo() {
  return (
    <Demo
      id="toaster"
      name="Toaster"
      meta="sonner"
      summary="sonner repainted in kit tokens, so one mounted Toaster is correct in light and dark with no theme prop. Switch the theme at the top of the page while a toast is up."
      code={TOAST_CODE}
    >
      <div className="flex flex-wrap gap-2.5">
        <Button variant="secondary" onClick={() => toast("Draft saved")}>
          Neutral
        </Button>
        <Button variant="secondary" onClick={() => toast.success("Booking confirmed for 14:30")}>
          Success
        </Button>
        <Button variant="secondary" onClick={() => toast.error("Card declined — try another")}>
          Error
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast("Invite sent to ada@analytical.co", {
              action: { label: "Undo", onClick: () => toast("Invite withdrawn") },
              duration: 6000,
            })
          }
        >
          With an action
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast("Syncing 42 records", {
              description: "This keeps running if you navigate away.",
            })
          }
        >
          With a description
        </Button>
      </div>

      <p className="mt-4 max-w-prose text-nano text-ink-3">
        sonner injects its stylesheet unlayered, which beats every Tailwind utility no matter how
        specific — so every override in Toaster.tsx carries an <code className="font-mono">!</code>.
        Without it the theming is decoration.
      </p>
    </Demo>
  );
}

/* ── Icon ─────────────────────────────────────────────────────────────────── */

const ICON_CODE = `
import { Icon } from "@/components/ui/Icon";

// Decorative by default: aria-hidden, inheriting
// currentColor and its own optical size.
<Icon name="search" />

// Meaningful on its own? Give it a name and it
// becomes role="img" with a <title>.
<Icon name="alert" title="3 conflicts" size={18} />
`;

const ICON_NAMES: IconName[] = [
  "alert",
  "cal",
  "check",
  "chevD",
  "chevL",
  "chevR",
  "chevU",
  "clock",
  "minus",
  "plus",
  "search",
  "x",
];

export function IconDemo() {
  return (
    <Demo
      id="icon"
      name="Icon"
      meta="No dependencies"
      summary="Twelve icons on a 24×24 grid, stroked with currentColor. No icon font, no sprite, no network request — and no token references, because the colour is whatever text colour it sits in."
      code={ICON_CODE}
    >
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {ICON_NAMES.map((name) => (
          <li
            key={name}
            className="flex flex-col items-center gap-1.5 rounded-btn border border-line py-3 text-ink-2"
          >
            <Icon name={name} size={18} />
            <code className="font-mono text-nano text-ink-3">{name}</code>
          </li>
        ))}
      </ul>

      <p className="mt-4 flex items-center gap-2 text-ui text-ink-2">
        <span className="text-accent">
          <Icon name="alert" size={18} />
        </span>
        Colour comes from the parent, so an icon needs no theming of its own.
      </p>
    </Demo>
  );
}
