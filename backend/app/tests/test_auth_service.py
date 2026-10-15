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

