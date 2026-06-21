"""Tests for the Employee gender field handling.

These tests verify the incident remediation that introduced a separate,
nullable ``gender`` field on the Employee record:

* New employees can be registered with a gender.
* Existing field behaviour (phone/country_code) is preserved (regression).
* Employees created without a gender keep ``gender`` as ``None``.
* Editing an employee can set, change, or leave the gender untouched.

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


def test_create_employee_with_gender(client):
    response = client.post(
        "/employees/",
        json=_base_payload(gender="Female"),
    )
    assert response.status_code == 201
    body = response.json()
    assert body["gender"] == "Female"
    assert body["phone"] == "555-0101"


def test_create_employee_without_gender_is_null(client):
    """Regression: existing flow that omits gender keeps it null."""
    response = client.post("/employees/", json=_base_payload())
    assert response.status_code == 201
    body = response.json()
    assert body["gender"] is None
    # Phone behaviour must remain intact.
    assert body["phone"] == "555-0101"


def test_create_employee_explicit_null_gender(client):
    response = client.post(
        "/employees/",
        json=_base_payload(gender=None),
    )
    assert response.status_code == 201
    assert response.json()["gender"] is None


def test_gender_independent_of_other_optional_fields(client):
    """Regression: gender is nullable and independent of phone/country_code."""
    response = client.post(
        "/employees/",
        json=_base_payload(phone=None, country_code="+44", gender="Non-binary"),
    )
    assert response.status_code == 201
    body = response.json()
    assert body["phone"] is None
    assert body["country_code"] == "+44"
    assert body["gender"] == "Non-binary"


def test_existing_employee_without_gender_stays_null_on_unrelated_edit(client):
    """Editing other fields must not invent a gender for legacy rows."""
    created = client.post("/employees/", json=_base_payload()).json()
    assert created["gender"] is None

    response = client.put(
        f"/employees/{created['id']}",
        json={"role": "Senior Engineer"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["role"] == "Senior Engineer"
    # gender was never set, so it must remain null.
    assert body["gender"] is None


def test_edit_sets_gender_for_existing_employee(client):
    created = client.post("/employees/", json=_base_payload()).json()
    assert created["gender"] is None

    response = client.put(
        f"/employees/{created['id']}",
        json={"gender": "Male"},
    )
    assert response.status_code == 200
    assert response.json()["gender"] == "Male"


def test_edit_can_clear_gender(client):
    created = client.post(
        "/employees/", json=_base_payload(gender="Female")
    ).json()
    assert created["gender"] == "Female"

    response = client.put(
        f"/employees/{created['id']}",
        json={"gender": None},
    )
    assert response.status_code == 200
    assert response.json()["gender"] is None


def test_gender_persisted_in_database(client):
    created = client.post(
        "/employees/", json=_base_payload(gender="Female")
    ).json()

    with client.session_factory() as db:
        stored = db.get(Employee, created["id"])
        assert stored.gender == "Female"
        assert stored.phone == "555-0101"
