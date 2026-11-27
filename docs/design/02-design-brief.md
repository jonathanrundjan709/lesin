# 2. Design brief
**Problem.** Parents can't compare nearby tutors or trust strangers; tutors have no storefront.
**Codebase check.** Next.js 15 + Tailwind, no component library. Shared utilities in `globals.css` (`btn`, `panel`, `field`, `tag`). No tokens yet → step 4 creates them.

**Principles**
1. *One screen, one job.* Parent: choose tutors. Tutor: spend a lead. Never both.
2. *Make the cost visible before the click.* "1 lead" on the button; slots left; balance always on screen.
3. *Trust in plain words.* Say what is hidden and why, once, near the list.
4. *Thumb first.* Primary action reachable bottom-right; 44 px targets; no hover-only information.
5. *Quiet UI.* One accent, system font, borders not shadows, no decoration without function.

**Tone.** Calm, direct, respectful. Short sentences. No emoji, no exclamation marks.

**Visual direction.** Warm-neutral canvas, white surfaces, 1 px borders, one teal accent for primary actions and selection only. Type scale 12/14/16/20/24. Numbers (rates, balance) are the boldest thing on a row.

**Must-have states.** Loading, empty, error, selected, disabled, full, pending payment, success.
**Accessibility.** WCAG AA contrast, visible focus, labelled controls, `aria-live` for results/status, reduced-motion safe, no colour-only meaning.
**Not doing.** Hero banners, avatars/photos (hidden by design), gradients, rating stars as decoration.
