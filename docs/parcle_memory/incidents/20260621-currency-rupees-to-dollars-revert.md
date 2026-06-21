# Incident: Revert currency display from Rupees to Dollars

**Date:** 2026-06-21
**Branch:** ai/20260621-134353-the-repository-s-currency-denomination-was-previ

## Summary
A prior change switched the Employee Portal currency display from Dollars to
Rupees. A new, conflicting requirement reverses this: all monetary values must
be displayed in Dollars (`$`) again across the presentation layer.

## Root cause
Conflicting update requests. An earlier ticket changed Dollars → Rupees; this
ticket requires Rupees → Dollars everywhere monetary values are rendered.

## Changes applied
- `frontend/src/views/Dashboard.jsx` — replaced the `₹` prefix with `$` on the
  "Net payroll" summary card, the live salary preview (base + allowances −
  deductions and the net total), and the four monthly payroll table columns
  (Base, Allowances, Deductions, Net).
- `frontend/tests/dashboard.currency.test.mjs` — updated the regression test to
  assert the Dollar symbol (`$`) is present and the Rupee symbol (`₹`) is absent
  on monetary values.
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
