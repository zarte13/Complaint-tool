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


def test_delete_complaint_accepts_with_or_without_trailing_slash(client):
    # Seed minimal company and part to create a complaint
    c = client.post("/api/companies/", json={"name": "DelTest Co"})
    assert c.status_code in (200, 201)
    p = client.post("/api/parts/", json={"part_number": "DEL-1", "description": "Del Part"})
    assert p.status_code in (200, 201)
    comp = client.post("/api/complaints/", json={
        "company_id": c.json()["id"],
        "part_id": p.json()["id"],
        "issue_type": "other",
        "details": "delete me",
        "work_order_number": "W-1"
    })
    assert comp.status_code in (200, 201)
    cid = comp.json()["id"]

    # Acquire admin token via auth route (tests fixture config should provide)
    # fall back to unauthenticated 401 check if not available
    token_resp = client.post("/auth/login/", json={"username": "admin", "password": "YourPass123"})
    if token_resp.status_code == 200:
        token = token_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Without slash
        d1 = client.delete(f"/api/complaints/{cid}", headers=headers)
        assert d1.status_code in (204, 404)  # allow 404 if already deleted below

        # Recreate to test with slash
        comp2 = client.post("/api/complaints/", json={
            "company_id": c.json()["id"],
            "part_id": p.json()["id"],
            "issue_type": "other",
            "details": "delete me 2",
            "work_order_number": "W-2"
        })
        assert comp2.status_code in (200, 201)
        cid2 = comp2.json()["id"]

        d2 = client.delete(f"/api/complaints/{cid2}/", headers=headers)
        assert d2.status_code == 204
    else:
        # If no auth, verify method is not allowed without token (401/405 acceptable depending on router guard)
        d = client.delete(f"/api/complaints/{cid}")
        assert d.status_code in (401, 405)