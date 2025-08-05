import sys
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the parent directory to the Python path before importing app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.database import Base, get_db
# Import models to ensure tables are registered on Base.metadata before create_all
from app.models.models import Company, Part, Complaint  # noqa: F401
from main import app

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Explicitly ensure all ORM tables are attached to metadata before any create_all
# by importing models and referencing tables, then create once up-front
_ = (Company.__table__, Part.__table__, Complaint.__table__)
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Ensure FastAPI uses the testing session for all DB dependencies
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function")
def test_db():
    """
    Create all tables before each test and drop them afterwards.
    Ensure models are imported so all tables are present.
    """
    # Defensive import in case test discovery order differs
    from app.models.models import Company as _Company, Part as _Part, Complaint as _Complaint  # noqa: F401
    Base.metadata.create_all(bind=engine)
    try:
        yield
    finally:
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(test_db):
    """
    A client fixture for testing the API.
    Use TestClient as a context manager so startup/shutdown events
    and lifespan run within the DB lifecycle created by test_db.
    """
    # No-op ensure metadata is bound and created by test_db already
    with TestClient(app) as c:
        yield c