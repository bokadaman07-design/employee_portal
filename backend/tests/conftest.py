import os

# The backend defaults to SQLite but honors a ``DATABASE_URL`` override. Some CI
# environments export a PostgreSQL ``DATABASE_URL``, which makes ``database.py``
# build a psycopg2-backed engine at import time and fail with
# ``ModuleNotFoundError: No module named 'psycopg2'`` before any test runs.
#
# The test suite never touches that engine - every test builds its own isolated
# in-memory SQLite engine and overrides ``get_db`` - so force an in-memory SQLite
# URL here, before the test modules import ``database``, keeping collection
# independent of the host database configuration.
os.environ["DATABASE_URL"] = "sqlite://"
