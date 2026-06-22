# Incident: Split phone number field into country code + phone (already implemented)

**Date:** 2026-06-22
**Branch:** ai/20260622-094438-the-phone-number-field-in-the-employee-form-is-n
**Ticket:** produck_tickets/2e1d8b2f-0369-4fd5-94ed-d2e2889e9980

## Reported request
User feedback on `/employees`: "The phone number is a single field. Would be
better if it was 2 separate fields. One for country code and one for the actual
phone number."

## Investigation outcome
No automated code change was made because the requested behaviour is **already
fully implemented** across every layer of the application. The single phone
field has already been split into a dedicated `country_code` field plus the
`phone` field.

### Evidence (current working tree)
- **Model** — `backend/models.py:40-41`
  `phone: Mapped[str | None]` and `country_code: Mapped[str | None]` exist as
  separate nullable columns on `Employee`.
- **Schemas** — `backend/schemas.py:30-31` (`EmployeeBase`) and
  `backend/schemas.py:45-46` (`EmployeeUpdate`) expose both `phone` (max 40) and
  `country_code` (max 10) as independent optional fields; `EmployeeOut` inherits
  them.
- **Router** — `backend/routers/employees.py` creates/updates employees via
  `payload.model_dump()`, so both fields are persisted without special handling.
- **Frontend** — `frontend/src/views/EmployeeList.jsx:165-172` renders two
  separate inputs: a "Country code" field (placeholder `e.g. +1`) and a "Phone"
  field, both wired through `form.country_code` / `form.phone` and submitted as
  separate keys (`EmployeeList.jsx:86`).
- **Tests** — `backend/tests/test_employee_country_code.py` provides regression
  coverage: creating with/without a country code, explicit null, phone remaining
  independent and optional, edit set/clear/untouched, and DB persistence.
- **Docs** — `API_DOCUMENTATION.md:75-95` documents `phone` and `country_code`
  as separate, independent, nullable fields with request/response examples.

## Why no change was safe or necessary
Making edits would be redundant and risk introducing regressions against an
already-correct, tested implementation. The acceptance criteria (separate
country code + phone fields, validated, persisted, documented, with regression
tests) are all met by the existing code.

## Validation
Attempted to run `backend/tests/test_employee_country_code.py`, but pytest
execution was blocked by the sandbox/permission policy in this environment. The
implementation was instead verified statically against the source files listed
above, all of which contain the required separate-field behaviour.
