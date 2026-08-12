"use client";

/**
 * Dialog, ConfirmDialog and Tooltip — everything that portals to <body>.
 *
 * The dialog demo deliberately contains a Select. A select opens in its own
 * portal, outside the dialog's DOM subtree, so the naive implementation reads
 * a click on a select item as a click OUTSIDE the modal and closes it
 * underneath you. Dialog.tsx guards that; try it.
 */

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/Dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Tooltip, TooltipProvider } from "@/components/ui/Tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { Demo, Readout } from "@/components/site/Demo";
import { btnIcon } from "@/components/site/styles";

/* ── Dialog ───────────────────────────────────────────────────────────────── */

const DIALOG_CODE = `
import {
  Dialog, DialogTrigger, DialogContent, DialogClose,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  {/* asChild hands the trigger's behaviour to your
      own button rather than nesting a second one. */}
  <DialogTrigger asChild>
    <Button variant="secondary">Rename</Button>
  </DialogTrigger>

  {/* title IS the accessible name — do not add your
      own heading. Omit description and the dialog
      simply has none. */}
  <DialogContent
    title="Rename project"
    description="Everyone on the team sees the new name."
  >
    <Input label="Project name" value={draft} onChange={…} />
    <DialogClose asChild>
      <Button variant="secondary">Cancel</Button>
    </DialogClose>
  </DialogContent>
</Dialog>
`;

export function DialogDemo() {
  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState("Quarterly report");
  const [draft, setDraft] = useState("Quarterly report");
  const [visibility, setVisibility] = useState("team");

  return (
    <Demo
      id="dialog"
      name="Dialog"
      meta="Radix Dialog"
      summary="Focus trap, focus restore, Escape, scroll lock and inert background — all from Radix. What the wrapper adds is the surface, a titled header, a bottom-sheet variant, and a guard so a Select opening inside the modal does not dismiss it."
      code={DIALOG_CODE}
    >
      <div className="flex flex-wrap gap-3">
        <Dialog
          open={open}
          onOpenChange={(next) => {
            if (next) setDraft(name);
            setOpen(next);
          }}
        >
          <DialogTrigger asChild>
            <Button variant="secondary">Rename project</Button>
          </DialogTrigger>
          <DialogContent
            title="Rename project"
            description="Everyone on the team sees the new name straight away."
          >
            <div className="space-y-4">
              <Input
                label="Project name"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />

              <div>
                <label
                  htmlFor="demo-dialog-visibility"
                  className="mb-1.5 block text-ui font-medium text-ink"
                >
                  Visibility
                </label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger id="demo-dialog-visibility">
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Only me</SelectItem>
                    <SelectItem value="team">My team</SelectItem>
                    <SelectItem value="public">Anyone with the link</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1.5 text-nano text-ink-3">
                  This select portals outside the dialog. The modal stays open anyway.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-1">
                <DialogClose asChild>
                  <Button variant="secondary">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={() => {
                    setName(draft.trim() || name);
                    setOpen(false);
                    toast.success("Project renamed");
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary">Open as sheet</Button>
          </DialogTrigger>
          <DialogContent
            sheet
            title="Filters"
            description="The same panel pinned to the bottom of the viewport."
          >
            <div className="flex justify-end">
              <DialogClose asChild>
                <Button>Done</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <p className="mt-4 max-w-prose text-nano text-ink-3">
        Open it and press Tab repeatedly: focus cycles inside the panel and comes back to the
        trigger on Escape.
      </p>

      <Readout label="project name">{JSON.stringify(name)}</Readout>
    </Demo>
  );
}

/* ── ConfirmDialog ────────────────────────────────────────────────────────── */

const CONFIRM_CODE = `
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";

const [open, setOpen] = useState(false);

<Button variant="danger" onClick={() => setOpen(true)}>
  Delete
</Button>

<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  destructive
  title="Delete 3 records?"
  description="This cannot be undone."
  labels={{ confirm: "Delete" }}
  onConfirm={() => remove()}
/>
`;

export function ConfirmDialogDemo() {
  const [destructiveOpen, setDestructiveOpen] = useState(false);
  const [plainOpen, setPlainOpen] = useState(false);
  const [records, setRecords] = useState(3);

  return (
    <Demo
      id="confirm-dialog"
      name="ConfirmDialog"
      meta="Composed on Dialog"
      summary="The destructive-action pattern, decided once: role=alertdialog, and focus lands on Cancel rather than on the close X — so a reflex Enter cancels instead of sitting on the irreversible path."
      code={CONFIRM_CODE}
    >
      <div className="flex flex-wrap gap-3">
        <Button variant="danger" onClick={() => setDestructiveOpen(true)}>
          Delete {records} records
        </Button>
        <Button variant="secondary" onClick={() => setPlainOpen(true)}>
          Publish
        </Button>
      </div>

      <ConfirmDialog
        open={destructiveOpen}
        onOpenChange={setDestructiveOpen}
        destructive
        title={`Delete ${records} records?`}
        description="They are removed for everyone on the team. This cannot be undone."
        labels={{ confirm: "Delete" }}
        onConfirm={() => {
          setRecords(0);
          toast.error("3 records deleted");
        }}
      />

      <ConfirmDialog
        open={plainOpen}
        onOpenChange={setPlainOpen}
        title="Publish this version?"
        description="It replaces the live version immediately."
        labels={{ confirm: "Publish" }}
        onConfirm={() => toast.success("Published")}
      />

      <p className="mt-4 max-w-prose text-nano text-ink-3">
        Open either one and press Enter without touching the mouse.
      </p>

      <Readout label="records">
        {records}
        {records === 0 ? (
          <button
            type="button"
            className="ms-2 cursor-pointer text-accent underline underline-offset-2"
            onClick={() => setRecords(3)}
          >
            reset
          </button>
        ) : null}
      </Readout>
    </Demo>
  );
}

/* ── Tooltip ──────────────────────────────────────────────────────────────── */

const TOOLTIP_CODE = `
import { Tooltip, TooltipProvider } from "@/components/ui/Tooltip";

// A lone Tooltip provides for itself; wrap a GROUP so
// moving between them skips the delay.
<TooltipProvider>
  <Tooltip label="Calendar" side="top">
    {/* A tooltip is a description, not a name —
        an icon button still needs its own label. */}
    <button aria-label="Calendar">…</button>
  </Tooltip>
</TooltipProvider>
`;

const RAIL: { icon: "cal" | "clock" | "search" | "alert"; label: string; side: "top" | "right" | "bottom" | "left" }[] = [
  { icon: "cal", label: "Calendar", side: "top" },
  { icon: "clock", label: "Availability", side: "bottom" },
  { icon: "search", label: "Search records", side: "right" },
  { icon: "alert", label: "Conflicts", side: "left" },
];

export function TooltipDemo() {
  return (
    <Demo
      id="tooltip"
      name="Tooltip"
      meta="Radix Tooltip"
      summary="Opens on hover AND on keyboard focus, closes on Escape — the two things a title attribute or a CSS-only :hover label will never do for you."
      code={TOOLTIP_CODE}
    >
      <TooltipProvider>
        <div className="flex flex-wrap items-center gap-2">
          {RAIL.map((item) => (
            <Tooltip key={item.label} label={item.label} side={item.side}>
              <button type="button" className={btnIcon} aria-label={item.label}>
                <Icon name={item.icon} size={16} />
              </button>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      <p className="mt-4 max-w-prose text-nano text-ink-3">
        Tab into the rail instead of hovering. Each side is different: top, bottom, right, left.
      </p>
    </Demo>
  );
}
