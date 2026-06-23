# Incident: Refresh button color does not change based on the mode

Date: 2026-06-23

## Summary

The Dashboard "Refresh" button (route `/`, top-right of the page header) was
reported as not changing color between light and dark mode. The button and its
`RefreshCw` icon should be black in light mode and white in dark mode.

## Root cause

The refresh button in `frontend/src/views/Dashboard.jsx` was styled with the
design tokens `text-ink dark:text-fog`. These tokens are near-black (#17211f)
and near-white (#e7ebe6) respectively, so the color *did* technically adapt to
the theme, but the muted tones did not read as a clear black/white swap. The
ticket explicitly requested true black/white classes on the control.

## Remediation

Changed the refresh button text/icon color classes from
`text-ink dark:text-fog` to `text-black dark:text-white` in
`frontend/src/views/Dashboard.jsx`. The `RefreshCw` icon (lucide-react)
inherits `currentColor`, so the icon follows the button's text color
automatically — no SVG fill/stroke override was needed.

- `frontend/src/views/Dashboard.jsx` — refresh button class
  `text-ink dark:text-fog` → `text-black dark:text-white`.

## Behaviour notes

- Scope is limited to the refresh button's text/icon color classes.
- No backend APIs or data-loading logic were touched; this is frontend-only.
- `text-black`/`text-white` are Tailwind built-ins, so no
  `frontend/tailwind.config.js` or `index.css` change was required.
- Dark mode is driven by the `dark` class on `<html>` (see
  `frontend/src/hooks/useTheme.js`), which Tailwind's `dark:` variant targets.

## Pattern: applying light/dark color to buttons and icons

- Put the theme-aware color on the element with `text-<color> dark:text-<color>`.
- lucide-react icons render with `stroke="currentColor"`, so they inherit the
  parent's text color — no per-icon class is needed. Example:

  ```jsx
  <button className="text-black dark:text-white">
    <RefreshCw size={16} />
    Refresh
  </button>
  ```

## Tests

The frontend has no JavaScript test framework configured (`package.json`
defines only `dev`/`build`/`preview` scripts). The change is a single
Tailwind utility-class swap with no behavioral logic, so no automated test
was added. Verification is visual: on route `/`, toggle the theme and confirm
the refresh button text and icon render black in light mode and white in dark
mode.
