from app.repositories.chat import MessageRepository
from app.repositories.user import UserRepository
from app.repositories.group import GroupRepository
from app.repositories.moderation import ModerationLogRepository
from app.models import User
from app.schemas.chat import SendMessageRequest
from app.core.exceptions import APIException
from datetime import datetime
import logging

from app.services.messaging.pipeline import MessagePipeline
from app.services.messaging.delivery import DeliveryService
from app.services.messaging.entity import MessageEntity

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self, msg_repo: MessageRepository, user_repo: UserRepository, group_repo: GroupRepository, mod_repo: ModerationLogRepository, pipeline: MessagePipeline, delivery: DeliveryService):
        self.msg_repo = msg_repo
        self.user_repo = user_repo
        self.group_repo = group_repo
        self.mod_repo = mod_repo
        self.pipeline = pipeline
        self.delivery = delivery

    def get_users(self, current_user: User) -> list:
        users = self.user_repo.session.exec(self.user_repo.session.query(User).where(User.id != current_user.id)).all()
        return [{
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "profile_photo": u.profile_photo
        } for u in users]

    def get_history(self, current_user: User, other_user_id: int = None, group_id: int = None) -> list:
        if group_id:
            results = self.msg_repo.get_group_history(group_id)
        elif other_user_id:
            results = self.msg_repo.get_private_history(current_user.id, other_user_id)
        else:
            results = self.msg_repo.get_global_history()
            
        filtered_results = []
        user_id_str = str(current_user.id)
        for msg in results:
            deleted_ids = (msg.deleted_by_ids or "").split(",")
            if user_id_str not in deleted_ids:
                filtered_results.append(msg)
                
        return filtered_results[::-1]

    def delete_message(self, message_id: int, mode: str, current_user: User) -> dict:
        message = self.msg_repo.get(message_id)
        if not message:
            raise APIException(status_code=404, detail="Message not found")

        if mode == "everyone":
            if message.sender_id != current_user.id:
                raise APIException(status_code=403, detail="Can only unsend your own messages")
            
            message.is_unsent = True
            message.content = "Message unsent"
            self.msg_repo.session.add(message)
            self.msg_repo.session.commit()
            
        elif mode == "me":
            current_deleted = (message.deleted_by_ids or "").split(",")
            if str(current_user.id) not in current_deleted:
                 if message.deleted_by_ids:
                     message.deleted_by_ids += f",{current_user.id}"
                 else:
                     message.deleted_by_ids = str(current_user.id)
                 self.msg_repo.session.add(message)
                 self.msg_repo.session.commit()

        return {"status": "success", "message": message}

    async def send_message_http(self, req: SendMessageRequest, current_user: User) -> dict:
        # Create Entity
        entity = MessageEntity(
            conversation_id="", # resolved in pipeline
            sender_id=current_user.id,
            sender_username=current_user.username,
            receiver_id=req.receiver_id,
            group_id=req.group_id,
            content=req.content,
            type="text"
        )
        
        # Dispatch to Pipeline
        processed_msg = await self.pipeline.process(entity)
        
        response_dict = {
            "type": "message",
            "id": processed_msg.id,
            "sender_id": processed_msg.sender_id,
            "sender_username": processed_msg.sender_username,
            "receiver_id": processed_msg.receiver_id,
            "group_id": processed_msg.group_id,
            "content": processed_msg.content,
            "msg_type": processed_msg.type,
            "status": processed_msg.status,
            "created_at": processed_msg.created_at.isoformat()
        }
        
        return response_dict

    async def process_websocket_message(self, message_data: dict, current_user: User) -> dict:
        content = message_data.get("content")
        
        receiver_id = message_data.get("receiver_id")
        if receiver_id is not None:
             try:
                 receiver_id = int(receiver_id)
             except ValueError:
                 receiver_id = None
                 
        group_id = message_data.get("group_id")
        if group_id is not None:
             try:
                 group_id = int(group_id)
             except ValueError:
                 group_id = None
                 
        msg_type = message_data.get("msg_type", "text")
        
        if msg_type in ["call-request", "call-response", "offer", "answer", "ice-candidate", "hang-up"]:
             from datetime import datetime
             entity = MessageEntity(
                 conversation_id="",
                 sender_id=current_user.id,
                 sender_username=current_user.username,
                 receiver_id=receiver_id,
                 group_id=group_id,
                 content=content or msg_type,
                 type=msg_type,
                 created_at=datetime.utcnow()
             )
             recipients = []
             if receiver_id:
                 recipients.append(receiver_id)
             await self.delivery.deliver_message(entity, recipients)
             
             if msg_type in ["answer", "hang-up"]:
                  log_entity = MessageEntity(
                       conversation_id="",
                       sender_id=current_user.id,
                       sender_username=current_user.username,
                       receiver_id=receiver_id,
                       group_id=group_id,
                       content=f"Voice Call {'Started' if msg_type == 'answer' else 'Ended'}",
                       type="call",
                       created_at=datetime.utcnow()
                  )
                  await self.pipeline.process(log_entity)
             return {}
             
        entity = MessageEntity(
            conversation_id="",
            sender_id=current_user.id,
            sender_username=current_user.username,
            receiver_id=receiver_id,
            group_id=group_id,
            content=content,
            type=msg_type
        )
        
        processed_msg = await self.pipeline.process(entity)
        
        response_dict = {
            "type": "message",
            "id": processed_msg.id,
            "sender_id": processed_msg.sender_id,
            "sender_username": processed_msg.sender_username,
            "receiver_id": processed_msg.receiver_id,
            "group_id": processed_msg.group_id,
            "content": processed_msg.content,
            "msg_type": processed_msg.type,
            "status": processed_msg.status,
            "created_at": processed_msg.created_at.isoformat()
        }
        
        return response_dict
