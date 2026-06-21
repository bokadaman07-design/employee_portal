# Incident: Country code field not properly handled on Employee screens

Date: 2026-06-21

## Summary

The Employee Registration and Employee Edit screens did not support a
dedicated country code. Phone numbers were stored as a single free-text
field, and there was no separate, nullable `country_code` value. The desired
behaviour is:

- New employees can be registered with an optional country code.
- The existing `phone` field behaviour is preserved.
- Existing employees that never had a country code keep `country_code` as
  `null` (it is not back-filled or coerced to an empty string).

## Root cause

There was no `country_code` field anywhere in the stack (model, schema, API,
or UI), so the value could never be captured or preserved. For legacy rows the
value must remain `null` rather than being invented.

## Remediation

Added a separate, nullable `country_code` field end to end:

- `backend/models.py` — new `country_code` column, `String(10)`, nullable.
- `backend/schemas.py` — `country_code` added to `EmployeeBase` and
  `EmployeeUpdate` (default `None`, `max_length=10`). Because `EmployeeUpdate`
  uses `model_dump(exclude_unset=True)` in the router, editing unrelated fields
  never touches `country_code`, so legacy rows stay `null`.
- `frontend/src/views/EmployeeList.jsx` — new "Country code" input on the
  add/edit form; `startEdit` populates it from `employee.country_code`; the
  submit payload sends `country_code: form.country_code || null` so a blank
  field is persisted as `null`, mirroring the existing phone handling.
- `API_DOCUMENTATION.md` and `docs/parcle_memory/API_DOCUMENTATION.md` —
  documented the new optional, nullable field and its null-preservation
  semantics.

## Behaviour notes

- `phone` and `country_code` are independent; either can be `null`.
- Omitting `country_code` on create, or sending `null`, stores `null`.
- A blank country code in the UI is submitted as `null`, not `""`.

## Tests

Added `backend/tests/test_employee_country_code.py` (with `pytest` + `httpx`
added to `backend/requirements.txt`). It uses an isolated in-memory SQLite
database and overrides the auth dependency to exercise the real
router/schema/model code paths:

- create with / without / explicit-null country code
- phone remains optional and independent (regression)
- editing unrelated fields keeps a legacy employee's `country_code` null
- editing can set, change, or clear the country code
- persistence is verified directly against the database

### Test execution note

The remediation environment blocks local Python execution (the interpreter
returns "permission denied" for any invocation, including with the sandbox
disabled), and FastAPI/SQLAlchemy are not importable from the harness. The
test suite therefore could not be executed here. It is written against the
standard FastAPI `TestClient` pattern already implied by the project's
Dockerfile (Python 3.12) and is runnable with:

```
cd backend && pip install -r requirements.txt && python -m pytest tests/
```
