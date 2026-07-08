from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from typing import Optional
import json

from app.deps import get_current_user, get_chat_service, get_gateway_service, get_session
from app.models import User
from app.schemas.chat import SendMessageRequest
from app.services.chat import ChatService
from app.websocket.gateway import GatewayService

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.get("/users")
def get_users(
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service)
):
    return service.get_users(current_user)

@router.get("/history")
def get_chat_history(
    other_user_id: Optional[int] = None,
    group_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service)
):
    return service.get_history(current_user, other_user_id, group_id)

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    client_id: str, 
    device_id: str = "web_browser", # Ideally parsed from query params
    token: str = None,
    gateway: GatewayService = Depends(get_gateway_service),
    service: ChatService = Depends(get_chat_service)
):
    try:
        user_id = int(client_id)
    except:
        await websocket.close()
        return

    # Mock user object retrieval for business logic context
    from app.db import engine
    from sqlmodel import Session
    with Session(engine) as session:
        user = session.get(User, user_id)
        if not user:
            user = User(id=user_id, username=f"user_{user_id}", email=f"{user_id}@test.com", hashed_password="")

    # Gateway handles security, pub/sub registration, and metrics
    ctx = await gateway.accept_connection(websocket, user_id, device_id, token)
    if not ctx:
        return

    # Define a callback for the gateway to process business messages
    async def process_message(msg_data: dict, uid: int, did: str):
        await service.process_websocket_message(msg_data, user)

    # Hand over control to the Gateway's read loop
    await gateway.handle_loop(ctx, process_message)


@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: int, 
    mode: str = Query(..., regex="^(me|everyone)$"),
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service)
):
    result = service.delete_message(message_id, mode, current_user)
    
    if mode == "everyone":
        message = result["message"]
        # Use ChatService -> Pipeline -> DeliveryService for broadcasting now
        from app.deps import get_delivery_service
        delivery = get_delivery_service()
        await delivery.broadcast_event(
            {
                "type": "message_update",
                "id": message.id,
                "is_unsent": True,
                "content": "Message unsent"
            },
            recipient_ids=[message.receiver_id, message.sender_id] if message.receiver_id else []
        )
    return {"status": "success"}

@router.post("/send")
async def send_message_http(
    req: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service)
):
    # This automatically runs through the Pipeline and dispatches via DeliveryService
    response_dict = await service.send_message_http(req, current_user)
    return response_dict
