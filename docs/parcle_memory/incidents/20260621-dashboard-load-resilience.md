# Incident: "Unable to load dashboard data"

- **Date:** 2026-06-21
- **Area:** `frontend/src/views/Dashboard.jsx`
- **Status:** Remediated

## Summary

The Dashboard showed a single generic banner — *"Unable to load dashboard
data"* — whenever any one of its four startup requests failed. The widgets are
loaded together, and the original implementation used `Promise.all()`, which
rejects as soon as the first promise rejects. A failure in any single endpoint
(`/employees/`, `/leaves/summary`, `/salary/summary`, `/salary/`) therefore
blanked the entire dashboard and hid which endpoint actually failed.

## Root cause

`Promise.all()` is all-or-nothing. One failing widget (auth header loss, bad
`VITE_API_URL`, backend unavailability, CORS, or a single 5xx) caused the whole
load to reject and surface only the fallback message.

## Fix

`loadDashboard()` now uses `Promise.allSettled()`:

- Each widget is loaded independently; a fulfilled request updates its own
  state slice regardless of sibling failures.
- The salary summary and salary records requests share one `YYYY-MM` `month`
  value so both always describe the same period.
- Failures are collected and surfaced with the exact failing endpoint label
  (e.g. *"Unable to load: leave summary (...)"*) and logged to the console via
  `console.error`, instead of a single opaque message.

No backend change was required — the endpoints, auth, and CORS config were
already correct. The authenticated shared Axios instance from `AuthContext`
(`api`) was already in use and attaches the `Authorization: Bearer` header.

## Verification notes

Automated test execution (`python -m pytest`) was blocked by the headless
execution environment's permission policy, so backend tests could not be run in
this session. The change is frontend-only and additive; existing backend
country-code tests under `backend/tests/test_employee_country_code.py` remain
unchanged. The country-code field was confirmed already present end-to-end
(model, schema, employees router, `EmployeeList.jsx`, and tests).
