"use client";

/**
 * Demo — the frame every component on this page is shown in.
 *
 * One card, two halves: the component running for real on the left, the code
 * that produced it on the right. The point of the split is that a visitor can
 * take ONE component away without reading the rest of the page — the import
 * line is always there, and the snippet is always the smallest thing that
 * works, not an abridged version of the demo beside it.
 *
 * Nothing here is part of the kit. It is page furniture, styled from the same
 * tokens so it follows the theme with everything else.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface DemoProps {
  /** Anchor id — the index at the top of the page links to it. */
  id: string;
  /** Component name, exactly as it is exported. */
  name: string;
  /** What it is built on: "Radix Popover", "No dependencies", … */
  meta: string;
  /** One line on what it is for. */
  summary: string;
  /** Import line, a blank line, then minimal usage. */
  code: string;
  /** The live component. Never a screenshot, never a still. */
  children: ReactNode;
  /** Put the code under the demo rather than beside it, for wide demos. */
  stacked?: boolean;
}

export function Demo({ id, name, meta, summary, code, children, stacked }: DemoProps) {
  return (
    <article
      id={id}
      // scroll-mt keeps the sticky header from covering the card title when
      // an in-page link jumps here.
      className="scroll-mt-24 overflow-hidden rounded-card border border-line bg-card"
    >
      <div className="border-b border-line px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 className="text-lead font-semibold tracking-tight text-ink">{name}</h3>
          <span className="rounded-btn bg-accent-tint px-2 py-0.5 text-nano font-semibold tracking-wider text-accent uppercase">
            {meta}
          </span>
        </div>
        <p className="mt-1.5 max-w-prose text-body leading-relaxed text-ink-2">{summary}</p>
      </div>

      {/* gap-px over a line-coloured background draws the divider between the
          two halves without a border that has to know which side it is on. */}
      <div className={cn("grid gap-px bg-line", !stacked && "lg:grid-cols-2")}>
        <div className="min-w-0 bg-card p-5">{children}</div>
        <div className="min-w-0 bg-surface">
          <CodeBlock code={code} label={name} />
        </div>
      </div>
    </article>
  );
}

function CodeBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked (insecure origin, denied permission). The code is
      // selectable text either way, so there is nothing to recover from.
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* The copy button sits in its own bar rather than floating over the
          code: an import line long enough to need horizontal scrolling would
          otherwise run underneath it. */}
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-2">
        <span className="font-mono text-nano text-ink-3">tsx</span>
        <button
          type="button"
          onClick={copy}
          className="w-20 shrink-0 cursor-pointer rounded-btn border border-line bg-card py-1 text-nano font-semibold tracking-wider text-ink-2 uppercase transition-colors hover:border-ink-3 hover:text-ink"
        >
          {/* The label doubles as the confirmation, so it is announced rather
              than only shown. */}
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
          <span className="sr-only"> {label} snippet</span>
        </button>
      </div>
      <pre className="flex-1 overflow-x-auto p-5 text-ui leading-relaxed text-ink-2">
        <code className="font-mono">{code.trim()}</code>
      </pre>
    </div>
  );
}

/**
 * A labelled control, for the demos that predate the kit's own `Field`. The
 * `htmlFor` must match the control's `id` — every trigger in the kit takes one
 * and puts it on the real focusable element, so clicking the label opens the
 * thing.
 *
 * Named `DemoField` rather than `Field` on purpose: `@/components/ui/Field` is
 * the real one, it wires description and error ids as well as the label, and
 * two things called `Field` in one page is a trap. If you are copying anything
 * out of this page, copy that one.
 *
 * `className` carries the width; it is not merged with a default, because
 * `cn()` is a join and not tailwind-merge (see src/lib/cn.ts) and two
 * competing `max-w-*` utilities would be settled by stylesheet order rather
 * than by the order they are written in.
 */
export function DemoField({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-ui font-medium text-ink">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-nano text-ink-3">{hint}</p> : null}
    </div>
  );
}

/**
 * The state the demo is holding, printed. Half the reason to try a date picker
 * is to find out what shape it hands back.
 */
export function Readout({ label = "value", children }: { label?: string; children: ReactNode }) {
  return (
    <p className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-line pt-3 text-nano text-ink-3">
      <span className="font-semibold tracking-wider uppercase">{label}</span>
      <code className="font-mono text-ui text-ink-2">{children}</code>
    </p>
  );
}
