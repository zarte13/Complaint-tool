import pytest
from app.models.models import Part

def test_create_part(client):
    response = client.post("/api/parts/", json={"part_number": "PN-123", "description": "Test Part"})
    assert response.status_code == 200
    data = response.json()
    assert data["part_number"] == "PN-123"
    assert data["description"] == "Test Part"
    assert "id" in data

def test_search_parts(client):
    client.post("/api/parts/", json={"part_number": "PN-001", "description": "Part 1"})
    client.post("/api/parts/", json={"part_number": "PN-002", "description": "Part 2"})
    
    response = client.get("/api/parts/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert data[0]["part_number"] == "PN-001"
    assert data[1]["part_number"] == "PN-002"

def test_search_parts_with_search_param(client):
    client.post("/api/parts/", json={"part_number": "ABC-123", "description": "ABC Part"})
    client.post("/api/parts/", json={"part_number": "XYZ-456", "description": "XYZ Part"})
    
    response = client.get("/api/parts/?search=ABC")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["part_number"] == "ABC-123"

def test_search_parts_by_description(client):
    client.post("/api/parts/", json={"part_number": "PN-001", "description": "Special Widget"})
    client.post("/api/parts/", json={"part_number": "PN-002", "description": "Regular Part"})
    
    response = client.get("/api/parts/?search=Widget")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["description"] == "Special Widget"

def test_get_all_parts(client):
    client.post("/api/parts/", json={"part_number": "PN-001", "description": "Part 1"})
    client.post("/api/parts/", json={"part_number": "PN-002", "description": "Part 2"})
    
    response = client.get("/api/parts/all")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2

def test_create_duplicate_part_returns_existing(client):
    # Create first part
    response1 = client.post("/api/parts/", json={"part_number": "DUP-123", "description": "Duplicate Part"})
    assert response1.status_code == 200
    part1_id = response1.json()["id"]
    
    # Try to create same part again
    response2 = client.post("/api/parts/", json={"part_number": "DUP-123", "description": "Different Description"})
    assert response2.status_code == 200
    part2_id = response2.json()["id"]
    
    # Should return the existing part
    assert part1_id == part2_id