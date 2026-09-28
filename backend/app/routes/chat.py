from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from typing import Optional, List
import json

from app.deps import (
    get_current_user,
    get_chat_service,
    get_gateway_service,
    get_conn_registry,
    get_group_repo,
    get_msg_repo,
)
from app.models import User
from app.schemas.chat import SendMessageRequest, AssistRequest
from app.services.chat import ChatService
from app.websocket.gateway import GatewayService

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.get("/users")
def get_users(
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    return service.get_users(current_user)


@router.get("/history")
def get_chat_history(
    other_user_id: Optional[int] = None,
    group_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    return service.get_history(current_user, other_user_id, group_id)


@router.websocket("/ws/{client_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    client_id: str,
    device_id: str = "web_browser",
    token: str = None,
    gateway: GatewayService = Depends(get_gateway_service),
    service: ChatService = Depends(get_chat_service),
):
    # The token is the only source of identity. client_id is untrusted.
    from app.websocket.gateway import verify_ws_token

    token_user_id = verify_ws_token(token)
    if token_user_id is None:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    # Impersonation guard: URL id must match the token's id
    try:
        requested_id = int(client_id)
    except (TypeError, ValueError):
        await websocket.close(code=4003, reason="Invalid client id")
        return
    if requested_id != token_user_id:
        await websocket.close(code=4003, reason="User mismatch")
        return

    from app.db import engine
    from sqlmodel import Session

    with Session(engine) as session:
        user = session.get(User, token_user_id)
        if not user:
            await websocket.close(code=4003, reason="Unknown user")
            return

    # Device policy is skipped: device_id from the query string is not a
    # trustworthy signal, and a valid JWT is sufficient authorization here.
    ctx = await gateway.accept_connection(websocket, token_user_id, device_id, token, skip_device_policy=True)
    if not ctx:
        return

    async def process_message(msg_data: dict, uid: int, did: str):
        await service.process_websocket_message(msg_data, user)

    await gateway.handle_loop(ctx, process_message)


@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: int,
    mode: str = Query(..., pattern="^(me|everyone)$"),
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    result = service.delete_message(message_id, mode, current_user)

    if mode == "everyone":
        message = result["message"]
        from app.deps import get_delivery_service

        recipients: List[int] = []
        if message.receiver_id:
            recipients = [message.receiver_id, message.sender_id]
        elif message.group_id:
            # Group unsend: notify all members
            group_repo = get_group_repo()
            recipients = [m.user_id for m in group_repo.get_members(message.group_id)]
        else:
            # Global unsend: notify everyone online
            recipients = get_conn_registry().get_online_user_ids()

        delivery = get_delivery_service()
        await delivery.broadcast_event(
            {
                "type": "message_update",
                "id": message.id,
                "is_unsent": True,
                "content": "Message unsent",
            },
            recipient_ids=recipients,
        )
    return {"status": "success"}


@router.post("/send")
async def send_message_http(
    req: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    response_dict = await service.send_message_http(req, current_user)
    return response_dict


@router.post("/read")
async def mark_messages_read(
    req: dict,
    current_user: User = Depends(get_current_user),
    msg_repo=Depends(get_msg_repo),
):
    """Marks messages as read by the current user (powers unread badges)."""
    message_ids = req.get("message_ids") or []
    if not isinstance(message_ids, list):
        raise HTTPException(status_code=400, detail="message_ids must be a list")
    try:
        ids = [int(m) for m in message_ids][:500]
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid message ids")
    marked = msg_repo.mark_read(current_user.id, ids)
    return {"status": "success", "marked": marked}


@router.get("/vibe", response_model=dict)
def vibe_check(
    other_user_id: Optional[int] = None,
    group_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    msg_repo=Depends(get_msg_repo),
):
    """
    Real Vibe Check: analyzes the most recent messages in the active conversation
    with the existing moderation stack (keywords + translation + toxic-bert) and
    returns a 0-100 health score.
    """
    from app.services.text_moderator import moderate_text

    if group_id:
        recent = msg_repo.get_group_history(group_id, limit=10)
    elif other_user_id:
        recent = msg_repo.get_private_history(current_user.id, other_user_id, limit=10)
    else:
        recent = msg_repo.get_global_history(limit=10)

    if not recent:
        return {"score": 100, "status": "safe", "analyzed": 0, "flags": []}

    flags = []
    penalty = 0
    analyzed = 0
    for msg in reversed(recent):  # oldest -> newest
        if msg.is_unsent or msg.type not in ("text", None):
            continue
        analyzed += 1
        result = moderate_text(msg.content or "")
        if result.get("is_flagged"):
            labels = [f.get("label", "flag") for f in result.get("flags", [])]
            flags.append({"message_id": msg.id, "labels": labels})
            penalty += 25  # each flagged message costs 25 points

    score = max(0, 100 - penalty)
    status_label = "safe" if score >= 80 else ("tense" if score >= 40 else "unsafe")
    return {"score": score, "status": status_label, "analyzed": analyzed, "flags": flags}


@router.post("/assist")
async def ai_assist(
    req: AssistRequest,
    current_user: User = Depends(get_current_user),
):
    """AI writing assist: improves grammar/tone of the drafted message."""
    import os
    import logging

    logger = logging.getLogger(__name__)
    text = (req.text or "").strip()
    if not text:
        return {"improved_text": text}

    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        try:
            import requests

            resp = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a writing assistant inside a chat app. Improve grammar, "
                            "clarity and tone of the user's draft message. Keep the same language, "
                            "meaning and approximate length. Reply with ONLY the improved message text, "
                            "no quotes, no explanations.",
                        },
                        {"role": "user", "content": text},
                    ],
                    "temperature": 0.4,
                    "max_tokens": 300,
                },
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
            improved = (data.get("choices") or [{}])[0].get("message", {}).get("content", "").strip()
            if improved:
                return {"improved_text": improved}
        except Exception as e:
            logger.warning(f"AI assist LLM call failed, using fallback: {e}")

    # Fallback: deterministic local cleanup so the feature still adds value offline
    improved = text
    replacements = {
        " u ": " you ",
        " ur ": " your ",
        " pls ": " please ",
        " plz ": " please ",
        " thx ": " thanks ",
        " asap": " as soon as possible",
    }
    for k, v in replacements.items():
        improved = improved.replace(k, v)
    improved = improved.strip()
    if improved and improved[0].islower():
        improved = improved[0].upper() + improved[1:]
    return {"improved_text": improved}
