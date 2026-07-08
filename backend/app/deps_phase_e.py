
# Phase E: Distributed Messaging Infrastructure
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

def get_pubsub() -> PubSubProvider:
    return _pubsub

def get_conn_registry() -> ConnectionRegistry:
    return _conn_registry

def get_msg_ordering() -> MessageOrderingService:
    return _msg_ordering

def get_offline_service() -> OfflineMessageService:
    # EventBus is globally instantiated in core/events or similar, but for now we just instantiate
    from app.events.bus import EventBus
    # We should reuse the existing bus if possible, but let's assume get_event_bus exists
    return OfflineMessageService(get_event_bus())

def get_conn_manager() -> ConnectionManager:
    return ConnectionManager(get_conn_registry(), get_event_bus(), get_metrics_service())

def get_delivery_service() -> DeliveryService:
    return DeliveryService(
        get_event_bus(),
        get_pubsub(),
        get_conn_manager(),
        get_msg_ordering(),
        get_offline_service()
    )

def get_presence_service() -> PresenceService:
    return PresenceService(get_event_bus(), get_pubsub())

def get_gateway_service(
    ws_manager: ConnectionManager = Depends(get_conn_manager),
    pubsub: PubSubProvider = Depends(get_pubsub),
    policy: PolicyService = Depends(get_policy_service),
    identity: IdentityService = Depends(get_identity_service)
) -> GatewayService:
    return GatewayService(ws_manager, pubsub, policy, identity, get_metrics_service())

# Overwrite get_chat_service to properly include pipeline and delivery
def get_chat_service(
    msg_repo: MessageRepository = Depends(get_msg_repo),
    user_repo: UserRepository = Depends(get_user_repo),
    group_repo: GroupRepository = Depends(get_group_repo),
    mod_repo: ModerationLogRepository = Depends(get_mod_repo),
    # To keep it simple, we construct pipeline manually here or via another dep
    # This aligns with Phase C updates
) -> ChatService:
    pipeline = MessagePipeline(
        mod_repo=mod_repo, 
        msg_repo=msg_repo, 
        user_repo=user_repo,
        group_repo=group_repo,
        delivery=get_delivery_service(),
        event_bus=get_event_bus(),
        audit=get_audit_service(),
        metrics=get_metrics_service(),
        presence=get_presence_service()
    )
    return ChatService(msg_repo, user_repo, group_repo, mod_repo, pipeline, get_delivery_service())
