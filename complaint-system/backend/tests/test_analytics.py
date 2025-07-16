import pytest
from app.models.models import Complaint, Company, Part

def test_rar_metrics_endpoint(client):
    # Create test data
    company_response = client.post("/api/companies/", json={"name": "Test Company"})
    company_id = company_response.json()["id"]
    
    part_response = client.post("/api/parts/", json={"part_number": "PN-123", "description": "Test Part"})
    part_id = part_response.json()["id"]
    
    # Create complaints with different statuses
    client.post("/api/complaints/", json={
        "company_id": company_id,
        "part_id": part_id,
        "issue_type": "wrong_part",
        "details": "Test details 1",
        "quantity_ordered": 10,
        "quantity_received": 9,
        "work_order_number": "WO-123",
        "human_factor": False,
        "status": "returned"
    })
    
    client.post("/api/complaints/", json={
        "company_id": company_id,
        "part_id": part_id,
        "issue_type": "damaged",
        "details": "Test details 2",
        "quantity_ordered": 5,
        "quantity_received": 5,
        "work_order_number": "WO-456",
        "human_factor": True,
        "status": "authorized"
    })
    
    # Test RAR metrics endpoint
    response = client.get("/api/analytics/rar-metrics")
    assert response.status_code == 200
    
    data = response.json()
    assert "returnRate" in data
    assert "authorizationRate" in data
    assert "rejectionRate" in data
    assert "totalComplaints" in data
    assert data["totalComplaints"] == 2

def test_failure_modes_endpoint(client):
    # Create test data
    company_response = client.post("/api/companies/", json={"name": "Test Company"})
    company_id = company_response.json()["id"]
    
    part_response = client.post("/api/parts/", json={"part_number": "PN-123", "description": "Test Part"})
    part_id = part_response.json()["id"]
    
    # Create complaints with different issue types
    client.post("/api/complaints/", json={
        "company_id": company_id,
        "part_id": part_id,
        "issue_type": "wrong_part",
        "details": "Test details 1",
        "quantity_ordered": 10,
        "quantity_received": 9,
        "work_order_number": "WO-123",
        "human_factor": False
    })
    
    client.post("/api/complaints/", json={
        "company_id": company_id,
        "part_id": part_id,
        "issue_type": "wrong_part",
        "details": "Test details 2",
        "quantity_ordered": 5,
        "quantity_received": 5,
        "work_order_number": "WO-456",
        "human_factor": True
    })
    
    # Test failure modes endpoint
    response = client.get("/api/analytics/failure-modes")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "issueType" in data[0]
    assert "count" in data[0]

def test_trends_endpoint(client):
    # Test trends endpoint
    response = client.get("/api/analytics/trends")
    assert response.status_code == 200
    
    data = response.json()
    assert "labels" in data
    assert "data" in data
    assert isinstance(data["labels"], list)
    assert isinstance(data["data"], list)