import os
import sys

from sqlalchemy import create_engine, inspect, text

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import main  # noqa: E402


def test_sqlite_schema_repair_adds_missing_country_code(tmp_path, monkeypatch):
    database_path = tmp_path / "legacy_employee_tracker.db"
    legacy_engine = create_engine(f"sqlite:///{database_path.as_posix()}")

    with legacy_engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE employees (
                    id INTEGER NOT NULL PRIMARY KEY,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    phone VARCHAR(40),
                    role VARCHAR(120) NOT NULL,
                    employment_status VARCHAR(50) NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )
        connection.execute(
            text(
                """
                INSERT INTO employees (
                    id, first_name, last_name, email, phone, role, employment_status
                ) VALUES (
                    1, 'Avery', 'Stone', 'avery.stone@example.com', '555-0101',
                    'People Operations Lead', 'Active'
                )
                """
            )
        )

    monkeypatch.setattr(main, "engine", legacy_engine)

    main.apply_sqlite_schema_repairs()

    inspector = inspect(legacy_engine)
    columns = {column["name"] for column in inspector.get_columns("employees")}
    assert "country_code" in columns

    with legacy_engine.connect() as connection:
        row = connection.execute(
            text("SELECT first_name, country_code FROM employees WHERE id = 1")
        ).one()
    assert row.first_name == "Avery"
    assert row.country_code is None


def test_sqlite_schema_repair_adds_missing_gender(tmp_path, monkeypatch):
    database_path = tmp_path / "legacy_employee_tracker.db"
    legacy_engine = create_engine(f"sqlite:///{database_path.as_posix()}")

    with legacy_engine.begin() as connection:
        connection.execute(
            text(
                """
                CREATE TABLE employees (
                    id INTEGER NOT NULL PRIMARY KEY,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    phone VARCHAR(40),
                    country_code VARCHAR(10),
                    role VARCHAR(120) NOT NULL,
                    employment_status VARCHAR(50) NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
        )
        connection.execute(
            text(
                """
                INSERT INTO employees (
                    id, first_name, last_name, email, phone, role, employment_status
                ) VALUES (
                    1, 'Avery', 'Stone', 'avery.stone@example.com', '555-0101',
                    'People Operations Lead', 'Active'
                )
                """
            )
        )

    monkeypatch.setattr(main, "engine", legacy_engine)

    main.apply_sqlite_schema_repairs()

    inspector = inspect(legacy_engine)
    columns = {column["name"] for column in inspector.get_columns("employees")}
    assert "gender" in columns

    with legacy_engine.connect() as connection:
        row = connection.execute(
            text("SELECT first_name, gender FROM employees WHERE id = 1")
        ).one()
    assert row.first_name == "Avery"
    assert row.gender is None
