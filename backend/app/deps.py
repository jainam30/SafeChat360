from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlmodel import Session
from app.db import get_session
from app.models import User

from app.utils.security import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Tokens are issued with aud="safechat360-clients"; accept that audience.
        # (Tokens without an aud claim also pass, for legacy compatibility.)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], audience="safechat360-clients")
        # Tokens are issued by SessionService with "sub" = user id (string).
        # Older tokens may carry "email" instead; support both for a graceful transition.
        subject = payload.get("sub")
        email = payload.get("email")
        user_id = None
        if subject is not None:
            try:
                user_id = int(subject)
            except (TypeError, ValueError):
                user_id = None
    except jwt.ExpiredSignatureError:
        raise credentials_exception
    except JWTError:
        raise credentials_exception

    from app.repositories.user import UserRepository
    user_repo = UserRepository(session)
    user = None
    if user_id is not None:
        user = user_repo.get(user_id)
    elif email is not None:
        user = user_repo.get_by_email(email)
    if user is None:
        raise credentials_exception
    return user


async def require_moderator(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ["admin", "moderator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Moderator or administrator privileges required",
        )
    return current_user


from app.repositories.user import UserRepository
from app.repositories.chat import MessageRepository
from app.repositories.friend import FriendshipRepository
from app.repositories.group import GroupRepository
from app.repositories.moderation import ModerationLogRepository
from app.repositories.notification import NotificationRepository
from app.repositories.post import PostRepository

from app.services.auth import AuthService
from app.services.chat import ChatService
from app.services.friend import FriendService
from app.services.group import GroupService
from app.services.moderation import ModerationService
from app.services.notification import NotificationService
from app.services.social import SocialService
from app.services.user import UserService

# Messaging Core
from app.services.messaging.conversation import ConversationService
from app.services.messaging.status import MessageStatusMachine
from app.services.messaging.attachment import AttachmentHandler
from app.services.messaging.presence import PresenceService
from app.services.messaging.delivery import DeliveryService
from app.services.messaging.pipeline import MessagePipeline

# Identity & Security
from app.services.identity.service import IdentityService
from app.services.devices.service import DeviceService
from app.services.session.service import SessionService
from app.services.crypto.kms import KeyManagementService
from app.services.security.policy import PolicyService


def get_user_repo(session: Session = Depends(get_session)) -> UserRepository:
    return UserRepository(session)


def get_msg_repo(session: Session = Depends(get_session)) -> MessageRepository:
    return MessageRepository(session)


def get_friend_repo(session: Session = Depends(get_session)) -> FriendshipRepository:
    return FriendshipRepository(session)


def get_group_repo(session: Session = Depends(get_session)) -> GroupRepository:
    return GroupRepository(session)


def get_mod_repo(session: Session = Depends(get_session)) -> ModerationLogRepository:
    return ModerationLogRepository(session)


def get_notif_repo(session: Session = Depends(get_session)) -> NotificationRepository:
    return NotificationRepository(session)


def get_post_repo(session: Session = Depends(get_session)) -> PostRepository:
    return PostRepository(session)


# ---------------------------------------------------------------------------
# Core infrastructure singletons (real implementations, process-wide)
# ---------------------------------------------------------------------------
from app.events.bus import EventBus
from app.audit.service import AuditService
from app.metrics.service import MetricsService
from app.cache.memory import MemoryCache
from app.cache.service import CacheService
from app.queue.memory import MemoryQueue
from app.queue.service import QueueService
from app.storage.service import StorageService
from app.storage.supabase import SupabaseStorage
from app.notifications.providers import InAppProvider
from app.notifications.service import NotificationEngine

_event_bus = EventBus()
_audit_service = AuditService()
_metrics_service = MetricsService()
_cache_service = CacheService(MemoryCache())
_queue_service = QueueService(MemoryQueue())
_storage_service = StorageService(SupabaseStorage())
_notification_engine = NotificationEngine([InAppProvider()])


def get_event_bus() -> EventBus:
    return _event_bus


def get_audit_service() -> AuditService:
    return _audit_service


def get_metrics_service() -> MetricsService:
    return _metrics_service


def get_cache_service() -> CacheService:
    return _cache_service


def get_queue_service() -> QueueService:
    return _queue_service


def get_storage_service() -> StorageService:
    return _storage_service


def get_notification_engine() -> NotificationEngine:
    return _notification_engine


# Identity & Security providers
def get_identity_service() -> IdentityService:
    return IdentityService(get_event_bus(), get_audit_service())


def get_device_service(session: Session = Depends(get_session)) -> DeviceService:
    return DeviceService(session, get_event_bus(), get_audit_service())


def get_session_service(device_service: DeviceService = Depends(get_device_service)) -> SessionService:
    return SessionService(get_cache_service(), get_event_bus(), get_audit_service(), device_service)


def get_policy_service(
    device_service: DeviceService = Depends(get_device_service),
    identity_service: IdentityService = Depends(get_identity_service),
) -> PolicyService:
    return PolicyService(device_service, identity_service)


def get_auth_service(
    user_repo: UserRepository = Depends(get_user_repo),
    session_service: SessionService = Depends(get_session_service),
) -> AuthService:
    return AuthService(user_repo, session_service)


def get_user_service(user_repo: UserRepository = Depends(get_user_repo)) -> UserService:
    return UserService(user_repo)


def get_friend_service(
    friend_repo: FriendshipRepository = Depends(get_friend_repo),
    user_repo: UserRepository = Depends(get_user_repo),
    msg_repo: MessageRepository = Depends(get_msg_repo),
) -> FriendService:
    return FriendService(friend_repo, user_repo, msg_repo=msg_repo)


def get_group_service(
    group_repo: GroupRepository = Depends(get_group_repo),
    user_repo: UserRepository = Depends(get_user_repo),
) -> GroupService:
    return GroupService(group_repo, user_repo)


def get_notif_service(notif_repo: NotificationRepository = Depends(get_notif_repo)) -> NotificationService:
    return NotificationService(notif_repo)


def get_mod_service(
    mod_repo: ModerationLogRepository = Depends(get_mod_repo),
    user_repo: UserRepository = Depends(get_user_repo),
) -> ModerationService:
    return ModerationService(mod_repo, user_repo)


def get_chat_service(
    msg_repo: MessageRepository = Depends(get_msg_repo),
    user_repo: UserRepository = Depends(get_user_repo),
    group_repo: GroupRepository = Depends(get_group_repo),
    mod_repo: ModerationLogRepository = Depends(get_mod_repo),
) -> ChatService:
    conv_service = ConversationService(
        group_members_resolver=lambda gid: [m.user_id for m in group_repo.get_members(gid)],
        online_users_resolver=lambda: _conn_registry.get_online_user_ids(),
    )
    pipeline = MessagePipeline(
        msg_repo=msg_repo,
        conv_service=conv_service,
        status_machine=MessageStatusMachine(),
        attachment_handler=AttachmentHandler(_storage_service, _queue_service, _audit_service),
        delivery_service=get_delivery_service(),
        event_bus=get_event_bus(),
        metrics=get_metrics_service(),
        audit=get_audit_service(),
        notifier=get_notification_engine(),
        group_membership_checker=group_repo.is_member,
    )
    return ChatService(msg_repo, user_repo, group_repo, mod_repo, pipeline, get_delivery_service())


def get_social_service(
    post_repo: PostRepository = Depends(get_post_repo),
    user_repo: UserRepository = Depends(get_user_repo),
    friend_repo: FriendshipRepository = Depends(get_friend_repo),
    notif_repo: NotificationRepository = Depends(get_notif_repo),
    mod_repo: ModerationLogRepository = Depends(get_mod_repo),
) -> SocialService:
    return SocialService(post_repo, user_repo, friend_repo, notif_repo, mod_repo)


# ---------------------------------------------------------------------------
# Distributed messaging infrastructure
# ---------------------------------------------------------------------------
from app.pubsub.memory import MemoryPubSub
from app.pubsub.provider import PubSubProvider
from app.websocket.registry import ConnectionRegistry
from app.websocket.manager import ConnectionManager
from app.websocket.gateway import GatewayService
from app.services.messaging.ordering import MessageOrderingService
from app.services.messaging.offline import OfflineMessageService

_pubsub = MemoryPubSub()
_conn_registry = ConnectionRegistry()
_msg_ordering = MessageOrderingService()
_conn_manager = ConnectionManager(_conn_registry, _event_bus, _metrics_service)
_offline_service = OfflineMessageService(_event_bus)
_delivery_service = DeliveryService(
    _event_bus, _pubsub, _conn_manager, _msg_ordering, _offline_service
)


def get_pubsub() -> PubSubProvider:
    return _pubsub


def get_conn_registry() -> ConnectionRegistry:
    return _conn_registry


def get_msg_ordering() -> MessageOrderingService:
    return _msg_ordering


def get_offline_service() -> OfflineMessageService:
    return _offline_service


def get_conn_manager() -> ConnectionManager:
    return _conn_manager


def get_delivery_service() -> DeliveryService:
    return _delivery_service


def get_presence_service() -> PresenceService:
    return PresenceService(get_event_bus(), get_pubsub())


def get_gateway_service(
    ws_manager: ConnectionManager = Depends(get_conn_manager),
    pubsub: PubSubProvider = Depends(get_pubsub),
    policy: PolicyService = Depends(get_policy_service),
    identity: IdentityService = Depends(get_identity_service),
) -> GatewayService:
    return GatewayService(ws_manager, pubsub, policy, identity, get_metrics_service())
