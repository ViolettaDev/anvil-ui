"use client";

/**
 * Reveal and Stagger.
 *
 * Both paint their hidden state on the FIRST render — identical on the server
 * and in the browser — and only reveal from an IntersectionObserver created in
 * an effect. That is the whole trick: reading `useReducedMotion()` or
 * `matchMedia` to choose the initial markup is a hydration mismatch that
 * type-checks, lints, passes tests and then breaks in a browser.
 *
 * Because of that, scrolling past is what normally triggers them, which is
 * awkward to show on a page you have already scrolled. The Replay button
 * remounts the block with a new key so the entrance runs again on demand.
 */

import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import { Button } from "@/components/ui/Button";
import { Demo } from "@/components/site/Demo";

const REVEAL_CODE = `
import { Reveal } from "@/components/ui/Reveal";

// delay and duration are MILLISECONDS, not the
// seconds a motion library would take.
<Reveal as="section" delay={80}>
  <h2>Everything ships in the box</h2>
</Reveal>
`;

const STAGGER_CODE = `
import { Stagger, StaggerItem } from "@/components/ui/Stagger";

// One observer on the container; the items sequence
// with transition-delay. Indices are filled in for
// direct children, so this takes no props at all.
<Stagger className="grid gap-4 sm:grid-cols-3" gap={90}>
  {plans.map((plan) => (
    <StaggerItem key={plan.id}>
      <Card plan={plan} />
    </StaggerItem>
  ))}
</Stagger>
`;

export function RevealDemo() {
  const [nonce, setNonce] = useState(0);

  return (
    <Demo
      id="reveal"
      name="Reveal"
      meta="No dependencies"
      summary="An IntersectionObserver and two CSS classes. No animation runtime is shipped to the browser, the hidden state is opacity only so the content stays focusable and in the accessibility tree, and globals.css force-shows anything marked data-reveal under reduced motion or with JavaScript off."
      code={REVEAL_CODE}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={() => setNonce((n) => n + 1)}>
          Replay
        </Button>
        <p className="text-nano text-ink-3">Remounts the block below.</p>
      </div>

      <div className="mt-4 space-y-3">
        <Reveal key={`a${nonce}`} className="rounded-btn border border-line bg-surface p-4">
          <p className="text-ui font-medium text-ink">Fades and lifts on entry.</p>
          <p className="mt-1 text-nano text-ink-3">delay 0ms</p>
        </Reveal>
        <Reveal
          key={`b${nonce}`}
          delay={160}
          className="rounded-btn border border-line bg-surface p-4"
        >
          <p className="text-ui font-medium text-ink">Same thing, later.</p>
          <p className="mt-1 text-nano text-ink-3">delay 160ms</p>
        </Reveal>
      </div>
    </Demo>
  );
}

const PLANS = [
  { id: "solo", name: "Solo", price: "$0", note: "One calendar" },
  { id: "studio", name: "Studio", price: "$18", note: "Five calendars" },
  { id: "agency", name: "Agency", price: "$49", note: "Unlimited" },
];

export function StaggerDemo() {
  const [nonce, setNonce] = useState(0);

  return (
    <Demo
      id="stagger"
      name="Stagger"
      meta="No dependencies"
      summary="The same observer, shared. Nine cards in a grid should not mean nine observers, and they should start together relative to the grid rather than each on its own crossing — so the container is what gets watched and the items sequence on transition-delay."
      code={STAGGER_CODE}
      stacked
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={() => setNonce((n) => n + 1)}>
          Replay
        </Button>
        <p className="text-nano text-ink-3">
          A StaggerItem rendered outside a Stagger starts visible — content is never stranded
          because a container was refactored away.
        </p>
      </div>

      <Stagger key={nonce} gap={90} className="mt-4 grid gap-3 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <StaggerItem key={plan.id} className="rounded-btn border border-line bg-surface p-4">
            <p className="text-nano font-semibold tracking-wider text-ink-3 uppercase">
              {plan.name}
            </p>
            <p className="mt-1 text-lead font-semibold text-ink">{plan.price}</p>
            <p className="text-nano text-ink-3">{plan.note}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </Demo>
  );
}
