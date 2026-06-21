"""Tests for the Employee country_code field handling.

These tests verify the incident remediation that introduced a separate,
nullable ``country_code`` field on the Employee record:

* New employees can be registered with a country code.
* The existing ``phone`` field behaviour is preserved (regression).
* Employees created without a country code keep ``country_code`` as ``None``.
* Editing an employee can set, change, or leave the country code untouched.

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
from models import Employee, User  # noqa: E402


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

    # Expose the session factory so tests can inspect persisted rows directly.
    with TestClient(app) as test_client:
        test_client.session_factory = TestingSession
        yield test_client

    app.dependency_overrides.clear()


def _base_payload(**overrides):
    payload = {
        "first_name": "Jordan",
        "last_name": "Lee",
        "email": "jordan.lee@example.com",
        "phone": "555-0101",
        "role": "Engineer",
        "employment_status": "Active",
    }
    payload.update(overrides)
    return payload


def test_create_employee_with_country_code(client):
    response = client.post(
        "/employees/",
        json=_base_payload(country_code="+1"),
    )
    assert response.status_code == 201
    body = response.json()
    assert body["country_code"] == "+1"
    assert body["phone"] == "555-0101"


def test_create_employee_without_country_code_is_null(client):
    """Regression: existing flow that omits country_code keeps it null."""
    response = client.post("/employees/", json=_base_payload())
    assert response.status_code == 201
    body = response.json()
    assert body["country_code"] is None
    # Phone behaviour must remain intact.
    assert body["phone"] == "555-0101"


def test_create_employee_explicit_null_country_code(client):
    response = client.post(
        "/employees/",
        json=_base_payload(country_code=None),
    )
    assert response.status_code == 201
    assert response.json()["country_code"] is None


def test_phone_still_optional(client):
    """Regression: phone remains nullable and independent of country_code."""
    response = client.post(
        "/employees/",
        json=_base_payload(phone=None, country_code="+44"),
    )
    assert response.status_code == 201
    body = response.json()
    assert body["phone"] is None
    assert body["country_code"] == "+44"


def test_existing_employee_without_country_code_stays_null_on_unrelated_edit(client):
    """Editing other fields must not invent a country code for legacy rows."""
    created = client.post("/employees/", json=_base_payload()).json()
    assert created["country_code"] is None

    response = client.put(
        f"/employees/{created['id']}",
        json={"role": "Senior Engineer"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "Senior Engineer"
    # country_code was never set, so it must remain null.
    assert body["country_code"] is None


def test_edit_sets_country_code_for_existing_employee(client):
    created = client.post("/employees/", json=_base_payload()).json()
    assert created["country_code"] is None

    response = client.put(
        f"/employees/{created['id']}",
        json={"country_code": "+91"},
    )
    assert response.status_code == 200
    assert response.json()["country_code"] == "+91"


def test_edit_can_clear_country_code(client):
    created = client.post(
        "/employees/", json=_base_payload(country_code="+1")
    ).json()
    assert created["country_code"] == "+1"

    response = client.put(
        f"/employees/{created['id']}",
        json={"country_code": None},
    )
    assert response.status_code == 200
    assert response.json()["country_code"] is None


def test_country_code_persisted_in_database(client):
    created = client.post(
        "/employees/", json=_base_payload(country_code="+1")
    ).json()

    with client.session_factory() as db:
        stored = db.get(Employee, created["id"])
        assert stored.country_code == "+1"
        assert stored.phone == "555-0101"
