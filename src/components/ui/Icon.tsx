/**
 * Icon — inline SVG drawn from a small registry.
 *
 * No icon font, no sprite sheet, no network request: every icon is a handful of
 * elements on a 24×24 grid stroked with `currentColor`, so it inherits the text
 * colour of whatever it sits in and needs no theming of its own. That is also
 * why nothing in here references a token: `text-ink-3` on the parent is enough.
 *
 * The registry holds each icon's default size and stroke width NEXT TO its
 * geometry. An earlier version of this file kept three parallel objects keyed by
 * icon name — paths, sizes, stroke widths — which is two places too many to
 * forget when adding an icon. `IconName` is derived with `keyof typeof ICONS`
 * rather than hand-written, so the type cannot drift from what actually renders.
 *
 * The defaults are optical, not arithmetic: a chevron reads smaller than a
 * calendar at the same pixel size, so they are not the same pixel size. Any call
 * can override both with `size` / `strokeWidth`.
 *
 * Icons are decorative by default (`aria-hidden`), because they almost always
 * sit beside a label or inside a control that already has an accessible name —
 * announcing them again is noise. Pass `title` for the rare standalone icon that
 * carries meaning on its own; it renders a `<title>` and flips the element to
 * `role="img"`.
 *
 * This registry is deliberately short. Add what you need, delete what you do not
 * — no export in the kit enumerates icon names at runtime, so removing an entry
 * only breaks the call sites that used it, and it breaks them at compile time.
 */

import type { CSSProperties } from "react";

const ICONS = {
  alert: {
    size: 16,
    strokeWidth: 1.7,
    body: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </>
    ),
  },

  cal: {
    size: 14,
    strokeWidth: 1.6,
    body: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
  },

  check: {
    size: 12,
    strokeWidth: 2.5,
    body: <polyline points="20 6 9 17 4 12" />,
  },

  chevD: {
    size: 12,
    strokeWidth: 2,
    body: <polyline points="6 9 12 15 18 9" />,
  },

  chevL: {
    size: 12,
    strokeWidth: 2,
    body: <polyline points="15 18 9 12 15 6" />,
  },

  chevR: {
    size: 12,
    strokeWidth: 2,
    body: <polyline points="9 18 15 12 9 6" />,
  },

  chevU: {
    size: 12,
    strokeWidth: 2,
    body: <polyline points="18 15 12 9 6 15" />,
  },

  clock: {
    size: 12,
    strokeWidth: 1.6,
    body: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    ),
  },

  /* The tri-state dash. Checkbox draws it when `indeterminate` is set. */
  minus: {
    size: 12,
    strokeWidth: 2.5,
    body: <line x1="6" y1="12" x2="18" y2="12" />,
  },

  plus: {
    size: 14,
    strokeWidth: 1.8,
    body: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    ),
  },

  search: {
    size: 14,
    strokeWidth: 1.8,
    body: (
      <>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>
    ),
  },

  x: {
    size: 12,
    strokeWidth: 2.5,
    body: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
  },
} as const;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  /** Width and height in px. Defaults to the registry's optical size. */
  size?: number;
  /** Defaults to the registry's per-icon stroke weight. */
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
  /**
   * Accessible name. Omit for decorative icons — the default is `aria-hidden`,
   * which is what you want whenever a label or `aria-label` is already nearby.
   */
  title?: string;
}

export function Icon({
  name,
  size,
  strokeWidth,
  className,
  style,
  title,
}: IconProps) {
  const icon = ICONS[name];
  const px = size ?? icon.size;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth ?? icon.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      // Keeps the SVG out of the tab order in browsers that still make it
      // focusable; harmless everywhere else.
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {icon.body}
    </svg>
  );
}
