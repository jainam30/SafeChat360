import pytest
from app.services.auth import AuthService
from app.schemas.auth import RegisterRequest, LoginRequest, VerifyRequest
from app.models import User
from app.core.exceptions import APIException
from app.utils.security import get_secure_password_hash

class MockUserRepo:
    def __init__(self):
        self.users = {}
        self.session = self

    def add(self, obj):
        self.users[obj.id] = obj

    def commit(self):
        pass

    def get_by_email(self, email: str):
        for u in self.users.values():
            if u.email == email:
                return u
        return None

    def get_by_username(self, username: str):
        for u in self.users.values():
            if u.username == username:
                return u
        return None

    def get_by_phone(self, phone: str):
        for u in self.users.values():
            if u.phone_number == phone:
                return u
        return None

    def create(self, obj_in: dict):
        new_id = len(self.users) + 1
        user = User(
            id=new_id,
            email=obj_in["email"],
            username=obj_in["username"],
            hashed_password=obj_in["hashed_password"],
            phone_number=obj_in.get("phone_number"),
            full_name=obj_in.get("full_name"),
            role=obj_in.get("role", "user")
        )
        self.users[new_id] = user
        return user

    def get_active_sessions_count(self, user_id: int):
        return 1

class MockSessionService:
    async def create_session(self, user_id: int, device_id: str, user_agent: str, ip: str, email=None, username=None, role=None):
        return {
            "access_token": f"mock_token_{user_id}",
            "token_type": "bearer",
            "refresh_token": f"mock_refresh_{user_id}"
        }

@pytest.mark.asyncio
async def test_auth_login_success():
    repo = MockUserRepo()
    session_svc = MockSessionService()
    auth_svc = AuthService(repo, session_svc)

    # Seed user with argon2 password
    hashed = get_secure_password_hash("SecretPassword123")
    user = repo.create({
        "email": "test@example.com",
        "username": "testuser",
        "hashed_password": hashed,
        "phone_number": "+1234567890",
        "full_name": "Test User",
        "role": "user"
    })

    # Test login by email
    tokens = await auth_svc.login(LoginRequest(
        identifier="test@example.com",
        password="SecretPassword123",
        device_id="test_dev"
    ))
    assert tokens["access_token"] == f"mock_token_{user.id}"

    # Test login by username
    tokens_by_username = await auth_svc.login(LoginRequest(
        identifier="testuser",
        password="SecretPassword123",
        device_id="test_dev"
    ))
    assert tokens_by_username["access_token"] == f"mock_token_{user.id}"

@pytest.mark.asyncio
async def test_auth_login_invalid_password():
    repo = MockUserRepo()
    session_svc = MockSessionService()
    auth_svc = AuthService(repo, session_svc)

    hashed = get_secure_password_hash("SecretPassword123")
    repo.create({
        "email": "test@example.com",
        "username": "testuser",
        "hashed_password": hashed,
        "phone_number": "+1234567890",
        "full_name": "Test User",
        "role": "user"
    })

    with pytest.raises(APIException) as exc_info:
        await auth_svc.login(LoginRequest(
            identifier="test@example.com",
            password="WrongPassword!",
            device_id="test_dev"
        ))
    assert exc_info.value.status_code == 401
    assert "Invalid credentials" in exc_info.value.detail

@pytest.mark.asyncio
async def test_auth_login_nonexistent_user():
    repo = MockUserRepo()
    session_svc = MockSessionService()
    auth_svc = AuthService(repo, session_svc)

    with pytest.raises(APIException) as exc_info:
        await auth_svc.login(LoginRequest(
            identifier="nonexistent@example.com",
            password="AnyPassword123",
            device_id="test_dev"
        ))
    assert exc_info.value.status_code == 401
    assert "Invalid credentials" in exc_info.value.detail

@pytest.mark.asyncio
async def test_auth_register_duplicate_checks(monkeypatch):
    repo = MockUserRepo()
    session_svc = MockSessionService()
    auth_svc = AuthService(repo, session_svc)

    # Mock firebase token verification
    from firebase_admin import auth as firebase_auth
    monkeypatch.setattr(firebase_auth, "verify_id_token", lambda tok, **kwargs: {"email": "duplicate@example.com"})

    # Seed existing user
    repo.create({
        "email": "duplicate@example.com",
        "username": "existinguser",
        "hashed_password": "existinghash",
        "phone_number": "+1999999999",
        "full_name": "Existing",
        "role": "user"
    })

    # 1. Attempt duplicate email
    with pytest.raises(APIException) as exc1:
        await auth_svc.register(RegisterRequest(
            email="duplicate@example.com",
            username="newuser",
            phone_number="+1000000000",
            password="Password123",
            firebase_token="valid_token"
        ))
    assert exc1.value.status_code == 400
    assert "Email already registered" in exc1.value.detail

    # 2. Attempt duplicate username
    monkeypatch.setattr(firebase_auth, "verify_id_token", lambda tok, **kwargs: {"email": "newemail@example.com"})
    with pytest.raises(APIException) as exc2:
        await auth_svc.register(RegisterRequest(
            email="newemail@example.com",
            username="existinguser",
            phone_number="+1000000000",
            password="Password123",
            firebase_token="valid_token"
        ))
    assert exc2.value.status_code == 400
    assert "Username already taken" in exc2.value.detail

    # 3. Attempt duplicate phone number
    with pytest.raises(APIException) as exc3:
        await auth_svc.register(RegisterRequest(
            email="newemail@example.com",
            username="newuser2",
            phone_number="+1999999999",
            password="Password123",
            firebase_token="valid_token"
        ))
    assert exc3.value.status_code == 400
    assert "Phone number already registered" in exc3.value.detail

    # 4. Successful registration
    reg_result = await auth_svc.register(RegisterRequest(
        email="newemail@example.com",
        username="newuser_unique",
        phone_number="+1222333444",
        password="ValidPassword123",
        firebase_token="valid_token"
    ))
    assert reg_result["status"] == "success"
    assert "access_token" in reg_result
    assert "access_token" in reg_result["data"]
    # Check that role is user
    assert reg_result["data"]["role"] == "user"

@pytest.mark.asyncio
async def test_auth_register_prevents_role_escalation(monkeypatch):
    repo = MockUserRepo()
    session_svc = MockSessionService()
    auth_svc = AuthService(repo, session_svc)

    from firebase_admin import auth as firebase_auth
    monkeypatch.setattr(firebase_auth, "verify_id_token", lambda tok, **kwargs: {"email": "hacker@example.com"})

    # Attempt to pass role="admin"
    reg_result = await auth_svc.register(RegisterRequest(
        email="hacker@example.com",
        username="hacker_user",
        phone_number="+1888777666",
        password="SecretPassword123",
        role="admin",
        firebase_token="valid_token"
    ))
    assert reg_result["data"]["role"] == "user"
    saved_user = repo.get_by_email("hacker@example.com")
    assert saved_user.role == "user"

@pytest.mark.asyncio
async def test_auth_verify_identity_jit_and_collision_handling(monkeypatch):
    repo = MockUserRepo()
    session_svc = MockSessionService()
    auth_svc = AuthService(repo, session_svc)

    # Pre-populate a user with username 'john'
    repo.create({
        "email": "existing_john@example.com",
        "username": "john",
        "hashed_password": "somehash",
        "role": "user"
    })

    from firebase_admin import auth as firebase_auth
    monkeypatch.setattr(firebase_auth, "verify_id_token", lambda tok, **kwargs: {
        "email": "john@anotherdomain.com",
        "name": "John Doe",
        "email_verified": True
    })

    # Verify identity for john@anotherdomain.com - should JIT provision and avoid username collision
    tokens = await auth_svc.verify_identity(VerifyRequest(
        firebase_token="valid_fb_token",
        device_id="mobile_app"
    ))
    assert "access_token" in tokens

    new_user = repo.get_by_email("john@anotherdomain.com")
    assert new_user is not None
    assert new_user.username != "john" # Must have resolved collision
    assert new_user.username.startswith("john_")
    assert new_user.role == "user"

@pytest.mark.asyncio
async def test_auth_verify_identity_heals_corrupted_hash(monkeypatch):
    repo = MockUserRepo()
    session_svc = MockSessionService()
    auth_svc = AuthService(repo, session_svc)

    # Seed user with legacy corrupted dummy hash
    user = repo.create({
        "email": "charu@example.com",
        "username": "charu",
        "hashed_password": "$2b$12$imMeVPcMyn9md.m/..//dummyhashfallbackignoredanyway",
        "role": "user"
    })

    from firebase_admin import auth as firebase_auth
    monkeypatch.setattr(firebase_auth, "verify_id_token", lambda tok, **kwargs: {
        "email": "charu@example.com",
        "email_verified": True
    })

    # Verify identity without sending plaintext passwords
    tokens = await auth_svc.verify_identity(VerifyRequest(
        firebase_token="valid_fb_token",
        device_id="desktop_browser"
    ))

    assert "access_token" in tokens
    # User's corrupted hash must be healed to a secure Argon2id hash
    assert not user.hashed_password.startswith("$2b$12$imMe")
    assert len(user.hashed_password) >= 60

def test_jwt_claims_and_audience():
    from app.services.session.service import SessionService
    from app.core.config import settings
    from jose import jwt

    class DummyCache: pass
    class DummyBus: pass
    class DummyAudit: pass
    class DummyDevices: pass

    svc = SessionService(DummyCache(), DummyBus(), DummyAudit(), DummyDevices())
    token = svc.create_access_token(data={
        "sub": "42",
        "email": "alice@example.com",
        "username": "alice",
        "role": "user",
        "device_id": "dev_123"
    })

    # Decode and check claims
    payload = jwt.decode(
        token, 
        settings.SECRET_KEY, 
        algorithms=[settings.ALGORITHM], 
        audience="safechat360-clients",
        issuer="safechat360"
    )
    assert payload["sub"] == "42"
    assert payload["email"] == "alice@example.com"
    assert payload["username"] == "alice"
    assert payload["role"] == "user"
    assert payload["aud"] == "safechat360-clients"
    assert payload["iss"] == "safechat360"
    assert "exp" in payload

def test_websocket_token_verification():
    from app.websocket.gateway import verify_ws_token
    from app.services.session.service import SessionService
    from jose import jwt
    from app.core.config import settings
    from datetime import datetime, timedelta

    svc = SessionService(None, None, None, None)
    
    # 1. Valid Token with correct issuer and audience
    valid_token = svc.create_access_token(data={"sub": "101", "device_id": "ws_client"})
    assert verify_ws_token(valid_token) == 101

    # 2. Expired Token
    expired_token = svc.create_access_token(data={"sub": "101"}, expires_delta=timedelta(seconds=-10))
    assert verify_ws_token(expired_token) is None

    # 3. Invalid Signature (wrong secret key)
    wrong_sig_token = jwt.encode(
        {"sub": "101", "aud": "safechat360-clients", "iss": "safechat360"},
        "totally-wrong-secret-key-that-does-not-match",
        algorithm="HS256"
    )
    assert verify_ws_token(wrong_sig_token) is None

    # 4. Token without sub claim
    no_sub_token = svc.create_access_token(data={"email": "test@example.com"})
    assert verify_ws_token(no_sub_token) is None

    # 5. Invalid Issuer
    wrong_issuer_token = jwt.encode(
        {"sub": "101", "aud": "safechat360-clients", "iss": "untrusted-issuer"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    assert verify_ws_token(wrong_issuer_token) is None

    # 6. Invalid Audience
    wrong_aud_token = jwt.encode(
        {"sub": "101", "aud": "evil-client-audience", "iss": "safechat360"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    assert verify_ws_token(wrong_aud_token) is None

    # 7. Empty or None token
    assert verify_ws_token(None) is None
    assert verify_ws_token("") is None

def test_websocket_endpoint_mismatched_client_identity():
    from fastapi.testclient import TestClient
    from starlette.websockets import WebSocketDisconnect
    from app.main import app
    from app.services.session.service import SessionService

    client = TestClient(app)
    svc = SessionService(None, None, None, None)
    token = svc.create_access_token(data={"sub": "2", "device_id": "dev_test"})

    # 1. Mismatched client ID (token is for user 2, client requests user 9999)
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect("/api/chat/ws/9999?token=" + token):
            pass
    assert exc_info.value.code == 4003

    # 2. Invalid / forged token
    with pytest.raises(WebSocketDisconnect) as exc_info2:
        with client.websocket_connect("/api/chat/ws/2?token=invalid_token_123"):
            pass
    assert exc_info2.value.code == 4001

def test_asgi_middleware_cors_and_exception_stack():
    from fastapi.testclient import TestClient
    from app.main import app
    from app.deps import get_auth_service

    app.dependency_overrides[get_auth_service] = lambda: AuthService(MockUserRepo(), MockSessionService())
    try:
        client = TestClient(app, raise_server_exceptions=False)

        # 1. Normal route with approved production origin
        r1 = client.get("/health", headers={"Origin": "https://safe-chat360.vercel.app"})
        assert r1.status_code == 200
        assert r1.headers.get("access-control-allow-origin") == "https://safe-chat360.vercel.app"
        assert r1.headers.get("access-control-allow-credentials") == "true"

        # 2. Normal route with approved local development origin
        r2 = client.get("/health", headers={"Origin": "http://localhost:5173"})
        assert r2.status_code == 200
        assert r2.headers.get("access-control-allow-origin") == "http://localhost:5173"

        # 3. Normal route with arbitrary, unapproved *.vercel.app origin (MUST BE DENIED)
        r3 = client.get("/health", headers={"Origin": "https://random-attacker.vercel.app"})
        assert r3.status_code == 200
        assert r3.headers.get("access-control-allow-origin") is None

        # 4. APIException response with approved origin
        r4 = client.post("/api/auth/login", json={"identifier": "nonexistent", "password": "wrong"}, headers={"Origin": "https://safe-chat360.vercel.app"})
        assert r4.status_code == 401
        assert r4.headers.get("access-control-allow-origin") == "https://safe-chat360.vercel.app"

        # 5. APIException response with arbitrary, unapproved *.vercel.app origin (MUST BE DENIED)
        r5 = client.post("/api/auth/login", json={"identifier": "nonexistent", "password": "wrong"}, headers={"Origin": "https://random-attacker.vercel.app"})
        assert r5.status_code == 401
        assert r5.headers.get("access-control-allow-origin") is None

        # 6. APIException response with external attacker origin (MUST BE DENIED)
        r6 = client.post("/api/auth/login", json={"identifier": "nonexistent", "password": "wrong"}, headers={"Origin": "https://malicious-website.com"})
        assert r6.status_code == 401
        assert r6.headers.get("access-control-allow-origin") is None
    finally:
        app.dependency_overrides.clear()

