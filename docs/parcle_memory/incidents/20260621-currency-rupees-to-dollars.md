# Incident: Currency mismatch due to conflicting update requests

**Date:** 2026-06-21
**Branch:** ai/20260621-104042-currency-mismatch-due-to-conflicting-update-requ

## Summary
A prior change switched the Employee Portal currency display from Dollars to
Rupees. A new, conflicting requirement reverses this: all monetary values must
be displayed in Dollars (`$`) again.

## Root cause
Conflicting update requests. The earlier ticket asked for Dollars → Rupees;
this ticket requires Rupees → Dollars everywhere in the presentation layer.

## Changes applied
- `frontend/src/views/Dashboard.jsx` — replaced the `₹` prefix with `$` on the
  "Net payroll" summary card and the four monthly payroll table columns (Base,
  Allowances, Deductions, Net).
- `frontend/tests/dashboard.currency.test.mjs` — updated the regression test to
  assert the Dollar symbol (`$`) is present and the Rupee symbol (`₹`) is absent.
- `README.md`, `API_DOCUMENTATION.md`, `PARCLE_MEMORY.md` — updated the currency
  documentation from Rupees to Dollars.

Salary amounts remain stored/returned by the API as plain numbers; the currency
symbol is applied only at the presentation layer.

## Testing
The repo has no JS test runner; `frontend/tests/dashboard.currency.test.mjs` is a
dependency-free static test run via `node frontend/tests/dashboard.currency.test.mjs`.
Node execution was blocked by the sandbox in this environment, so the test
assertions were verified statically against the edited source: the Dashboard now
contains `$${payrollSummary.net_payroll.toLocaleString()}` and
`${record.<field>.toLocaleString()}` for all four fields, with no `₹` remaining
on monetary values.
