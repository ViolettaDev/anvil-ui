"use client";

/**
 * Button and Link — the two things a click can mean.
 *
 * They are demoed together because the choice between them is the whole point:
 * a button DOES something on the page, a link GOES somewhere. Space activates a
 * button, Enter activates a link, assistive tech announces them differently, and
 * a middle click only opens a new tab on the one that is really an anchor. So
 * the kit ships `Button` (a real `<button>`), `ButtonLink` (an `<a>` wearing the
 * same clothes) and `Link` (an inline anchor in prose) instead of one component
 * with a prop that changes which it is.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button, ButtonLink, type ButtonVariant } from "@/components/ui/Button";
import { Link } from "@/components/ui/Link";
import { Icon } from "@/components/ui/Icon";
import { Demo } from "@/components/site/Demo";

/* ── Button ───────────────────────────────────────────────────────────────── */

const BUTTON_CODE = `
import { Button, ButtonLink } from "@/components/ui/Button";

// type defaults to "button", not "submit": a bare
// button dropped into a form should not post it.
<Button onClick={save}>Save changes</Button>

<Button variant="secondary" size="sm">Cancel</Button>
<Button variant="danger" onClick={remove}>Delete</Button>

// Keeps the label mounted and the width steady, and
// announces itself with aria-busy.
<Button loading>Saving…</Button>

// Navigates? Then it is an anchor, not a button.
<ButtonLink href="/pricing" variant="secondary">
  See pricing
</ButtonLink>
`;

const VARIANTS: { variant: ButtonVariant; label: string }[] = [
  { variant: "primary", label: "Primary" },
  { variant: "secondary", label: "Secondary" },
  { variant: "ghost", label: "Ghost" },
  { variant: "danger", label: "Danger" },
];

/** The uppercase caption every group of samples below is filed under. */
function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-nano font-semibold tracking-wider text-ink-3 uppercase">{children}</p>
  );
}

export function ButtonDemo() {
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function save() {
    setSaving(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setSaving(false);
      toast.success("Changes saved");
    }, 1400);
  }

  return (
    <Demo
      id="button"
      name="Button"
      meta="No dependencies"
      summary="Four intents, three sizes, and a loading state that keeps the label mounted so the button does not resize under the pointer mid-click. No asChild — when the thing navigates, ButtonLink renders a real anchor instead of teaching a button to lie."
      code={BUTTON_CODE}
      stacked
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <GroupLabel>variant</GroupLabel>
          <div className="flex flex-wrap gap-2.5">
            {VARIANTS.map((item) => (
              <Button
                key={item.variant}
                variant={item.variant}
                onClick={() => toast(`${item.label} pressed`)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <GroupLabel>size</GroupLabel>
          {/* items-center, so the three heights are visibly different rather
              than three boxes sharing a baseline. */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="secondary" size="sm">
              Small
            </Button>
            <Button variant="secondary" size="md">
              Medium
            </Button>
            <Button variant="secondary" size="lg">
              Large
            </Button>
          </div>
        </div>

        <div>
          <GroupLabel>loading and disabled</GroupLabel>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button loading={saving} onClick={save}>
              Save changes
            </Button>
            <Button variant="secondary" loading>
              Always busy
            </Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
          </div>
          <p className="mt-2 max-w-prose text-nano text-ink-3">
            Press Save: it disables itself while busy, and the label stays in the accessible name
            instead of being swapped for the word “Loading”.
          </p>
        </div>

        <div>
          <GroupLabel>ButtonLink — same clothes, real anchor</GroupLabel>
          <div className="flex flex-wrap items-center gap-2.5">
            <ButtonLink href="#top">Back to the top</ButtonLink>
            <ButtonLink href="https://violettadev.com" target="_blank" rel="noopener noreferrer" variant="secondary">
              Open the studio
              <Icon name="chevR" size={16} />
            </ButtonLink>
          </div>
          <p className="mt-2 max-w-prose text-nano text-ink-3">
            Middle-click either one: they open in a new tab, because they are links. The buttons
            above cannot, and no amount of styling makes them.
          </p>
        </div>
      </div>
    </Demo>
  );
}

/* ── Link ─────────────────────────────────────────────────────────────────── */

const LINK_CODE = `
import { Link } from "@/components/ui/Link";

<p>
  Read the <Link href="/docs">documentation</Link>, or
  browse the <Link href="https://github.com/…" external>
    source
  </Link>.
</p>

// Body-coloured, underline kept: colour alone is not
// an accessible way to mark a link.
<Link href="/legal/terms" subtle>Terms</Link>

// It is a plain <a>: for client-side navigation wrap
// it in next/link, which owns routing, not styling.
`;

export function LinkDemo() {
  return (
    <Demo
      id="link"
      name="Link"
      meta="No dependencies"
      summary="An inline anchor for prose. external is opt-in rather than sniffed from the href, and adds three things at once: rel=noopener noreferrer, a visible arrow, and the sr-only phrase that tells a screen-reader user what the arrow is telling everyone else."
      code={LINK_CODE}
    >
      <p className="max-w-prose text-body leading-relaxed text-ink-2">
        Every component on this page is MIT licensed — read the{" "}
        <Link href="#top">licence summary</Link>, copy the files you want, and delete the rest. The
        pickers were written for the{" "}
        <Link href="https://violettadev.com" external>
          templates we sell
        </Link>{" "}
        before they were pulled out into this kit.
      </p>

      <div className="mt-5">
        <GroupLabel>subtle</GroupLabel>
        <p className="max-w-prose text-body leading-relaxed text-ink-2">
          For footers and dense chrome, where a page full of accent-coloured links is noise:{" "}
          <Link href="#top" subtle>
            Terms
          </Link>
          ,{" "}
          <Link href="#top" subtle>
            Privacy
          </Link>
          ,{" "}
          <Link href="https://violettadev.com" subtle external>
            Status
          </Link>
          . The underline stays either way.
        </p>
      </div>

      <p className="mt-5 max-w-prose text-nano text-ink-3">
        Tab through them: the focus ring is the global one, and an external link announces “opens in
        a new tab” after its label rather than leaving the arrow to carry the warning alone.
      </p>
    </Demo>
  );
}
