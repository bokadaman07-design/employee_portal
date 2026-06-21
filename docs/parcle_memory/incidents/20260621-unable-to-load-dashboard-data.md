# Incident: "Unable to load dashboard data"

Date: 2026-06-21

## Summary

The Employee Portal dashboard could show "Unable to load dashboard data" and
leave the user stuck on that screen. The hypothesised causes were poor frontend
error handling, unstable backend summary payloads, and expired/invalid JWTs.

## Investigation

Most of the surface area was already remediated in the working tree:

- `frontend/src/views/Dashboard.jsx` already loads the four dashboard endpoints
  with `Promise.allSettled`, so a single failing call no longer blanks the whole
  page. Each section falls back to a safe default (zeroed summaries / empty
  lists) and the banner names exactly which dataset failed. A "Refresh" button
  re-runs `loadDashboard`, providing the recoverable retry path.
- Backend summary endpoints already return stable defaults:
  `GET /leaves/summary` computes counts and defaults missing statuses to `0`;
  `GET /salary/summary` uses `func.coalesce(..., 0)` so an empty month returns
  zeros rather than `null`.

## Root cause (remaining gap)

The expired/invalid-JWT path was not handled. When a token expired *after*
login, protected dashboard calls returned `401`, but there was no axios response
interceptor to clear the session. The user was left on the dashboard seeing only
the generic error instead of being returned to sign-in. The API documentation
already claimed "AuthContext will sign the user out" on `401`, but no code
implemented that behaviour.

## Remediation

- `frontend/src/context/AuthContext.js` — added an axios response interceptor
  that, on a `401` from an authenticated request (guarded by the presence of a
  `token`, so login failures are unaffected), clears `token`/`user` and the
  persisted user. `ProtectedRoute` then redirects to `/signin`. The interceptor
  is registered/ejected per `token` change to avoid duplicate handlers and stale
  closures. This makes the runtime behaviour match the documented contract.

## Behaviour notes

- A `401` on the `/auth/login` request itself does not trigger logout, because
  `token` is null at that point; bad-credential errors still surface normally.
- Partial dashboard failures (e.g. only payroll summary down) still render the
  rest of the dashboard with a specific banner; only `401` triggers sign-out.

## Tests

Frontend has no test harness configured (`frontend/package.json` defines no test
runner), so no automated frontend test was added. The backend country-code
suite in `backend/tests/test_employee_country_code.py` remains the regression
coverage for the employee/country-code path.

### Test execution note

Local code execution is blocked in this remediation environment (Python and
Node invocations return "permission denied"), so the backend pytest suite and a
frontend syntax check could not be run here. The change is a small, isolated
axios interceptor reviewed by inspection.
