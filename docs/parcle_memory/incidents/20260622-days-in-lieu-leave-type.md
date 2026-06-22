# Incident: 'Days in Lieu' option missing from leave types

Date: 2026-06-22
Ticket: 7fa91daa-c489-4bce-a72a-994e66891a6e

## Summary

The Leave Tracker's "Type" `<select>` offered only `Annual`, `Sick`,
`Personal`, and `Unpaid`. Users could not record a "Days in Lieu" leave
request from the UI. The desired behaviour is for "Days in Lieu" to be a
selectable leave type alongside the existing options.

## Root cause

The leave-type option list in `frontend/src/views/LeaveTracker.jsx` was
incomplete — it simply omitted a "Days in Lieu" `<option>`. The backend
`leave_type` field is a free-form string (`schemas.py` `LeaveBase.leave_type`
is `str = Field(..., min_length=1, max_length=80)` with no `Literal`
constraint), so the backend already accepted any leave type and required no
change to allow the value.

## Remediation

- `frontend/src/views/LeaveTracker.jsx` — added `<option>Days in Lieu</option>`
  to the leave-type `<select>` in the submit form.
- `API_DOCUMENTATION.md` — documented that `leave_type` is a free-form string
  and listed the UI-offered choices, now including `Days in Lieu`.
- No backend schema/router change was required because `leave_type` is
  unconstrained free-form text; "Days in Lieu" was already accepted.

## Tests

Added `backend/tests/test_leave_days_in_lieu.py`, using an isolated in-memory
SQLite database and an overridden auth dependency to exercise the real
router/schema/model code paths:

- create a leave request with `leave_type` of "Days in Lieu" (accepted, 201)
- the value round-trips through list and persists in the database
- parametrized regression covering Annual, Sick, Personal, Unpaid, and
  Days in Lieu all remaining valid

### Test execution note

The remediation environment blocks local Python execution (the interpreter and
`pytest` return "permission denied" for any invocation, including with the
sandbox disabled), so the suite could not be executed here. It follows the same
FastAPI `TestClient` pattern as the existing `backend/tests/` files and is
runnable with:

```
cd backend && pip install -r requirements.txt && python -m pytest tests/
```
