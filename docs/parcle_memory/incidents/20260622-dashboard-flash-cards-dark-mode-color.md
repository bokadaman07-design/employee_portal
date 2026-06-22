# Incident: Dashboard flash cards lose their accent color in dark mode

**Date:** 2026-06-22
**Branch:** ai/20260622-140422-the-dashboard-flash-cards-are-not-displaying-col
**Ticket:** produck_tickets/b7741f4b-c248-484e-ad31-ba889e400aa5

## Reported request
On the `/` (Dashboard) route, the flash/stat cards (Employees, Pending leave,
Payroll records, Net payroll) do not display their colored left accent when the
app is in dark mode.

## Root cause
`frontend/src/components/Card.jsx` renders the card with both the dark border
utility and a single-class accent:

```
className={`... border-l-4 dark:border-edge dark:bg-panel ${accentClass}`}
```

where `accentClass` was `border-l-pine` / `border-l-coral` / `border-l-gold`
(base, non-dark utilities).

In dark mode Tailwind applies `dark:border-edge`, which compiles to a compound
selector `.dark .border-edge { border-color: #2c3733 }` with specificity
(0,2,0). The accent classes compile to a plain `.border-l-pine`
(`border-left-color`) with specificity (0,1,0). Because the compound dark
selector has higher specificity, the all-sides `border-color` wins over the
left accent **regardless of source order**, so the colored edge is repainted
with the neutral `edge` color and the accent disappears.

The `ink` accent did not exhibit the bug only because it already carried a
`dark:border-l-fog` variant — a dark-layer rule at matching specificity that
Tailwind orders after `border-color`.

## Fix
`frontend/src/components/Card.jsx` — give every accent a matching `dark:`
left-border variant so each accent is emitted in the dark layer at the same
specificity as `dark:border-edge`. Tailwind orders the `border-left-color`
utilities after the `border-color` utility within that layer, so the accent now
wins in dark mode:

```
pine:  "border-l-pine dark:border-l-pine",
coral: "border-l-coral dark:border-l-coral",
gold:  "border-l-gold dark:border-l-gold",
ink:   "border-l-ink dark:border-l-fog",   // unchanged
```

The change is scoped to the shared `Card` component, so every card that uses an
accent (the Dashboard flash cards and any future cards) is fixed at once.
`Dashboard.jsx`, `index.css`, and `tailwind.config.js` were inspected and
needed no changes — the palette colors and dark surfaces were already defined
correctly.

## Validation
The frontend has no test runner configured (`frontend/package.json` exposes only
`dev`/`build`/`preview`, and no `*.test.jsx` files exist), so no automated test
was added. Attempts to run `npm run dev` / `npx tailwindcss` and `git status`
were blocked by the sandbox/permission policy in this environment. The fix was
verified by static analysis of CSS selector specificity and Tailwind's
dark-variant emission order as described above.
