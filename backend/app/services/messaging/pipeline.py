import logging
from typing import Dict, Any, List
from datetime import datetime

from app.core.exceptions import APIException
from app.repositories.chat import MessageRepository
from app.events.bus import EventBus
from app.events.types import MessageCreatedEvent, MessageDeliveredEvent
from app.metrics.service import MetricsService
from app.audit.service import AuditService
from app.notifications.service import NotificationEngine
from app.services.text_moderator import moderate_text

from .entity import MessageEntity
from .conversation import ConversationService
from .status import MessageStatusMachine, MessageStatus
from .attachment import AttachmentHandler
from .delivery import DeliveryService

logger = logging.getLogger(__name__)

class MessagePipeline:
    def __init__(
        self, 
        msg_repo: MessageRepository,
        conv_service: ConversationService,
        status_machine: MessageStatusMachine,
        attachment_handler: AttachmentHandler,
        delivery_service: DeliveryService,
        event_bus: EventBus,
        metrics: MetricsService,
        audit: AuditService,
        notifier: NotificationEngine,
        group_membership_checker=None
    ):
        self.msg_repo = msg_repo
        self.conv_service = conv_service
        self.status_machine = status_machine
        self.attachment_handler = attachment_handler
        self.delivery_service = delivery_service
        self.event_bus = event_bus
        self.metrics = metrics
        self.audit = audit
        self.notifier = notifier
        # Optional hook: (group_id, user_id) -> bool. Injected by deps.py so the
        # domain pipeline can enforce group membership without a DB dependency.
        self.group_membership_checker = group_membership_checker

    async def process(self, msg: MessageEntity) -> MessageEntity:
        """
        The Enterprise Message Pipeline.
        Executes stages sequentially and robustly.
        """
        start_time = datetime.utcnow()
        
        try:
            # 1 & 2. Validation
            self._validate(msg)
            
            # 3. Permissions
            self._verify_permissions(msg)
            
            # 4. Conversation Resolution
            conversation = self.conv_service.resolve_conversation(msg.sender_id, msg.receiver_id, msg.group_id)
            msg.conversation_id = conversation.id
            
            # 5. Spam / Abuse Hook (Moderation)
            self._moderation_hook(msg)
            
            # 6. Attachment Validation
            msg = await self.attachment_handler.process_attachments(msg)
            if not msg._is_valid:
                raise APIException(status_code=400, detail=",".join(msg._validation_errors))
                
            # [Phase F1: Crypto Hook Placeholder] - Session Establishment
            self._crypto_establish_session(msg)
            
            # [Phase F1: Crypto Hook Placeholder] - Attachment Encryption
            self._crypto_encrypt_attachment(msg)
            
            # Transition to Queued
            msg.status = self.status_machine.transition(msg.status, MessageStatus.QUEUED.value)
            
            # [Phase F1: Crypto Hook Placeholder] - Signature Verification (for incoming E2EE messages)
            self._crypto_verify_signature(msg)
            
            # [Phase F1: Crypto Hook Placeholder] - Decryption (if server needs to process, but typically E2EE is opaque)
            self._crypto_decrypt_payload(msg)

            # [Phase F1: Crypto Hook Placeholder] - Encryption (for E2EE, server just routes, but this represents the stage)
            self._crypto_encrypt_payload(msg)
            
            # 7. Persistence
            msg = self._persist(msg)
            
            # Transition to Sent
            msg.status = self.status_machine.transition(msg.status, MessageStatus.SENDING.value)
            msg.status = self.status_machine.transition(msg.status, MessageStatus.SENT.value)
            
            # 8. Event Publication
            await self.event_bus.publish(MessageCreatedEvent(
                actor_id=msg.sender_id,
                payload={"message_id": msg.id, "conversation_id": msg.conversation_id}
            ))
            
            # 9. Notification (Push/Email for offline users - simulated async)
            # In real system, push notification service handles offline checks
            
            # 10. Metrics Collection
            latency_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
            self.metrics.increment("messages")
            self.metrics.record_latency("message_pipeline", latency_ms)
            
            # 11. Audit Logging
            self.audit.log_action("MESSAGE_SENT", msg.sender_id, f"Conversation:{msg.conversation_id}", "SUCCESS", details={"type": msg.type})
            
            # 12. Delivery Dispatch (WebSockets)
            recipients = [p for p in conversation.participant_ids if p != msg.sender_id]
            
            # Read Receipts Hook: We can optimistically mark as delivered to active socket
            msg.status = self.status_machine.transition(msg.status, MessageStatus.DELIVERED.value)
            
            await self.delivery_service.deliver_message(msg, recipients)
            
            await self.event_bus.publish(MessageDeliveredEvent(
                actor_id=msg.sender_id,
                payload={"message_id": msg.id}
            ))

            return msg
            
        except Exception as e:
            self.metrics.increment("errors")
            msg.status = MessageStatus.FAILED.value
            logger.error(f"Message pipeline failed: {str(e)}")
            raise e

    def _validate(self, msg: MessageEntity):
        if not msg.content and not msg.attachments:
            raise APIException(status_code=400, detail="Message cannot be empty")

    def _verify_permissions(self, msg: MessageEntity):
        # Group membership check: senders must be members of the target group.
        if msg.group_id and self.group_membership_checker is not None:
            try:
                if not self.group_membership_checker(msg.group_id, msg.sender_id):
                    raise APIException(status_code=403, detail="You are not a member of this group")
            except APIException:
                raise
            except Exception as e:
                logger.warning(f"Group membership check failed for group {msg.group_id}: {e}")

    def _moderation_hook(self, msg: MessageEntity):
        if msg.type == "text" and msg.content:
            mod_result = moderate_text(msg.content)
            if mod_result.get("is_flagged"):
                reason = "Blocked by policy"
                if mod_result.get("flags"):
                     reason = mod_result['flags'][0].get('label', reason)
                raise APIException(status_code=400, detail=f"Message blocked: {reason}")

    def _persist(self, msg: MessageEntity) -> MessageEntity:
        msg_data = {
            "sender_id": msg.sender_id,
            "sender_username": msg.sender_username,
            "receiver_id": msg.receiver_id,
            "group_id": msg.group_id,
            "content": msg.content,
            "type": msg.type,
            "created_at": msg.created_at
        }
        db_msg = self.msg_repo.create(obj_in=msg_data)
        msg.id = db_msg.id
        return msg

    # Phase F1: Cryptographic Hooks (Disabled placeholders)
    def _crypto_establish_session(self, msg: MessageEntity):
        pass

    def _crypto_encrypt_attachment(self, msg: MessageEntity):
        pass

    def _crypto_verify_signature(self, msg: MessageEntity):
        pass

    def _crypto_decrypt_payload(self, msg: MessageEntity):
        pass

    def _crypto_encrypt_payload(self, msg: MessageEntity):
        pass
