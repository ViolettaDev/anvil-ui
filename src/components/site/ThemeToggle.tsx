"use client";

/**
 * ThemeToggle — writes `data-theme` on <html> and remembers the choice under
 * the "anvil-theme" key, which is the same key the boot script in layout.tsx
 * reads before first paint.
 *
 * THE HYDRATION TRAP, and why the first render looks undecided
 * -----------------------------------------------------------
 * The obvious version initialises state from `localStorage.getItem(...)`. That
 * value does not exist on the server, so the server renders "nothing pressed"
 * and the browser's FIRST render says "dark is pressed" — a mismatch that
 * type-checks, lints, passes its tests, and only misbehaves in a real browser.
 * The same goes for `matchMedia`, `document`, cookies and `window.location`.
 *
 * `useSyncExternalStore` is the API React ships for exactly this. Its third
 * argument is the SERVER snapshot: React renders that during SSR and during
 * hydration, then re-reads the client snapshot afterwards and re-renders if
 * the two differ. So the server and the first client render agree by
 * construction, and no effect has to paper over the difference. Here the
 * server snapshot is `null`, meaning "not known yet" — for one frame no
 * segment is highlighted. The page itself is already in the right theme by
 * then; the boot script saw to that before React existed.
 *
 * The subscription is not decoration either: `localStorage.setItem` fires
 * `storage` in OTHER tabs only, so writes in this tab are broadcast through a
 * module-level listener set. Open the page twice and both toggles agree.
 *
 * Three states, because that is what globals.css defines: an explicit `light`
 * or `dark` beats the OS in either direction, and "System" removes the
 * attribute so `prefers-color-scheme` takes back over.
 */

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "anvil-theme";

type Choice = "system" | "light" | "dark";

const OPTIONS: { value: Choice; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

/** Returns a primitive, so React can compare snapshots with Object.is. */
function getSnapshot(): Choice {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "dark" || stored === "light" ? stored : "system";
  } catch {
    // Storage can throw outright in a locked-down browser. An unreadable key
    // and an unset key mean the same thing.
    return "system";
  }
}

/** No storage on the server — and deliberately not "system" either, so the
 *  toggle can tell "not known yet" from "the user chose to follow the OS". */
function getServerSnapshot(): Choice | null {
  return null;
}

function applyTheme(next: Choice) {
  // The attribute first: it is what actually repaints the page, and it has to
  // land even when storage is unavailable.
  const root = document.documentElement;
  if (next === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", next);

  try {
    if (next === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Not persisted; still applied for this visit.
  }

  for (const listener of listeners) listener();
}

export function ThemeToggle() {
  const choice = useSyncExternalStore<Choice | null>(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex items-center gap-0.5 rounded-btn border border-line bg-card p-0.5"
    >
      {OPTIONS.map((option) => {
        const active = choice === option.value;
        return (
          <button
            key={option.value}
            type="button"
            // false on every segment until the client snapshot is read — the
            // same on the server and on the first client render, which is the
            // whole point.
            aria-pressed={active}
            onClick={() => applyTheme(option.value)}
            className={cn(
              "cursor-pointer rounded-btn px-2.5 py-1 text-nano font-semibold tracking-wider uppercase transition-colors",
              active ? "bg-accent-tint text-accent" : "text-ink-3 hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
