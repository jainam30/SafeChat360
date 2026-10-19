import pytest
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from app.models import User, Friendship
from app.repositories.user import UserRepository
from app.repositories.friend import FriendshipRepository
from app.services.friend import FriendService
from app.core.exceptions import APIException

@pytest.fixture(name="db_session")
def db_session_fixture():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

@pytest.fixture(name="friend_service")
def friend_service_fixture(db_session: Session):
    user_repo = UserRepository(db_session)
    friend_repo = FriendshipRepository(db_session)
    return FriendService(friend_repo=friend_repo, user_repo=user_repo)

def test_user_search_exact_and_case_insensitive(db_session: Session, friend_service: FriendService):
    u1 = User(id=1, username="alice", full_name="Alice Wonderland", email="alice@test.com", phone_number="111", hashed_password="h1")
    u2 = User(id=2, username="bob_builder", full_name="Bob Builder", email="bob@test.com", phone_number="222", hashed_password="h2")
    db_session.add(u1)
    db_session.add(u2)
    db_session.commit()

    # Exact search
    results = friend_service.search_users(query="bob_builder", current_user=u1)
    assert len(results) == 1
    assert results[0]["username"] == "bob_builder"
    assert results[0]["friendship_status"] == "none"
    assert "email" not in results[0]
    assert "phone_number" not in results[0]

    # Case & whitespace search
    results_case = friend_service.search_users(query="  BOB_BUILDER  ", current_user=u1)
    assert len(results_case) == 1
    assert results_case[0]["username"] == "bob_builder"

def test_user_search_excludes_self(db_session: Session, friend_service: FriendService):
    u1 = User(id=1, username="alice", full_name="Alice", email="alice@test.com", phone_number="111", hashed_password="h1")
    db_session.add(u1)
    db_session.commit()

    results = friend_service.search_users(query="alice", current_user=u1)
    assert len(results) == 0

def test_user_search_query_bounds(db_session: Session, friend_service: FriendService):
    u1 = User(id=1, username="alice", full_name="Alice", email="alice@test.com", phone_number="111", hashed_password="h1")
    db_session.add(u1)
    db_session.commit()

    # Empty or whitespace returns empty
    assert friend_service.search_users(query="   ", current_user=u1) == []
    assert friend_service.search_users(query="", current_user=u1) == []

@pytest.mark.asyncio
async def test_friend_request_lifecycle_and_idempotency(db_session: Session, friend_service: FriendService):
    u1 = User(id=1, username="alice", full_name="Alice", email="alice@test.com", phone_number="111", hashed_password="h1")
    u2 = User(id=2, username="bob", full_name="Bob", email="bob@test.com", phone_number="222", hashed_password="h2")
    db_session.add(u1)
    db_session.add(u2)
    db_session.commit()

    # 1. Send request
    res = await friend_service.send_friend_request(friend_id=2, current_user=u1)
    assert res["status"] == "success"
    f_id = res["friendship_id"]

    # Search status from sender should now be 'outgoing_request'
    res_search_u1 = friend_service.search_users(query="bob", current_user=u1)
    assert res_search_u1[0]["friendship_status"] == "outgoing_request"

    # Search status from recipient should be 'incoming_request'
    res_search_u2 = friend_service.search_users(query="alice", current_user=u2)
    assert res_search_u2[0]["friendship_status"] == "incoming_request"

    # 2. Duplicate request is idempotent
    dup_res = await friend_service.send_friend_request(friend_id=2, current_user=u1)
    assert dup_res["status"] == "info"
    assert dup_res["friendship_id"] == f_id

    # 3. Recipient accepts request
    acc_res = friend_service.accept_request(friendship_id=f_id, current_user=u2)
    assert acc_res["status"] == "success"

    # Both users should now see each other as accepted friends
    friends_u1 = friend_service.get_my_friends(u1)
    friends_u2 = friend_service.get_my_friends(u2)
    assert len(friends_u1) == 1 and friends_u1[0]["id"] == 2
    assert len(friends_u2) == 1 and friends_u2[0]["id"] == 1

@pytest.mark.asyncio
async def test_friend_request_unauthorized_tampering(db_session: Session, friend_service: FriendService):
    u1 = User(id=1, username="alice", full_name="Alice", email="alice@test.com", phone_number="111", hashed_password="h1")
    u2 = User(id=2, username="bob", full_name="Bob", email="bob@test.com", phone_number="222", hashed_password="h2")
    u3 = User(id=3, username="charlie", full_name="Charlie", email="charlie@test.com", phone_number="333", hashed_password="h3")
    db_session.add_all([u1, u2, u3])
    db_session.commit()

    # u1 sends to u2
    res = await friend_service.send_friend_request(friend_id=2, current_user=u1)
    f_id = res["friendship_id"]

    # u3 tries to accept
    with pytest.raises(APIException) as exc_info:
        friend_service.accept_request(friendship_id=f_id, current_user=u3)
    assert exc_info.value.status_code == 403

    # u3 tries to reject
    with pytest.raises(APIException) as exc_info_rej:
        friend_service.reject_request(friendship_id=f_id, current_user=u3)
    assert exc_info_rej.value.status_code == 403

@pytest.mark.asyncio
async def test_friend_request_reject(db_session: Session, friend_service: FriendService):
    u1 = User(id=1, username="alice", full_name="Alice", email="alice@test.com", phone_number="111", hashed_password="h1")
    u2 = User(id=2, username="bob", full_name="Bob", email="bob@test.com", phone_number="222", hashed_password="h2")
    db_session.add_all([u1, u2])
    db_session.commit()

    res = await friend_service.send_friend_request(friend_id=2, current_user=u1)
    f_id = res["friendship_id"]

    # u2 declines request
    rej_res = friend_service.reject_request(friendship_id=f_id, current_user=u2)
    assert rej_res["status"] == "success"

    # Incoming requests should now be empty
    assert len(friend_service.get_incoming_requests(u2)) == 0
