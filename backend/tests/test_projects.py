import pytest

async def test_create_project_and_generate(test_app):
    ac = test_app
    # login first (re-use existing user)
    r = await ac.post("/api/auth/login", json={"email":"t@t.com","password":"pass"})
    token = r.json()["token"]

    headers = {"Authorization": f"Bearer {token}"}

    r2 = await ac.post("/api/projects", json={"title":"P1","docType":"docx","topic":"x","scaffold":"Hello"}, headers=headers)
    assert r2.status_code == 200
    proj = r2.json()
    pid = proj["id"]

    # generate
    r3 = await ac.post(f"/api/projects/{pid}/generate", json={}, headers=headers)
    assert r3.status_code == 200
    g = r3.json()
    assert "text" in g and "generationId" in g

    # refine (we need a section id). get project
    r4 = await ac.get(f"/api/projects/{pid}", headers=headers)
    sec = r4.json().get("sections", [])
    if sec:
        sid = sec[0]["id"]
        r5 = await ac.post(f"/api/projects/{pid}/refine", json={"sectionId": sid, "prompt": "improve"}, headers=headers)
        assert r5.status_code == 200

    # export
    r6 = await ac.post(f"/api/projects/{pid}/export", json={"format":"docx","sections":[],"includeComments":False}, headers=headers)
    assert r6.status_code == 200
