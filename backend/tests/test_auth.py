import pytest

async def test_signup_and_login(test_app):
    ac = test_app
    # signup
    r = await ac.post("/api/auth/signup", json={"name": "Test", "email": "t@t.com", "password": "pass"})
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == "t@t.com"

    # login
    r2 = await ac.post("/api/auth/login", json={"email":"t@t.com","password":"pass"})
    assert r2.status_code == 200
    body = r2.json()
    assert "token" in body
    assert "user" in body
