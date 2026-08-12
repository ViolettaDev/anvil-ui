"use client";

/**
 * Select — the native `<select>` replacement, built on Radix Select.
 *
 * Use this to pick a VALUE out of a list. If your menu runs commands
 * ("Duplicate", "Delete", "Sign out") reach for DropdownMenu instead: it has no
 * value, no checked state, and its items are allowed to be links.
 *
 * Composable, same shape as the Radix primitives:
 *   <Select value={v} onValueChange={setV}>
 *     <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
 *     <SelectContent>
 *       <SelectGroup>
 *         <SelectLabel>Fruit</SelectLabel>
 *         <SelectItem value="apple">Apple</SelectItem>
 *         <SelectSeparator />
 *         <SelectItem value="pear">Pear</SelectItem>
 *       </SelectGroup>
 *     </SelectContent>
 *   </Select>
 *
 * THE TRAP THIS FILE EXISTS TO CLOSE — the trigger must show the item's LABEL,
 * never the raw value. Radix does that for you as long as `<SelectValue />` is
 * left childless: the selected `<SelectItem>`'s text is portalled into it, even
 * while the list is closed. The moment you write `<SelectValue>{value}</…>` you
 * have opted out of that and the trigger prints `apple` instead of `Apple`.
 * So when you do need to render the label yourself — a flag, an avatar, a
 * summary of a value that has no item on screen — use one of the two supported
 * escapes rather than interpolating the value:
 *
 *   <SelectValue items={{ apple: "Apple", pear: "Pear" }} />
 *   <SelectValue>{(v) => (v ? LABELS[v] : "Choose…")}</SelectValue>
 *
 * Both read the live value from this file's own context, which `Select` keeps in
 * sync in controlled AND uncontrolled mode. A lookup that misses (unknown value,
 * `undefined` label) falls back to Radix's item text, so a partial map is safe.
 *
 * Props worth knowing:
 *   Select        — every Radix Root prop (value, defaultValue, onValueChange,
 *                   disabled, required, name, dir…).
 *   SelectTrigger — `variant`: "default" (full-width form field) | "pill"
 *                   (bordered toolbar control) | "compact" (bare inline label).
 *   SelectValue   — `items` map / children-as-function, per the note above.
 *
 * Styling comes only from the kit tokens, so a theme swap needs no edits here.
 * Focus is the one global ring from globals.css — no component sets
 * `outline-none`, which is exactly what would have suppressed it.
 */

import * as RSelect from "@radix-ui/react-select";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useState,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

/**
 * The current value, mirrored out of Radix. Radix keeps its value in a private
 * context, so `SelectValue` cannot read it — this is the smallest thing that
 * makes an `items` map possible without asking the caller to repeat the value.
 */
const SelectValueContext = createContext<string | undefined>(undefined);

export type SelectProps = ComponentPropsWithoutRef<typeof RSelect.Root>;

export function Select({
  value,
  defaultValue,
  onValueChange,
  children,
  ...props
}: SelectProps) {
  // Tracks the uncontrolled case. In the controlled case `value` always wins,
  // so this state is simply never read.
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const current = value ?? uncontrolled;

  const handleValueChange = useCallback(
    (next: string) => {
      setUncontrolled(next);
      onValueChange?.(next);
    },
    [onValueChange],
  );

  return (
    <SelectValueContext.Provider value={current}>
      <RSelect.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        {...props}
      >
        {children}
      </RSelect.Root>
    </SelectValueContext.Provider>
  );
}

export const SelectGroup = RSelect.Group;

export interface SelectValueProps
  extends Omit<ComponentPropsWithoutRef<typeof RSelect.Value>, "children"> {
  /** value → label. A missing entry falls back to the selected item's text. */
  items?: Record<string, ReactNode>;
  children?: ReactNode | ((value: string | undefined) => ReactNode);
}

export const SelectValue = forwardRef<
  ComponentRef<typeof RSelect.Value>,
  SelectValueProps
>(function SelectValue({ items, children, ...props }, ref) {
  const value = useContext(SelectValueContext);

  let rendered: ReactNode;
  if (typeof children === "function") {
    rendered = children(value);
  } else if (children !== undefined) {
    rendered = children;
  } else if (items && value !== undefined && value !== "") {
    rendered = items[value];
  }

  // `undefined` is load-bearing: Radix treats "no children" as permission to
  // portal the selected item's <ItemText> in here. Anything else — including
  // null or "" — takes that over and you own the label from then on.
  return (
    <RSelect.Value ref={ref} {...props}>
      {rendered}
    </RSelect.Value>
  );
});

type TriggerVariant = "default" | "compact" | "pill";

export interface SelectTriggerProps
  extends ComponentPropsWithoutRef<typeof RSelect.Trigger> {
  variant?: TriggerVariant;
}

const TRIGGER_VARIANTS: Record<TriggerVariant, string> = {
  // Full-width form field. Pairs with a <label htmlFor> on the trigger id.
  default:
    "flex h-10 w-full items-center justify-between gap-2 rounded-btn border border-line bg-card px-3 py-2 text-ui text-ink transition-colors data-placeholder:text-ink-3 disabled:cursor-not-allowed disabled:opacity-50",
  // Bordered pill — a self-contained control for toolbars and headers, sized to
  // sit next to icon buttons without looking like a form field.
  pill: "inline-flex h-9 items-center gap-2 rounded-btn border border-line bg-transparent ps-2.5 pe-2 text-ui text-ink transition-colors hover:border-ink-3 hover:bg-surface data-placeholder:text-ink-3 disabled:cursor-not-allowed disabled:opacity-50",
  // Bare text trigger for tight inline contexts — no border, no height, reads
  // as a label that happens to open a list.
  compact:
    "inline-flex items-center gap-1.5 bg-transparent text-nano font-semibold tracking-wider text-ink uppercase transition-opacity hover:opacity-80 disabled:opacity-50",
};

export const SelectTrigger = forwardRef<
  ComponentRef<typeof RSelect.Trigger>,
  SelectTriggerProps
>(function SelectTrigger(
  { className, children, variant = "default", ...props },
  ref,
) {
  return (
    <RSelect.Trigger
      ref={ref}
      className={cn(TRIGGER_VARIANTS[variant], className)}
      // Password managers and colour-picker extensions decorate form controls
      // between SSR and hydration; without this every one of them is a console
      // error the reader cannot act on.
      suppressHydrationWarning
      {...props}
    >
      {children}
      <RSelect.Icon asChild>
        <span aria-hidden className="ms-1 inline-flex shrink-0 opacity-70">
          <CaretIcon />
        </span>
      </RSelect.Icon>
    </RSelect.Trigger>
  );
});

export type SelectContentProps = ComponentPropsWithoutRef<
  typeof RSelect.Content
>;

export const SelectContent = forwardRef<
  ComponentRef<typeof RSelect.Content>,
  SelectContentProps
>(function SelectContent(
  { className, children, position = "popper", sideOffset = 6, ...props },
  ref,
) {
  return (
    <RSelect.Portal>
      <RSelect.Content
        ref={ref}
        position={position}
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-h-72 min-w-(--radix-select-trigger-width) overflow-hidden rounded-btn border border-line bg-card text-ink shadow-2xl",
          className,
        )}
        {...props}
      >
        {/* Radix hides the viewport's scrollbar, so a long list would otherwise
            give no hint that it scrolls. These render nothing until it does. */}
        <RSelect.ScrollUpButton className="flex h-5 items-center justify-center text-ink-3">
          <span aria-hidden className="rotate-180">
            <CaretIcon />
          </span>
        </RSelect.ScrollUpButton>
        <RSelect.Viewport className="p-1">{children}</RSelect.Viewport>
        <RSelect.ScrollDownButton className="flex h-5 items-center justify-center text-ink-3">
          <span aria-hidden>
            <CaretIcon />
          </span>
        </RSelect.ScrollDownButton>
      </RSelect.Content>
    </RSelect.Portal>
  );
});

export interface SelectItemProps
  extends ComponentPropsWithoutRef<typeof RSelect.Item> {
  children?: ReactNode;
}

export const SelectItem = forwardRef<
  ComponentRef<typeof RSelect.Item>,
  SelectItemProps
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <RSelect.Item
      ref={ref}
      className={cn(
        // Highlight is driven by data-highlighted, which Radix sets for BOTH
        // pointer and keyboard — a `hover:` rule on top would only add a state
        // that sticks after a tap on touch devices.
        "relative flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 pe-8 text-ui text-ink transition-colors select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent-tint data-[state=checked]:font-semibold",
        className,
      )}
      {...props}
    >
      <RSelect.ItemText>{children}</RSelect.ItemText>
      <RSelect.ItemIndicator className="absolute end-2 inline-flex h-4 w-4 items-center justify-center text-accent">
        <CheckIcon />
      </RSelect.ItemIndicator>
    </RSelect.Item>
  );
});

export const SelectLabel = forwardRef<
  ComponentRef<typeof RSelect.Label>,
  ComponentPropsWithoutRef<typeof RSelect.Label>
>(function SelectLabel({ className, ...props }, ref) {
  return (
    <RSelect.Label
      ref={ref}
      className={cn(
        "px-3 py-1.5 text-nano font-semibold tracking-wider text-ink-3 uppercase",
        className,
      )}
      {...props}
    />
  );
});

export const SelectSeparator = forwardRef<
  ComponentRef<typeof RSelect.Separator>,
  ComponentPropsWithoutRef<typeof RSelect.Separator>
>(function SelectSeparator({ className, ...props }, ref) {
  return (
    <RSelect.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-line", className)}
      {...props}
    />
  );
});

function CaretIcon() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden>
      <path
        d="M1 1l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
