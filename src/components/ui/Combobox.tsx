"use client";

/**
 * Combobox — a text field that filters a list, and still accepts anything you
 * type. Built on Radix Popover, because Radix has no combobox primitive.
 *
 * The anchor is a REAL `<input>`, not a button pretending to be one: focus never
 * leaves it, which is what lets typing keep filtering while the list is open.
 * Free entry is the point — `onChange` fires on every keystroke, so a value that
 * matches no option is simply what the user typed. When the query matches no
 * option exactly, an "Add …" row makes that path visible instead of leaving
 * people wondering whether the thing they typed counted.
 *
 * Usage:
 *   <Combobox
 *     value={name}
 *     onChange={setName}
 *     options={clients}
 *     onSelectOption={(c) => setEmail(c.email ?? "")}
 *     ariaLabel="Client"
 *   />
 *
 * Props worth knowing:
 *   value / onChange   — controlled text. Selecting a row calls onChange with
 *                        the option's `name`, then onSelectOption(option).
 *   options            — { id, name, email?, phone? }. The secondary line shows
 *                        email, falling back to phone.
 *   labels             — every string this component can render. All optional,
 *                        all English by default:
 *                          labels.addNew(query) → `Add “Ada Lovelace”`
 *                          labels.empty         → "No matches"
 *                        `placeholder` and `ariaLabel` are separate props for
 *                        the same reason: nothing here is hardcoded copy.
 *   invalid            — paints the border with the danger token and sets
 *                        aria-invalid, so the state is not colour-only.
 *
 * Keyboard: ArrowDown/ArrowUp move (and open a closed list), Enter takes the
 * highlighted option, Escape closes without discarding what was typed, Tab
 * leaves and closes. Focus stays in the input throughout, so the highlighted row
 * is published with aria-activedescendant — without it a screen-reader user
 * arrowing through the list hears nothing at all, which is the one thing the
 * original version of this component got wrong.
 */

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import * as Popover from "@radix-ui/react-popover";
import { cn } from "@/lib/cn";

export interface ComboboxOption {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface ComboboxLabels {
  /** Row shown when the query matches no option exactly. Default: `Add “query”`. */
  addNew?: (query: string) => string;
  /** Shown when the filter leaves the list empty. Default: "No matches". */
  empty?: string;
}

export interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  onSelectOption?: (option: ComboboxOption) => void;
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
  invalid?: boolean;
  labels?: ComboboxLabels;
}

const DEFAULT_LABELS = {
  addNew: (query: string) => `Add “${query}”`,
  empty: "No matches",
} satisfies Required<ComboboxLabels>;

export function Combobox({
  value,
  onChange,
  options,
  onSelectOption,
  placeholder,
  ariaLabel,
  id,
  invalid,
  labels,
}: ComboboxProps) {
  const addNewLabel = labels?.addNew ?? DEFAULT_LABELS.addNew;
  const emptyLabel = labels?.empty ?? DEFAULT_LABELS.empty;

  const listboxId = useId();
  const optionId = (index: number) => `${listboxId}-option-${index}`;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const query = value.trim();
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  const exactMatch = options.some(
    (o) => o.name.toLowerCase() === query.toLowerCase(),
  );
  const showAdd = query !== "" && !exactMatch;
  // Keyboard-selectable rows: the filtered options plus the optional "Add …"
  // affordance that sits after them.
  const rowCount = filtered.length + (showAdd ? 1 : 0);
  // The list shrinks as the user types, so the stored index can outrun it.
  // Clamping in ONE place keeps the highlight, the ARIA pointer and Enter from
  // disagreeing about which row is active.
  const activeIndex = rowCount > 0 ? Math.min(active, rowCount - 1) : -1;

  // Keep the highlighted row scrolled into view as the user arrows through.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>("[data-highlighted]");
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function commitOption(option: ComboboxOption) {
    onChange(option.name);
    onSelectOption?.(option);
    setOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (rowCount > 0) setActive((i) => (Math.min(i, rowCount - 1) + 1) % rowCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (rowCount > 0)
        setActive((i) => (Math.min(i, rowCount - 1) - 1 + rowCount) % rowCount);
    } else if (e.key === "Enter") {
      if (!open || activeIndex < 0) return;
      e.preventDefault();
      if (activeIndex < filtered.length) commitOption(filtered[activeIndex]);
      else setOpen(false); // "Add …" row: keep the typed free text, just close.
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-activedescendant={
            open && activeIndex >= 0 ? optionId(activeIndex) : undefined
          }
          aria-autocomplete="list"
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          autoComplete="off"
          // Password managers decorate inputs before hydration; this keeps that
          // from being a console error nobody can act on.
          suppressHydrationWarning
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            "h-10 w-full rounded-btn border bg-card px-3 text-ui text-ink placeholder:text-ink-3",
            invalid ? "border-danger" : "border-line",
          )}
        />
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          // Focus stays in the input so typing keeps filtering the list.
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          // Clicking or typing back in the anchored input must not dismiss it.
          onInteractOutside={(e) => {
            if (
              inputRef.current &&
              e.target instanceof Node &&
              inputRef.current.contains(e.target)
            ) {
              e.preventDefault();
            }
          }}
          className="z-50 max-h-72 w-(--radix-popover-trigger-width) overflow-y-auto rounded-btn border border-line bg-card p-1 shadow-2xl"
        >
          <div ref={listRef} id={listboxId} role="listbox" aria-label={ariaLabel}>
            {filtered.map((option, i) => (
              <div
                key={option.id}
                id={optionId(i)}
                role="option"
                aria-selected={activeIndex === i}
                data-highlighted={activeIndex === i ? "" : undefined}
                onMouseEnter={() => setActive(i)}
                // Preserve input focus and prevent an outside-dismiss on press.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commitOption(option)}
                className="flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-sm px-3 py-2 text-start text-ui text-ink transition-colors select-none data-highlighted:bg-accent-tint"
              >
                <span className="w-full truncate">{option.name}</span>
                {(option.email || option.phone) && (
                  <span className="w-full truncate text-nano text-ink-3">
                    {option.email ?? option.phone}
                  </span>
                )}
              </div>
            ))}

            {showAdd && (
              <div
                id={optionId(filtered.length)}
                role="option"
                aria-selected={activeIndex === filtered.length}
                data-highlighted={activeIndex === filtered.length ? "" : undefined}
                onMouseEnter={() => setActive(filtered.length)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setOpen(false)}
                className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-start text-ui text-accent transition-colors select-none data-highlighted:bg-accent-tint"
              >
                <PlusIcon />
                <span className="truncate">{addNewLabel(query)}</span>
              </div>
            )}

            {rowCount === 0 && (
              <div className="px-3 py-2 text-ui text-ink-3">{emptyLabel}</div>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
