import pytest

# Use the shared client fixture from conftest.py so DB tables are created per test
@pytest.mark.parametrize("path", ["/api/complaints", "/api/complaints/"])
def test_complaints_collection_accepts_both_without_redirect(path, client):
    resp = client.get(path)
    # Ensure there's no redirect chain (no 301/302/307/308 in history)
    assert resp.history == [] or all(r.status_code not in (301, 302, 307, 308) for r in resp.history)
    assert resp.status_code == 200
    # Verify paginated shape per implementation
    data = resp.json()
    assert isinstance(data, dict)
    assert "items" in data and "pagination" in data


@pytest.mark.parametrize("path", ["/api/companies", "/api/companies/"])
def test_companies_collection_accepts_both_without_redirect(path, client):
    # Ensure the companies table exists by creating a company record first
    create = client.post("/api/companies/", json={"name": "Smoke Co"})
    assert create.status_code in (200, 201)
    resp = client.get(path)
    assert resp.history == [] or all(r.status_code not in (301, 302, 307, 308) for r in resp.history)
    assert resp.status_code == 200
    # Companies returns list
    assert isinstance(resp.json(), list)


@pytest.mark.parametrize("path", ["/api/parts", "/api/parts/"])
def test_parts_collection_accepts_both_without_redirect(path, client):
    # Ensure the parts table exists by creating a part record first
    create = client.post("/api/parts/", json={"part_number": "SMK-001", "description": "Smoke Part"})
    assert create.status_code in (200, 201)
    resp = client.get(path)
    assert resp.history == [] or all(r.status_code not in (301, 302, 307, 308) for r in resp.history)
    assert resp.status_code == 200
    # Parts returns list
    assert isinstance(resp.json(), list)