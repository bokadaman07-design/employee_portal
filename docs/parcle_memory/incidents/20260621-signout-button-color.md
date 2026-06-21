# Incident: Sign out button color needs to be updated in the Navbar

Date: 2026-06-21

## Summary

The sign out button on the Employee Portal global header (route `/`,
selector `header > div > div:nth-of-type(2) > button`) used the dark
`bg-ink` color, the same neutral tone used for non-destructive UI. The
button needed a color that signals a destructive/exit action and matches
the product's existing convention.

## Root cause

The sign out button in `frontend/src/components/Navbar.jsx` was styled with
`bg-ink` (#17211f), which does not visually distinguish it as a
destructive/sign-out action. Across the app, the `coral` (#c85f4d) token is
the established destructive/action color (e.g. delete employee, reject
leave, error states in `EmployeeList.jsx`, `LeaveTracker.jsx`,
`Dashboard.jsx`, `SignIn.jsx`).

## Remediation

Changed the sign out button background from `bg-ink` to `bg-coral` in
`frontend/src/components/Navbar.jsx`. The white text (`text-white`) is
retained for contrast. No other classes, markup, or logic were altered.

- `frontend/src/components/Navbar.jsx` — sign out button class
  `bg-ink` → `bg-coral`.

## Behaviour notes

- Scope is limited to the sign out button's color class.
- No backend APIs, auth, or session logic were touched.
- The `coral` token already exists in `frontend/tailwind.config.js`, so no
  Tailwind config or `index.css` change was required.

## Tests

The frontend has no JavaScript test framework configured (`package.json`
defines only `dev`/`build`/`preview` scripts). The change is a single
Tailwind utility-class swap with no behavioral logic, so no automated test
was added. Verification is visual: on route `/` the sign out button renders
with the coral background.
