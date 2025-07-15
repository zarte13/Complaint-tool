import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.database import Base
from app.models.models import Complaint, Company, Part
from main import app
from app.database.database import get_db

# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_analytics.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture
def test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_get_rar_metrics(test_db):
    # Create test data
    db = TestingSessionLocal()
    
    company = Company(name="Test Company")
    db.add(company)
    db.commit()
    
    part = Part(name="Test Part", company_id=company.id)
    db.add(part)
    db.commit()
    
    # Create complaints with different statuses
    complaints = [
        Complaint(
            part_id=part.id,
            company_id=company.id,
            quantity=10,
            issue_type="Wrong Quantity",
            status="returned"
        ),
        Complaint(
            part_id=part.id,
            company_id=company.id,
            quantity=5,
            issue_type="Wrong Part",
            status="authorized"
        ),
        Complaint(
            part_id=part.id,
            company_id=company.id,
            quantity=3,
            issue_type="Damaged",
            status="rejected"
        )
    ]
    
    for complaint in complaints:
        db.add(complaint)
    db.commit()
    
    response = client.get("/api/analytics/rar-metrics")
    assert response.status_code == 200
    
    data = response.json()
    assert data["returnRate"] == 50.0  # 1 out of 2
    assert data["authorizationRate"] == 50.0  # 1 out of 2
    assert data["rejectionRate"] == 0.0  # 0 out of 2

def test_get_failure_modes(test_db):
    # Create test data
    db = TestingSessionLocal()
    
    company = Company(name="Test Company")
    db.add(company)
    db.commit()
    
    part = Part(name="Test Part", company_id=company.id)
    db.add(part)
    db.commit()
    
    complaints = [
        Complaint(
            part_id=part.id,
            company_id=company.id,
            quantity=10,
            issue_type="Wrong Quantity",
            status="returned"
        ),
        Complaint(
            part_id=part.id,
            company_id=company.id,
            quantity=5,
            issue_type="Wrong Quantity",
            status="returned"
        ),
        Complaint(
            part_id=part.id,
            company_id=company.id,
            quantity=3,
            issue_type="Wrong Part",
            status="returned"
        )
    ]
    
    for complaint in complaints:
        db.add(complaint)
    db.commit()
    
    response = client.get("/api/analytics/failure-modes")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) == 2
    assert data[0]["issueType"] == "Wrong Quantity"
    assert data[0]["count"] == 2

def test_get_trend_data(test_db):
    response = client.get("/api/analytics/trend-data")
    assert response.status_code == 200
    
    data = response.json()
    assert "labels" in data
    assert "data" in data