import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import User
from app.deps import get_current_user


@pytest.fixture
def test_client():
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_ice_servers_authenticated_default(test_client, monkeypatch):
    monkeypatch.delenv("TURN_SECRET", raising=False)
    monkeypatch.delenv("TURN_URLS", raising=False)
    monkeypatch.delenv("TURN_SERVER_URL", raising=False)

    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="alice", role="user", email="alice@test.com")

    response = test_client.get("/api/chat/ice-servers")
    assert response.status_code == 200
    data = response.json()
    assert "ice_servers" in data
    assert any("stun.l.google.com" in s.get("urls", "") for s in data["ice_servers"])


def test_ice_servers_with_turn_secret(test_client, monkeypatch):
    monkeypatch.setenv("TURN_URLS", "turn:turn.safechat.test:3478,turns:turn.safechat.test:5349")
    monkeypatch.setenv("TURN_SECRET", "super_secret_turn_key")

    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="alice", role="user", email="alice@test.com")

    response = test_client.get("/api/chat/ice-servers")
    assert response.status_code == 200
    data = response.json()
    turn_entries = [s for s in data["ice_servers"] if isinstance(s.get("urls"), list)]
    assert len(turn_entries) == 1
    assert "turn:turn.safechat.test:3478" in turn_entries[0]["urls"]
    assert "username" in turn_entries[0]
    assert "credential" in turn_entries[0]
    # Username format: {timestamp}:{user_id}
    assert ":1" in turn_entries[0]["username"]


def test_ice_servers_unauthorized(test_client):
    app.dependency_overrides.clear()
    response = test_client.get("/api/chat/ice-servers")
    assert response.status_code == 401


def test_rbac_review_queue_denied_for_regular_user(test_client):
    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="reguser", role="user", email="u@test.com")
    response = test_client.get("/api/review/queue")
    assert response.status_code == 403
    assert "Moderator or administrator privileges required" in response.json()["detail"]


def test_rbac_review_queue_allowed_for_moderator(test_client):
    app.dependency_overrides[get_current_user] = lambda: User(id=2, username="moduser", role="moderator", email="m@test.com")
    response = test_client.get("/api/review/queue")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_rbac_analytics_denied_for_regular_user(test_client):
    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="reguser", role="user", email="u@test.com")
    response = test_client.get("/api/analytics/stats")
    assert response.status_code == 403


def test_rbac_analytics_allowed_for_admin(test_client):
    app.dependency_overrides[get_current_user] = lambda: User(id=3, username="adminuser", role="admin", email="a@test.com")
    response = test_client.get("/api/analytics/stats")
    assert response.status_code == 200
    assert "overview" in response.json()


def test_rbac_history_denied_for_regular_user(test_client):
    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="reguser", role="user", email="u@test.com")
    response = test_client.get("/api/history")
    assert response.status_code == 403


def test_rbac_blocklist_denied_for_regular_user(test_client):
    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="reguser", role="user", email="u@test.com")
    response = test_client.post("/api/blocklist/", json={"term": "spam"})
    assert response.status_code == 403
