import pytest
from fastapi.testclient import TestClient

# Import the FastAPI app
# Note: Using relative import path based on repository structure
# Use relative import path based on the tests package location
from backend.main import app  # noqa: E402


client = TestClient(app)


@pytest.mark.parametrize("path", ["/api/complaints", "/api/complaints/"])
def test_complaints_collection_accepts_both_without_redirect(path):
    resp = client.get(path)
    # Ensure there's no redirect chain (no 301/302/307/308 in history)
    assert resp.history == [] or all(r.status_code not in (301, 302, 307, 308) for r in resp.history)
    assert resp.status_code == 200
    # Verify paginated shape per implementation
    data = resp.json()
    assert isinstance(data, dict)
    assert "items" in data and "pagination" in data


@pytest.mark.parametrize("path", ["/api/companies", "/api/companies/"])
def test_companies_collection_accepts_both_without_redirect(path):
    resp = client.get(path)
    assert resp.history == [] or all(r.status_code not in (301, 302, 307, 308) for r in resp.history)
    assert resp.status_code == 200
    # Companies returns list
    assert isinstance(resp.json(), list)


@pytest.mark.parametrize("path", ["/api/parts", "/api/parts/"])
def test_parts_collection_accepts_both_without_redirect(path):
    resp = client.get(path)
    assert resp.history == [] or all(r.status_code not in (301, 302, 307, 308) for r in resp.history)
    assert resp.status_code == 200
    # Parts returns list
    assert isinstance(resp.json(), list)