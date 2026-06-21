# Incident: Inconsistent currency unit changes (reverting to Rupees)

**Date:** 2026-06-21
**Branch:** ai/20260621-105333-inconsistent-currency-unit-changes

## Summary
The currency unit displayed in the Employee Portal has been the subject of
several conflicting requests ("Ruppes" / "Rupees", then back to "dollors",
now "Rupess"). The latest requirement is to display all monetary values in
**Rupees** again, using the `₹` symbol. The misspelling "Rupess" is read as
**Rupees** (symbol `₹`).

## Root cause
Conflicting, inconsistently spelled update requests. A prior ticket switched
the display from Dollars → Rupees, a later ticket reverted Rupees → Dollars,
and this ticket reverts it once more to Rupees everywhere in the presentation
layer.

## Changes applied
- `frontend/src/views/Dashboard.jsx` — replaced the `$` prefix with `₹` on the
  "Net payroll" summary card and the four monthly payroll table columns (Base,
  Allowances, Deductions, Net).
- `frontend/tests/dashboard.currency.test.mjs` — updated the regression test to
  assert the Rupee symbol (`₹`) is present and the Dollar symbol (`$`) is absent
  on monetary values.
- `README.md`, `API_DOCUMENTATION.md`, `PARCLE_MEMORY.md` — updated the currency
  documentation from Dollars to Rupees.

Salary amounts remain stored/returned by the API as plain numbers; the currency
symbol is applied only at the presentation layer.

## Testing
The repo has no JS test runner; `frontend/tests/dashboard.currency.test.mjs` is a
dependency-free static test run via `node frontend/tests/dashboard.currency.test.mjs`.
Node execution was blocked by the sandbox in this environment, so the test
assertions were verified statically against the edited source: the Dashboard now
contains `₹${payrollSummary.net_payroll.toLocaleString()}` and
`₹{record.<field>.toLocaleString()}` for all four fields, with no `$` remaining
on monetary values.

## Note on spelling
The incident text used "Rupess", which is a misspelling. The implementation uses
the standard term **Rupees** and the `₹` symbol. No literal "Rupess" string is
introduced into the codebase, since the currency is represented by the symbol
only.
