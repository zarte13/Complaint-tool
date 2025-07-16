import pytest
from app.models.models import Complaint, Company, Part
import time

@pytest.fixture
def setup_data(client):
    company_response = client.post("/api/companies/", json={"name": "Test Company"})
    part_response = client.post("/api/parts/", json={"part_number": "PN-123", "description": "Test Part"})
    return {"company_id": company_response.json()["id"], "part_id": part_response.json()["id"]}

def test_create_complaint(client, setup_data):
    response = client.post("/api/complaints/", json={
        "company_id": setup_data["company_id"],
        "part_id": setup_data["part_id"],
        "issue_type": "wrong_part",
        "details": "Test details",
        "quantity_ordered": 10,
        "quantity_received": 9,
        "work_order_number": "WO-123",
        "human_factor": False
    })
    assert response.status_code == 200
    data = response.json()
    assert data["details"] == "Test details"
    assert "id" in data

def test_get_complaints(client, setup_data):
    client.post("/api/complaints/", json={
        "company_id": setup_data["company_id"],
        "part_id": setup_data["part_id"],
        "issue_type": "wrong_part",
        "details": "Test details 1",
        "quantity_ordered": 10,
        "quantity_received": 9,
        "work_order_number": "WO-123",
        "human_factor": False
    })
    client.post("/api/complaints/", json={
        "company_id": setup_data["company_id"],
        "part_id": setup_data["part_id"],
        "issue_type": "damaged",
        "details": "Test details 2",
        "quantity_ordered": 5,
        "quantity_received": 5,
        "work_order_number": "WO-456",
        "human_factor": True
    })

    response = client.get("/api/complaints/")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "pagination" in data
    assert len(data["items"]) == 2
    assert data["items"][0]["details"] == "Test details 1"
    assert data["items"][1]["details"] == "Test details 2"

def test_get_complaint_by_id(client, setup_data):
    response = client.post("/api/complaints/", json={
        "company_id": setup_data["company_id"],
        "part_id": setup_data["part_id"],
        "issue_type": "wrong_part",
        "details": "Test details",
        "quantity_ordered": 10,
        "quantity_received": 9,
        "work_order_number": "WO-123",
        "human_factor": False
    })
    complaint_id = response.json()["id"]

    response = client.get(f"/api/complaints/{complaint_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["details"] == "Test details"
    assert data["id"] == complaint_id

def test_update_complaint(client, setup_data):
    response = client.post("/api/complaints/", json={
        "company_id": setup_data["company_id"],
        "part_id": setup_data["part_id"],
        "issue_type": "wrong_part",
        "details": "Original details",
        "quantity_ordered": 10,
        "quantity_received": 9,
        "work_order_number": "WO-123",
        "human_factor": False
    })
    complaint_id = response.json()["id"]
    original_updated_at = response.json()["updated_at"]

    time.sleep(1)

    # Only update fields that are allowed in ComplaintUpdate schema (status and details)
    response = client.put(f"/api/complaints/{complaint_id}", json={
        "details": "Updated details",
        "status": "in_progress"
    })

    assert response.status_code == 200
    data = response.json()
    assert data["details"] == "Updated details"
    assert data["status"] == "in_progress"
    assert data["work_order_number"] == "WO-123"  # Should remain unchanged
    assert data["updated_at"] != original_updated_at

def test_get_complaints_with_search(client, setup_data):
    client.post("/api/complaints/", json={
        "company_id": setup_data["company_id"],
        "part_id": setup_data["part_id"],
        "issue_type": "wrong_part",
        "details": "Searchable details",
        "quantity_ordered": 10,
        "quantity_received": 9,
        "work_order_number": "WO-123",
        "human_factor": False
    })
    client.post("/api/complaints/", json={
        "company_id": setup_data["company_id"],
        "part_id": setup_data["part_id"],
        "issue_type": "damaged",
        "details": "Other details",
        "quantity_ordered": 5,
        "quantity_received": 5,
        "work_order_number": "WO-456",
        "human_factor": True
    })

    response = client.get("/api/complaints/?search=Searchable")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) == 1
    assert data["items"][0]["details"] == "Searchable details"

def test_get_complaints_with_filters(client, setup_data):
    # Create first complaint (will default to "open" status)
    response1 = client.post("/api/complaints/", json={
        "company_id": setup_data["company_id"],
        "part_id": setup_data["part_id"],
        "issue_type": "wrong_part",
        "details": "Test details",
        "quantity_ordered": 10,
        "quantity_received": 9,
        "work_order_number": "WO-123",
        "human_factor": False
    })
    complaint1_id = response1.json()["id"]
    
    # Create second complaint (will default to "open" status)
    response2 = client.post("/api/complaints/", json={
        "company_id": setup_data["company_id"],
        "part_id": setup_data["part_id"],
        "issue_type": "damaged",
        "details": "Other details",
        "quantity_ordered": 5,
        "quantity_received": 5,
        "work_order_number": "WO-456",
        "human_factor": True
    })
    complaint2_id = response2.json()["id"]
    
    # Update second complaint to closed status
    client.put(f"/api/complaints/{complaint2_id}", json={
        "status": "closed"
    })

    # Test status filter for open complaints
    response = client.get("/api/complaints/?status=open")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) == 1
    assert data["items"][0]["status"] == "open"
    assert data["items"][0]["work_order_number"] == "WO-123"

    # Test status filter for closed complaints
    response = client.get("/api/complaints/?status=closed")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) == 1
    assert data["items"][0]["status"] == "closed"
    assert data["items"][0]["work_order_number"] == "WO-456"

    # Test issue_type filter
    response = client.get("/api/complaints/?issue_type=damaged")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) == 1
    assert data["items"][0]["issue_type"] == "damaged"
    assert data["items"][0]["work_order_number"] == "WO-456"

def test_get_complaints_pagination(client, setup_data):
    # Create multiple complaints
    for i in range(5):
        client.post("/api/complaints/", json={
            "company_id": setup_data["company_id"],
            "part_id": setup_data["part_id"],
            "issue_type": "wrong_part",
            "details": f"Test details {i}",
            "quantity_ordered": 10,
            "quantity_received": 9,
            "work_order_number": f"WO-{i}",
            "human_factor": False
        })

    response = client.get("/api/complaints/?page=1&size=3")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "pagination" in data
    assert len(data["items"]) == 3
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["size"] == 3
    assert data["pagination"]["total"] == 5