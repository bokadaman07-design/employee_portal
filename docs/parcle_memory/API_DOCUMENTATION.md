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

### POST /employees/

Request:

```json
{
  "first_name": "Jordan",
  "last_name": "Lee",
  "email": "jordan.lee@example.com",
  "phone": "+1-555-0101",
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
  "phone": "+1-555-0101",
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
