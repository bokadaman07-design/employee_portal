# Incident: Sign out confirmation appears in top-right instead of centered

Date: 2026-06-21

## Summary

The sign out confirmation dialog (route `/`, opened by the header "Sign out"
button) rendered in the top-right corner of the page instead of being
centered in the middle of the viewport, hurting the user experience.

## Root cause

The confirmation dialog in `frontend/src/components/Navbar.jsx` used
`fixed inset-0 flex items-center justify-center` to center an overlay on the
viewport. However, the dialog was rendered **inside** the `<header>`, which
carries the `backdrop-blur` utility (CSS `backdrop-filter`).

A non-`none` `backdrop-filter` (like `transform`, `filter`, `perspective`,
etc.) establishes a containing block for `position: fixed` descendants. As a
result, the overlay was positioned relative to the short, full-width header
bar at the top of the page rather than the viewport — so `inset-0` and the
flex centering resolved to the top of the page, pushing the dialog to the
top/top-right instead of the page center.

A secondary issue was found on the trigger button: it had leftover duplicate
`onClick`/`className` attributes, including a stale `onClick={logout}` that
would have logged the user out without confirmation (JSX keeps only the last
duplicate attribute, but the markup was invalid/misleading).

## Remediation

Edited `frontend/src/components/Navbar.jsx`:

- Render the confirmation dialog through `createPortal(..., document.body)`
  (imported from `react-dom`). This moves the `fixed inset-0` overlay out of
  the `backdrop-blur` header's containing block so it centers on the
  viewport.
- Removed the duplicate/stale attributes on the sign out trigger button,
  leaving a single `onClick={() => setConfirmOpen(true)}` and one
  `className`.

No backend, auth, or session logic was changed. `AuthContext.logout` remains
the single place that clears the session, invoked only via
`handleConfirmSignOut`.

## Tests

The frontend has no JS test runner configured; the repo uses dependency-free
static assertion scripts run with `node`. Extended
`frontend/tests/navbar.signout.test.mjs` with regression checks that:

- the dialog is rendered via `createPortal` into `document.body`;
- the overlay still uses `fixed inset-0 ... flex items-center justify-center`
  to center its contents;
- the sign out button has no leftover `onClick={logout}` handler.

Note: in this execution environment `node` could not be invoked to run the
suite (sandbox denied process execution), so the assertions were verified by
inspecting the regex patterns against the final source. The existing
confirmation-guard assertions remain unchanged and continue to pass by
construction.

## Behaviour notes

- Scope limited to `Navbar.jsx` and its regression test.
- No Tailwind config or `index.css` change was required; the centering
  utilities already existed and now apply against the viewport.
