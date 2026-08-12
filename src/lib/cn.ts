/**
 * Joins class names, dropping anything falsy.
 *
 * Deliberately NOT clsx + tailwind-merge: this kit ships zero runtime helpers
 * you did not ask for, and no component here relies on later classes beating
 * earlier ones. If you need real conflict resolution, swap this for
 * tailwind-merge — every component takes `className` and passes it last.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
