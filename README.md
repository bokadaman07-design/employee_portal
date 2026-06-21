# Employee Tracker SaaS

Employee Tracker is a production-ready MVP for managing employees, leave requests, and monthly payroll records. The project is intentionally modular and explicit so future AI agents can inspect, extend, and repair it safely.

## Architecture Overview

- `backend/` contains a FastAPI application using SQLAlchemy ORM, SQLite, Pydantic v2 validation, bcrypt password hashing, and JWT authentication.
- `frontend/` contains a React 18 + Vite dashboard using React Router, TailwindCSS, Axios, and reusable layout components.
- `docker-compose.yml` starts both services, persists SQLite data in a Docker volume, and wires browser requests to the backend through `VITE_API_URL`.

## Tech Stack

- Backend: Python 3.12, FastAPI, SQLAlchemy 2.x, Pydantic v2, SQLite, Passlib bcrypt, Python-JOSE
- Frontend: React 18, Vite, React Router DOM, TailwindCSS, Axios, Lucide icons
- Runtime: Docker and Docker Compose

## Docker Setup

From the repository root:

```bash
docker compose up --build
```

Open:

- Frontend: `http://localhost:5173`
- Backend API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

## Local Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend defaults to `sqlite:///./employee_tracker.db` when `DATABASE_URL` is not set.

## Local Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL=http://localhost:8000` if your backend runs somewhere else.

## Environment Variables

Copy `backend/.env.example` when running outside Docker and provide values as needed.

- `SECRET_KEY`: JWT signing key. If omitted, the backend generates an in-memory key for the running process.
- `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT lifetime in minutes.
- `DATABASE_URL`: SQLAlchemy database URL.
- `CORS_ORIGINS`: comma-separated list of allowed frontend origins.

## Sign-in Behavior

The sign-in page (`frontend/src/views/SignIn.jsx`) starts with empty username and password fields and no longer ships with hardcoded demo credentials. The form and inputs set `autoComplete="off"` (and `autoComplete="new-password"` on the password field) so browsers do not auto-fill saved credentials on the login screen.

## Sign-out Behavior

The Sign Out button in the navbar (`frontend/src/components/Navbar.jsx`) opens an in-app confirmation modal ("Are you sure you want to sign out?") with explicit Confirm and Cancel actions before logging out, preventing accidental logouts. Cancel (or clicking the backdrop) dismisses the dialog and leaves the session intact; Confirm calls `logout()`. The actual token/session clearing remains centralized in `AuthContext.logout` (`frontend/src/context/AuthContext.js`).

## Currency Display

Monetary values on the Dashboard (`frontend/src/views/Dashboard.jsx`) — the "Net payroll" summary card and the monthly payroll table (Base, Allowances, Deductions, Net) — are displayed in Rupees using the `₹` symbol. The underlying salary amounts are stored and returned by the API as plain numbers; the currency symbol is applied only at the presentation layer.

## Salary Total Preview

The "Create salary record" form on the Dashboard (`frontend/src/views/Dashboard.jsx`) shows a live **Net salary preview** that updates in real time as the user types the base salary, allowances, or deductions. The preview mirrors the backend salary contract (`net_salary = base_salary + allowances - deductions`, rounded to 2 decimals; see `backend/routers/salary.py:calculate_net_salary`) so the figure shown before submitting matches the value the API will persist. Empty or non-numeric fields are treated as `0`, so the preview never displays `NaN`. The amount is rendered in Rupees (`₹`) at the presentation layer only.

## Dark Mode

The frontend supports a light/dark theme toggle. Tailwind is configured for
class-based dark mode (`darkMode: "class"` in `frontend/tailwind.config.js`),
with a dark surface palette (`night`, `panel`, `edge`, `fog`) mirroring the
light roles (page background, raised surface, borders, primary text).

Theme state lives in `frontend/src/hooks/useTheme.js` (`ThemeProvider` /
`useTheme`), mounted around the app in `frontend/src/main.jsx`. On first visit
the app follows the operating system preference (`prefers-color-scheme`); once
the user toggles the theme via the navbar button
(`frontend/src/components/Navbar.jsx`), the explicit choice is persisted to
`localStorage` under `employee_tracker_theme` and reused on subsequent visits.
The active theme is applied by toggling the `dark` class on the `<html>`
element, which activates the `dark:` variants used across the views. The theme
is a client-side preference only and is not stored on the backend.

## Troubleshooting

- If login fails after a backend restart, clear browser local storage and sign in again. This can happen when `SECRET_KEY` is not persisted.
- If the frontend cannot reach the API, verify `VITE_API_URL` points to `http://localhost:8000` for local browser use.
- If Docker keeps old data, remove the volume with `docker compose down -v` and rebuild.
- If port `5173` or `8000` is busy, change the host port mapping in `docker-compose.yml`.

## Future Improvements

- Add RBAC with granular permissions.
- Move from SQLite to PostgreSQL for multi-user production workloads.
- Add Alembic migrations.
- Add audit logging for employee, leave, and salary changes.
- Add automated tests and CI checks.
- Add departments, attendance, notifications, and reporting exports.
