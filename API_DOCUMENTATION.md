# Employee Tracker API Documentation

Base URL: `http://localhost:8000`

Protected endpoints require:

```http
Authorization: Bearer <access_token>
```

## Health

### GET /health

Response:

```json
{
  "status": "healthy"
}
```

### GET /version

Response:

```json
{
  "version": "1.0.0"
}
```

## Authentication

### POST /auth/login

Content type: `application/x-www-form-urlencoded`

Request:

```text
username=admin&password=admin123
```

Response:

```json
{
  "access_token": "jwt-token",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "is_active": true
  }
}
```

### GET /auth/me

Response:

```json
{
  "id": 1,
  "username": "admin",
  "role": "admin",
  "is_active": true
}
```

## Employees

An employee stores the dial code and the subscriber number as two separate,
independently optional fields:

- `country_code` (string, optional, max 10 chars): the international dial code,
  e.g. `+1` or `+44`. It is **not** part of `phone` and is never derived from it.
- `phone` (string, optional, max 40 chars): the local/subscriber number without
  the dial code.

Both fields default to `null` when omitted and may be cleared independently by
sending `null`. Legacy employees created before this field existed keep
`country_code` as `null` and unrelated edits never invent a value for them.

### POST /employees/

Request:

```json
{
  "first_name": "Jordan",
  "last_name": "Lee",
  "email": "jordan.lee@example.com",
  "country_code": "+1",
  "phone": "555-0101",
  "role": "Engineering Manager",
  "employment_status": "Active"
}
```

Response: `201 Created`

```json
{
  "id": 3,
  "first_name": "Jordan",
  "last_name": "Lee",
  "email": "jordan.lee@example.com",
  "country_code": "+1",
  "phone": "555-0101",
  "role": "Engineering Manager",
  "employment_status": "Active",
  "created_at": "2026-06-20T12:00:00",
  "updated_at": "2026-06-20T12:00:00"
}
```

### GET /employees/

Optional query: `search`

Example: `/employees/?search=engineer`

### GET /employees/{employee_id}

Returns one employee.

### PUT /employees/{employee_id}

Accepts partial employee fields and returns the updated employee.

### DELETE /employees/{employee_id}

Response: `204 No Content`

## Leaves

### POST /leaves/

Request:

```json
{
  "employee_id": 3,
  "leave_type": "Annual",
  "start_date": "2026-07-01",
  "end_date": "2026-07-05",
  "reason": "Planned vacation",
  "status": "Pending"
}
```

`start_date` and `end_date` must form a valid range; `end_date` cannot be
before `start_date`. Invalid ranges return a `422 Unprocessable Entity`
response whose `detail` is an array of field-level error objects. The leave
tracker UI validates the date order client-side before submitting and renders
any backend error messages instead of crashing the view.

### GET /leaves/

Optional query parameters:

- `status`: `Pending`, `Approved`, or `Rejected`
- `employee_id`: employee id

### GET /leaves/summary

Response:

```json
{
  "pending": 2,
  "approved": 4,
  "rejected": 1,
  "total": 7
}
```

### PUT /leaves/{leave_id}

Updates request details or status.

### PATCH /leaves/{leave_id}/status

Request:

```json
{
  "status": "Approved"
}
```

### POST /leaves/{leave_id}/approve

Marks a leave request as approved.

### POST /leaves/{leave_id}/reject

Marks a leave request as rejected.

## Salary

### POST /salary/

Request:

```json
{
  "employee_id": 3,
  "base_salary": 7000,
  "allowances": 500,
  "deductions": 250,
  "month": "2026-06"
}
```

Response includes calculated `net_salary`.

### GET /salary/

Optional query parameters:

- `month`: `YYYY-MM`
- `employee_id`: employee id

### GET /salary/{salary_id}

Returns one salary record.

### PUT /salary/{salary_id}

Updates salary fields and recalculates `net_salary`.

### GET /salary/summary?month=2026-06

Response:

```json
{
  "month": "2026-06",
  "record_count": 3,
  "gross_salary": 21000,
  "total_allowances": 1500,
  "total_deductions": 750,
  "net_payroll": 21750
}
```

## Error Examples

Invalid credentials:

```json
{
  "detail": "Incorrect username or password"
}
```

Missing record:

```json
{
  "detail": "Employee not found"
}
```

Duplicate employee email:

```json
{
  "detail": "An employee with this email already exists"
}
```

Validation errors use FastAPI's standard `422 Unprocessable Entity` response with field-level details.

## Dashboard

The dashboard view is not a single endpoint; it is composed client-side from
four protected calls. All four require the `Authorization: Bearer <token>`
header:

- `GET /employees/` — workforce count and active headcount
- `GET /leaves/summary` — pending/approved/rejected leave totals
- `GET /salary/summary?month=YYYY-MM` — payroll totals for the month
- `GET /salary/?month=YYYY-MM` — monthly salary rows

The frontend loads these with `Promise.allSettled`, so a failure in one call no
longer blanks the entire dashboard. Each section falls back to a safe default
(zeroed summaries / empty lists) and a specific banner names which data failed
to load.

### Troubleshooting "Unable to load dashboard data"

1. **Auth token** — confirm a valid token is present. Protected calls must send
   `Authorization: Bearer <token>`; a missing/expired token returns `401` and
   `AuthContext` will sign the user out. Re-login if needed.
2. **`VITE_API_URL`** — the frontend reads `import.meta.env.VITE_API_URL`
   (default `http://localhost:8000`). A wrong base URL makes every call fail.
3. **Backend availability** — verify the API is up with `GET /health`
   returning `{"status": "healthy"}`, then check the individual dashboard
   endpoints above. The error banner now names the specific failing dataset to
   narrow this down.
4. **CORS** — ensure the frontend origin is included in the backend
   `CORS_ORIGINS` setting, otherwise browser calls are blocked.
