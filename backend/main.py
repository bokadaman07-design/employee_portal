import os
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, func, select, text
from sqlalchemy.orm import Session

from auth import CurrentUser, get_password_hash, router as auth_router
from database import Base, SessionLocal, engine, get_db
from models import Employee, User
from routers import employees, leaves, salary


APP_VERSION = "1.0.0"


def apply_sqlite_schema_repairs() -> None:
    """Apply tiny idempotent repairs for SQLite databases created before migrations."""
    if engine.dialect.name != "sqlite":
        return

    inspector = inspect(engine)
    if "employees" not in inspector.get_table_names():
        return

    employee_columns = {column["name"] for column in inspector.get_columns("employees")}

    with engine.begin() as connection:
        if "country_code" not in employee_columns:
            connection.execute(text("ALTER TABLE employees ADD COLUMN country_code VARCHAR(10)"))
        if "gender" not in employee_columns:
            connection.execute(text("ALTER TABLE employees ADD COLUMN gender VARCHAR(30)"))


def seed_default_admin(db: Session) -> None:
    existing_admin = db.scalar(select(User).where(User.username == "admin"))
    if existing_admin:
        return
    db.add(
        User(
            username="admin",
            hashed_password=get_password_hash("admin123"),
            role="admin",
            is_active=True,
        )
    )
    db.commit()


def seed_sample_employees(db: Session) -> None:
    if db.scalar(select(Employee.id).limit(1)):
        return
    db.add_all(
        [
            Employee(
                first_name="Avery",
                last_name="Stone",
                email="avery.stone@example.com",
                phone="+1-555-0134",
                gender="Female",
                role="People Operations Lead",
                employment_status="Active",
            ),
            Employee(
                first_name="Mira",
                last_name="Patel",
                email="mira.patel@example.com",
                phone="+1-555-0182",
                gender="Female",
                role="Product Designer",
                employment_status="Active",
            ),
        ]
    )
    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    apply_sqlite_schema_repairs()
    with SessionLocal() as db:
        seed_default_admin(db)
        seed_sample_employees(db)
    yield


app = FastAPI(
    title="Employee Tracker API",
    description="Production-ready Employee Tracker SaaS backend.",
    version=APP_VERSION,
    lifespan=lifespan,
)

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(employees.router)
app.include_router(leaves.router)
app.include_router(salary.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}


@app.get("/version")
def version() -> dict[str, str]:
    return {"version": APP_VERSION}


@app.get("/dashboard/summary")
def dashboard_summary(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, int]:
    return {
        "employees": db.scalar(select(func.count(Employee.id))) or 0,
    }
