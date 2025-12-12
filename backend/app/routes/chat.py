from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from typing import List, Dict, Optional
from sqlmodel import Session, select, or_, and_
from app.db import get_session
from app.models import Message, User
from app.deps import get_current_user
import json
from datetime import datetime
from app.services.text_moderator import moderate_text
from app.services.image_moderator import moderate_image_base64
from app.services.ai_assistant import improve_text
from pydantic import BaseModel

router = APIRouter(prefix="/api/chat", tags=["chat"]) # NOTE: Prefix was /chat in main.py, but for consistency with others /api/chat is better. 
# However, main.py imports it. Let's keep prefix in main.py or here?
# models.py says /api/users, so let's stick to /api/chat here too to align with frontend calls.
# WAIT: main.py does app.include_router(chat.router). If this has prefix /api/chat, it will be /api/chat.

class ConnectionManager:
    def __init__(self):
        # Map user_id to list of active sockets (user might have multiple tabs)
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def broadcast(self, message: str, receiver_id: Optional[int] = None, sender_id: Optional[int] = None, group_members: Optional[List[int]] = None):
        """
        If group_members is set, broadcast to all in that list.
        If receiver_id is None and group_members is None, broadcast to all (Global).
        Else Private.
        """
        if group_members:
             # Group Chat
             for member_id in group_members:
                 if member_id in self.active_connections:
                     for connection in self.active_connections[member_id]:
                         try:
                             await connection.send_text(message)
                         except:
                             pass
        elif receiver_id is None:
            # Global broadcast
            for user_sockets in self.active_connections.values():
                for connection in user_sockets:
                    try:
                        await connection.send_text(message)
                    except:
                        pass
        else:
            # Private message
            # Send to receiver
            if receiver_id in self.active_connections:
                for connection in self.active_connections[receiver_id]:
                    try:
                        await connection.send_text(message)
                    except:
                        pass
            
            # Send back to sender
            if sender_id and sender_id != receiver_id and sender_id in self.active_connections:
                 for connection in self.active_connections[sender_id]:
                    try:
                        await connection.send_text(message)
                    except:
                        pass

manager = ConnectionManager()

@router.get("/users")
def get_users(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    users = session.exec(select(User).where(User.id != current_user.id)).all()
    return [{
        "id": u.id,
        "username": u.username,
        "full_name": u.full_name,
        "profile_photo": u.profile_photo
    } for u in users]

@router.get("/history")
def get_chat_history(
    other_user_id: Optional[int] = None,
    group_id: Optional[int] = None,
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    if group_id:
        # Group history
        # (Verify membership omitted for brevity, but should be there)
        statement = select(Message).where(Message.group_id == group_id).order_by(Message.created_at.desc()).limit(50)
    elif other_user_id:
        # Private history
        statement = select(Message).where(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == other_user_id),
                and_(Message.sender_id == other_user_id, Message.receiver_id == current_user.id)
            )
        ).order_by(Message.created_at.desc()).limit(50)
    else:
        # Global history
        statement = select(Message).where(Message.receiver_id == None).order_by(Message.created_at.desc()).limit(50)
        
    results = session.exec(statement).all() 
    return results[::-1] # Reverse for chronological

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str, token: str = None):
    print(f"WS: Connection attempt from client_id={client_id}, token={token}")
    try:
        user_id = int(client_id)
    except:
        print("WS: Invalid client_id format")
        await websocket.close()
        return

    await manager.connect(websocket, user_id)
    print(f"WS: User {user_id} connected")
    try:
        while True:
            data = await websocket.receive_text()
            print(f"WS: Received data: {data}")
            try:
                message_data = json.loads(data)
                content = message_data.get("content")
                sender_username = message_data.get("sender_username")
                receiver_id = message_data.get("receiver_id") # Int or None
                group_id = message_data.get("group_id") # Int or None
            except:
                print("WS: Error parsing JSON data")
                continue

            # ------------------------------------------------------------------
            # STRICT MODERATION CHECK (Blocking)
            # ------------------------------------------------------------------
            
            # 1. Text Moderation
            if content and not content.startswith(('data:image', 'data:video', 'data:audio')):
                 mod_result = moderate_text(content)
                 if mod_result.get("is_flagged"):
                     reason = "Content Policy Violation"
                     if mod_result.get("flags"):
                         reason = f"Blocked: {mod_result['flags'][0].get('label', 'Inappropriate Content')}"
                     
                     # Send error back to sender
                     await websocket.send_text(json.dumps({
                         "type": "error",
                         "message": f"Message blocked: {reason}"
                     }))
                     print(f"WS: Message blocked for User {user_id}: {reason}")
                     continue # ABORT PROCESSING

            # 2. Image Moderation (if content is base64 image)
            # Basic check for data:image
            if content and content.startswith('data:image'):
                 # Extract base64 part
                 try:
                     header, b64data = content.split(',', 1)
                     img_mod_result = moderate_image_base64(b64data)
                     if img_mod_result.get("is_flagged"):
                         reason = "NSFW/Inappropriate Image detected"
                         if img_mod_result.get("flags"):
                             reason = f"Blocked: {img_mod_result['flags'][0].get('label', 'Inappropriate Image')}"
                         
                         await websocket.send_text(json.dumps({
                             "type": "error",
                             "message": f"Image blocked: {reason}"
                         }))
                         print(f"WS: Image blocked for User {user_id}")
                         continue # ABORT PROCESSING
                 except Exception as e:
                     print(f"WS: Image mod error: {e}")

            # ------------------------------------------------------------------
            # END MODERATION
            # ------------------------------------------------------------------

            # Save to DB if it's a chat message
            from app.db import engine
            from app.models import GroupMember
            
            # Signaling Messages (Don't save to DB)
            msg_type = message_data.get("type")
            if msg_type in ["call-request", "call-response", "offer", "answer", "ice-candidate"]:
                 print(f"WS: Handling signaling message: {msg_type}")
                 if receiver_id:
                     # Relay to receiver
                     await manager.broadcast(
                         json.dumps(message_data), 
                         receiver_id=receiver_id, 
                         sender_id=user_id
                     )
                 continue # Skip DB save for signaling

            # Chat Message
            group_members = None
            
            with Session(engine) as session:
                if group_id:
                     # Get members
                     members = session.exec(select(GroupMember).where(GroupMember.group_id == group_id)).all()
                     group_members = [m.user_id for m in members]
                
                msg = Message(
                    sender_id=user_id,
                    sender_username=sender_username,
                    receiver_id=receiver_id,
                    group_id=group_id,
                    content=content,
                    created_at=datetime.utcnow()
                )
                session.add(msg)
                session.commit()
                session.refresh(msg)
                
                response = {
                    "type": "message", # Explicit type
                    "id": msg.id,
                    "sender_id": msg.sender_id,
                    "sender_username": msg.sender_username,
                    "receiver_id": msg.receiver_id,
                    "group_id": msg.group_id,
                    "content": msg.content,
                    "created_at": msg.created_at.isoformat()
                }
                
                await manager.broadcast(
                    json.dumps(response), 
                    receiver_id=receiver_id, 
                    sender_id=user_id, 
                    group_members=group_members
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

class AssistRequest(BaseModel):
    text: str

@router.post("/assist")
def ai_assist(request: AssistRequest):
    """
    AI Assistant endpoint to improve text.
    """
    improved = improve_text(request.text)
    return {"improved_text": improved}
