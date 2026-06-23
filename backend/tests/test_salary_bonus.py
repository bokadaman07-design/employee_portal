"""Tests for the SalaryRecord bonus field handling.

These tests verify the incident remediation that introduced a separate,
persisted ``bonus`` field on the SalaryRecord:

* Salary records can be created with a bonus that feeds into net_salary.
* Existing behaviour (allowances/deductions math) is preserved (regression).
* Records created without a bonus default it to 0 (regression).
* Updating a record's bonus recalculates net_salary.
* The payroll summary aggregates bonus into total_bonus and net_payroll.

The tests use an isolated in-memory SQLite database and override the
authentication dependency so they exercise the real router/schema/model
logic without requiring a running server or JWT issuance.
"""

import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from auth import get_current_user  # noqa: E402
from database import Base, get_db  # noqa: E402
from main import app  # noqa: E402
from models import Employee, SalaryRecord, User  # noqa: E402


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    def override_get_current_user():
        return User(
            id=1,
            username="tester",
            hashed_password="x",
            role="admin",
            is_active=True,
        )

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as test_client:
        test_client.session_factory = TestingSession
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture()
def employee_id(client):
    response = client.post(
        "/employees/",
        json={
            "first_name": "Jordan",
            "last_name": "Lee",
            "email": "jordan.lee@example.com",
            "role": "Engineer",
            "employment_status": "Active",
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def _salary_payload(employee_id, **overrides):
    payload = {
        "employee_id": employee_id,
        "base_salary": 7000,
        "allowances": 500,
        "deductions": 250,
        "month": "2026-06",
    }
    payload.update(overrides)
    return payload


def test_create_salary_with_bonus_in_net(client, employee_id):
    response = client.post("/salary/", json=_salary_payload(employee_id, bonus=1000))
    assert response.status_code == 201
    body = response.json()
    assert body["bonus"] == 1000
    # net = base + allowances + bonus - deductions = 7000 + 500 + 1000 - 250
    assert body["net_salary"] == 8250


def test_create_salary_without_bonus_defaults_zero(client, employee_id):
    """Regression: omitting bonus keeps prior net_salary math intact."""
    response = client.post("/salary/", json=_salary_payload(employee_id))
    assert response.status_code == 201
    body = response.json()
    assert body["bonus"] == 0
    # net = 7000 + 500 - 250 (unchanged from pre-bonus behaviour)
    assert body["net_salary"] == 7250


def test_create_salary_rejects_negative_bonus(client, employee_id):
    response = client.post("/salary/", json=_salary_payload(employee_id, bonus=-1))
    assert response.status_code == 422


def test_update_bonus_recalculates_net(client, employee_id):
    created = client.post("/salary/", json=_salary_payload(employee_id)).json()
    assert created["net_salary"] == 7250

    response = client.put(f"/salary/{created['id']}", json={"bonus": 2000})
    assert response.status_code == 200
    body = response.json()
    assert body["bonus"] == 2000
    assert body["net_salary"] == 9250


def test_bonus_persisted_in_database(client, employee_id):
    created = client.post("/salary/", json=_salary_payload(employee_id, bonus=750)).json()
    with client.session_factory() as db:
        stored = db.get(SalaryRecord, created["id"])
        assert stored.bonus == 750
        assert stored.net_salary == 8000


def test_summary_aggregates_bonus(client, employee_id):
    client.post("/salary/", json=_salary_payload(employee_id, bonus=1000))
    client.post(
        "/salary/",
        json=_salary_payload(employee_id, base_salary=5000, allowances=0, deductions=0, bonus=500),
    )

    response = client.get("/salary/summary", params={"month": "2026-06"})
    assert response.status_code == 200
    body = response.json()
    assert body["record_count"] == 2
    assert body["total_bonus"] == 1500
    # net_payroll = (7000+500+1000-250) + (5000+0+500-0) = 8250 + 5500
    assert body["net_payroll"] == 13750
