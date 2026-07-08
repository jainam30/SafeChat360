import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_pki_identity_registration():
    # Attempting without auth should fail
    response = client.post("/api/pki/keys/identity", json={
        "device_id": "test_device",
        "identity_key_b64": "mock_b64",
        "signed_prekey_b64": "mock_b64",
        "signature_b64": "mock_sig"
    })
    # Will be 401 because get_current_user requires a token
    assert response.status_code == 401

def test_pki_onetime_prekeys():
    response = client.post("/api/pki/keys/prekeys", json={
        "device_id": "test_device",
        "keys": [{"keyId": "1", "publicBytesB64": "mock"}]
    })
    assert response.status_code == 401

def test_pki_fetch_device_keys():
    response = client.get("/api/pki/keys/device/test_device?target_user_id=1")
    assert response.status_code == 401
