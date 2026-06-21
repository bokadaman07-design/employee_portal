# Incident: Leave category indicators invisible in dark mode

Date: 2026-06-21

Ticket: 86310933-d809-4eb9-bd24-0fccaff1fa59

## Summary

A user reported (Produck feedback, route `/`, selector
`#root > div > div > main`) that "when in darkmode those colors for
employees leave etc are not visible." The leave status indicators on the
Leave Tracker became indistinguishable when the browser/OS was set to a
dark color scheme.

## Root cause

The frontend uses TailwindCSS 3 with its **default `darkMode: "media"`
strategy** (no explicit value in `frontend/tailwind.config.js`). Under that
strategy, `dark:` variants activate automatically when the OS reports
`prefers-color-scheme: dark`. However, the codebase contained **zero**
`dark:` classes, and `frontend/src/index.css` hardcodes a light body
(`background: #f6f7f4; color: #17211f;`).

The leave status indicator badge in `frontend/src/views/LeaveTracker.jsx`
used a low-contrast neutral chip — `bg-mist` (#f6f7f4, near-white) with
`text-ink/70` (near-black text). On a browser-darkened page this chip lost
all contrast and effectively disappeared. It also never encoded the status
by color, so Pending/Approved/Rejected were visually identical.

A secondary instance: the "Total" summary card accent used `border-l-ink`
(#17211f, near-black) in `frontend/src/components/Card.jsx`, which vanishes
against dark backgrounds.

## Remediation

Scope was kept minimal and limited to the leave indicators flagged by the
user.

1. Added `frontend/src/utils/leaveStatus.js` — a small pure helper
   `leaveStatusBadgeClass(status)` that maps each leave status to a solid,
   status-coded badge class:
   - `Pending` → `bg-gold text-white dark:bg-gold/90`
   - `Approved` → `bg-pine text-white dark:bg-pine/90`
   - `Rejected` → `bg-coral text-white dark:bg-coral/90`
   - unknown → `bg-ink text-white dark:bg-white/15 dark:text-mist`

   Solid fills with white text are legible on **any** surface — light
   cards, dark cards, or a browser/OS-darkened page — so the indicator
   stays visible regardless of the active color scheme, and the color now
   communicates the status.

2. `frontend/src/views/LeaveTracker.jsx` — the status `<span>` now uses
   `leaveStatusBadgeClass(leave.status)` instead of the hardcoded
   `bg-mist ... text-ink/70` chip.

3. `frontend/src/components/Card.jsx` — the `ink` accent gained a
   dark-mode override: `border-l-ink dark:border-l-mist`, so the "Total"
   leave summary card's accent stays visible in dark mode.

The class strings are written as complete literals inside files covered by
the Tailwind `content` glob (`./src/**/*.{js,jsx}`), so the JIT compiler
detects and emits them; no safelist change was required.

## Tests

The frontend previously had no JS test runner. Added a dependency-free
regression test using Node's built-in test runner:

- `frontend/src/utils/leaveStatus.test.js` — asserts that each known status
  maps to a distinct class, that every status (including the default
  fallback) carries a `dark:` variant and a `text-` color, and that known
  statuses resolve to their mapping while unknown statuses fall back safely.
- Added a `test` script to `frontend/package.json`
  (`node --test src/`).

Run with `npm test` from `frontend/`. (Note: in the remediation
environment, Node execution beyond `--version` was blocked by sandbox
permission rules, so the suite was authored but could not be executed
here; it is self-contained and runnable locally/CI.)

## Verification plan

At `http://localhost:5173/` on the Leave Tracker (`/leaves`):
- In light mode, Pending/Approved/Rejected badges render gold/green/coral
  with white text and the Total card shows its ink accent.
- Toggle the OS/browser to dark mode (`prefers-color-scheme: dark`) and
  confirm all status badges and the Total card accent remain clearly
  visible and color-distinct.

## Behaviour notes

- Scope is limited to leave status indicators and the ink card accent.
- No backend, API, auth, or data logic was touched.
- No full dark-theme palette was introduced; this fix only ensures the
  flagged indicators stay legible under the existing media-based dark mode.
