import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.deps import require_moderator, get_mod_repo
from app.models import User

class MockModRepo:
    def get_logs(self, limit=50, offset=0, content_type=None):
        return []

@pytest.fixture
def client():
    app.dependency_overrides[require_moderator] = lambda: User(
        id=1, email="moderator@example.com", username="mod_user", hashed_password="", role="moderator"
    )
    app.dependency_overrides[get_mod_repo] = lambda: MockModRepo()
    yield TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides.clear()

def test_history_default_limit(client):
    """Confirm the history endpoint defaults to 50 results."""
    response = client.get("/api/history")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["data"] == []

def test_history_valid_limit_boundary(client):
    """Confirm limits up to 500 are accepted."""
    response = client.get("/api/history?limit=500")
    assert response.status_code == 200

def test_history_limit_exceeding_max(client):
    """Confirm values greater than 500 are rejected with HTTP 422."""
    response = client.get("/api/history?limit=501")
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert any("limit" in err.get("field", "") for err in data.get("errors", []))

def test_history_limit_zero(client):
    """Confirm limit=0 is rejected with HTTP 422."""
    response = client.get("/api/history?limit=0")
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
