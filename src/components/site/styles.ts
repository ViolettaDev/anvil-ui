/**
 * Class strings that belong to THIS PAGE, not to the kit.
 *
 * What is left here is genuinely page furniture: a keyboard key drawn in prose,
 * and a square icon-only button the kit has no size for — `Button` is a labelled
 * control with horizontal padding, and squashing it into a 36×36 box would mean
 * fighting its own sizes. Everything else that used to live in this file is now
 * a real component: buttons come from `@/components/ui/Button`, text fields from
 * `@/components/ui/Input` and `@/components/ui/Textarea`, inline links from
 * `@/components/ui/Link`.
 *
 * Nothing under `src/components/ui` imports this file, so deleting it cannot
 * break a component. Both strings are built from the same tokens as everything
 * else, so they follow a theme swap like the rest of the page: no hex, no
 * `dark:` variant.
 */

/** Square icon-only button. Always give it an `aria-label`. */
export const btnIcon =
  "inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-btn border border-line bg-card text-ink-2 transition-colors hover:border-ink-3 hover:text-ink";

/** A keyboard key in prose. */
export const kbd =
  "inline-block rounded-btn border border-line bg-surface px-1.5 py-0.5 font-mono text-nano font-medium text-ink-2";
