import pytest
from app.models.models import Company

def test_create_company(client):
    response = client.post("/api/companies/", json={"name": "Test Company"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Company"
    assert "id" in data

def test_search_companies(client):
    client.post("/api/companies/", json={"name": "Company 1"})
    client.post("/api/companies/", json={"name": "Company 2"})
    
    response = client.get("/api/companies/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert data[0]["name"] == "Company 1"
    assert data[1]["name"] == "Company 2"

def test_search_companies_with_search_param(client):
    client.post("/api/companies/", json={"name": "ABC Company"})
    client.post("/api/companies/", json={"name": "XYZ Corporation"})
    
    response = client.get("/api/companies/?search=ABC")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["name"] == "ABC Company"

def test_get_all_companies(client):
    client.post("/api/companies/", json={"name": "Company 1"})
    client.post("/api/companies/", json={"name": "Company 2"})
    
    response = client.get("/api/companies/all")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2

def test_create_duplicate_company_returns_existing(client):
    # Create first company
    response1 = client.post("/api/companies/", json={"name": "Duplicate Company"})
    assert response1.status_code == 200
    company1_id = response1.json()["id"]
    
    # Try to create same company again
    response2 = client.post("/api/companies/", json={"name": "Duplicate Company"})
    assert response2.status_code == 200
    company2_id = response2.json()["id"]
    
    # Should return the existing company
    assert company1_id == company2_id