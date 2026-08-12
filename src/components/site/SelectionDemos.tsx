"use client";

/**
 * Select, Combobox and DropdownMenu — the three things people reach for when
 * they mean "a list appears".
 *
 * They are not interchangeable: a Select holds a VALUE, a Combobox holds text
 * that happens to be filtered by a list, and a DropdownMenu holds ACTIONS and
 * has no value at all. Screen readers announce the difference, so the demo
 * shows all three side by side rather than pretending one covers the lot.
 */

import { useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Demo, DemoField, Readout } from "@/components/site/Demo";

/* ── Select ───────────────────────────────────────────────────────────────── */

const SELECT_CODE = `
import {
  Select, SelectTrigger, SelectValue,
  SelectContent, SelectItem,
} from "@/components/ui/Select";

const [role, setRole] = useState("");

<Select value={role} onValueChange={setRole}>
  <SelectTrigger id="role">
    {/* Leave it childless: Radix portals the item's
        LABEL in here, so the trigger never shows a raw
        value. */}
    <SelectValue placeholder="Choose a role" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="owner">Owner</SelectItem>
    <SelectItem value="editor">Editor</SelectItem>
  </SelectContent>
</Select>
`;

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
  billing: "Billing contact",
};

export function SelectDemo() {
  const [role, setRole] = useState("");
  const [density, setDensity] = useState("cosy");

  return (
    <Demo
      id="select"
      name="Select"
      meta="Radix Select"
      summary="The native <select> replacement, with the label trap closed: the trigger shows the item's text, never the raw value — including before the list has ever been opened."
      code={SELECT_CODE}
    >
      <DemoField label="Role" htmlFor="demo-role" className="max-w-72">
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger id="demo-role">
            <SelectValue placeholder="Choose a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Full access</SelectLabel>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Limited</SelectLabel>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
              <SelectItem value="billing" disabled>
                Billing contact
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </DemoField>

      <div className="mt-5">
        <p className="mb-1.5 text-nano font-semibold tracking-wider text-ink-3 uppercase">
          pill trigger, label from an items map
        </p>
        <Select value={density} onValueChange={setDensity}>
          <SelectTrigger variant="pill" aria-label="Row density">
            <SelectValue items={{ compact: "Compact", cosy: "Cosy", roomy: "Roomy" }} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="compact">Compact</SelectItem>
            <SelectItem value="cosy">Cosy</SelectItem>
            <SelectItem value="roomy">Roomy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Readout label="role / density">
        {JSON.stringify(role)} / {JSON.stringify(density)}
        {role ? <span className="text-ink-3"> — shows as “{ROLE_LABELS[role]}”</span> : null}
      </Readout>
    </Demo>
  );
}

/* ── Combobox ─────────────────────────────────────────────────────────────── */

const COMBOBOX_CODE = `
import { Combobox } from "@/components/ui/Combobox";

const [client, setClient] = useState("");

<Combobox
  value={client}
  onChange={setClient}
  options={CLIENTS}              // { id, name, email? }
  onSelectOption={(o) => setEmail(o.email ?? "")}
  placeholder="Search clients…"
  ariaLabel="Client"
/>
`;

const CLIENTS: ComboboxOption[] = [
  { id: "1", name: "Ada Lovelace", email: "ada@analytical.co" },
  { id: "2", name: "Grace Hopper", email: "grace@navy.mil" },
  { id: "3", name: "Katherine Johnson", email: "katherine@nasa.gov" },
  { id: "4", name: "Radia Perlman", email: "radia@spanningtree.net" },
  { id: "5", name: "Barbara Liskov", phone: "+1 617 555 0148" },
  { id: "6", name: "Margaret Hamilton", email: "margaret@apollo.dev" },
];

export function ComboboxDemo() {
  const [client, setClient] = useState("");
  const [email, setEmail] = useState("");

  return (
    <Demo
      id="combobox"
      name="Combobox"
      meta="Radix Popover"
      summary="A real input that filters as you type and still accepts anything you type. Free entry is the point — type a name nobody has and the “Add …” row makes that path visible instead of leaving you guessing."
      code={COMBOBOX_CODE}
    >
      <DemoField
        label="Client"
        htmlFor="demo-client"
        className="max-w-72"
        hint="Try “li”, then try a name that is not in the list."
      >
        <Combobox
          id="demo-client"
          value={client}
          onChange={(next) => {
            setClient(next);
            setEmail("");
          }}
          onSelectOption={(option) => setEmail(option.email ?? option.phone ?? "")}
          options={CLIENTS}
          placeholder="Search clients…"
          ariaLabel="Client"
        />
      </DemoField>

      <Readout label="text / picked">
        {JSON.stringify(client)} / {JSON.stringify(email)}
      </Readout>
    </Demo>
  );
}

/* ── DropdownMenu ─────────────────────────────────────────────────────────── */

const MENU_CODE = `
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";

<DropdownMenu>
  {/* asChild is the default: your button, not a
      second one nested inside it. */}
  <DropdownMenuTrigger>
    <Button variant="secondary">Actions</Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent align="end">
    <DropdownMenuItem onSelect={duplicate}>Duplicate</DropdownMenuItem>
    <DropdownMenuItem href="/settings">Settings</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="danger" onSelect={remove}>
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
`;

export function DropdownMenuDemo() {
  const [last, setLast] = useState("");

  return (
    <Demo
      id="dropdown-menu"
      name="DropdownMenu"
      meta="Radix DropdownMenu"
      summary="A menu RUNS something. No value, nothing stays checked, items are allowed to be links. If the choice has to show up in the trigger afterwards you wanted a Select."
      code={MENU_CODE}
    >
      <div className="flex flex-wrap items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="secondary">
              Actions
              <Icon name="chevD" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Record</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={() => {
                setLast("duplicate");
                toast.success("Record duplicated");
              }}
            >
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                setLast("export");
                toast("Export queued");
              }}
            >
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem href="https://violettadev.com" external>
              Open docs
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="danger"
              onSelect={() => {
                setLast("delete");
                toast.error("Record deleted");
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <p className="text-nano text-ink-3">
          Type a letter with it open — Radix does typeahead too.
        </p>
      </div>

      <Readout label="last action">{JSON.stringify(last)}</Readout>
    </Demo>
  );
}
