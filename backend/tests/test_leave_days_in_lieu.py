"""Tests for the 'Days in Lieu' leave type handling.

These tests verify the incident remediation that added 'Days in Lieu' as a
selectable leave type. The backend ``leave_type`` field is a free-form string,
so the focus is confirming that:

* A leave request with ``leave_type`` of "Days in Lieu" is accepted and
  persisted.
* The value round-trips through create/list/read responses.
* Existing leave types (Annual, Sick, Personal, Unpaid) still work
  (regression).

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
from models import LeaveRequest, User  # noqa: E402


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


def _create_employee(client):
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


def _leave_payload(employee_id, **overrides):
    payload = {
        "employee_id": employee_id,
        "leave_type": "Annual",
        "start_date": "2026-07-01",
        "end_date": "2026-07-05",
        "reason": "Planned time off",
    }
    payload.update(overrides)
    return payload


def test_create_days_in_lieu_leave(client):
    employee_id = _create_employee(client)
    response = client.post(
        "/leaves/",
        json=_leave_payload(employee_id, leave_type="Days in Lieu"),
    )
    assert response.status_code == 201
    body = response.json()
    assert body["leave_type"] == "Days in Lieu"
    assert body["status"] == "Pending"


def test_days_in_lieu_persisted_and_listed(client):
    employee_id = _create_employee(client)
    created = client.post(
        "/leaves/",
        json=_leave_payload(employee_id, leave_type="Days in Lieu"),
    ).json()

    listed = client.get("/leaves/").json()
    assert any(item["leave_type"] == "Days in Lieu" for item in listed)

    with client.session_factory() as db:
        stored = db.get(LeaveRequest, created["id"])
        assert stored.leave_type == "Days in Lieu"


@pytest.mark.parametrize(
    "leave_type",
    ["Annual", "Sick", "Personal", "Unpaid", "Days in Lieu"],
)
def test_existing_leave_types_still_accepted(client, leave_type):
    """Regression: all offered leave types remain valid."""
    employee_id = _create_employee(client)
    response = client.post(
        "/leaves/",
        json=_leave_payload(employee_id, leave_type=leave_type),
    )
    assert response.status_code == 201
    assert response.json()["leave_type"] == leave_type
