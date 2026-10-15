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
async def test_auth_verify_identity_password_sync(monkeypatch):
    repo = MockUserRepo()
    session_svc = MockSessionService()
    auth_svc = AuthService(repo, session_svc)

    # Seed user with legacy dummy hash
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

    # Verify identity and pass new password to sync
    await auth_svc.verify_identity(VerifyRequest(
        firebase_token="valid_fb_token",
        password="NewSecurePassword456",
        device_id="desktop_browser"
    ))

    # User's password should now verify against NewSecurePassword456!
    from app.utils.security import verify_password
    is_valid, _ = verify_password("NewSecurePassword456", user.hashed_password)
    assert is_valid is True

def test_jwt_claims_and_audience():
    from app.services.session.service import SessionService
    from app.cache.service import CacheService
    from app.events.bus import EventBus
    from app.audit.service import AuditService
    from app.services.devices.service import DeviceService
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
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM], audience="safechat360-clients")
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
    
    # 1. Valid Token
    valid_token = svc.create_access_token(data={"sub": "101", "device_id": "ws_client"})
    assert verify_ws_token(valid_token) == 101

    # 2. Expired Token
    expired_token = svc.create_access_token(data={"sub": "101"}, expires_delta=timedelta(seconds=-10))
    assert verify_ws_token(expired_token) is None

    # 3. Token with Wrong Audience
    wrong_aud_token = jwt.encode({"sub": "101", "aud": "evil-client"}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    assert verify_ws_token(wrong_aud_token) is None

    # 4. Token without sub
    no_sub_token = svc.create_access_token(data={"email": "test@example.com"})
    assert verify_ws_token(no_sub_token) is None

    # 5. Empty token
    assert verify_ws_token(None) is None
    assert verify_ws_token("") is None

def test_cors_exception_origin_check():
    from app.core.exceptions import _get_cors_headers
    from starlette.datastructures import Headers

    class DummyRequest:
        def __init__(self, origin):
            self.headers = Headers({"origin": origin} if origin else {})

    # 1. Allowed Production Domain
    h1 = _get_cors_headers(DummyRequest("https://safe-chat360.vercel.app"))
    assert h1.get("Access-Control-Allow-Origin") == "https://safe-chat360.vercel.app"

    # 2. Allowed Vercel Preview Domain
    h2 = _get_cors_headers(DummyRequest("https://safe-chat360-preview-abc.vercel.app"))
    assert h2.get("Access-Control-Allow-Origin") == "https://safe-chat360-preview-abc.vercel.app"

    # 3. Allowed Localhost Domain
    h3 = _get_cors_headers(DummyRequest("http://localhost:5173"))
    assert h3.get("Access-Control-Allow-Origin") == "http://localhost:5173"

    # 4. Disallowed External Attacker Domain
    h4 = _get_cors_headers(DummyRequest("https://evil-attacker.vercel.app"))
    assert "Access-Control-Allow-Origin" not in h4

    # 5. Completely Unrelated Origin
    h5 = _get_cors_headers(DummyRequest("https://attacker.com"))
    assert "Access-Control-Allow-Origin" not in h5

