from fastapi import APIRouter, Depends
from typing import List, Dict
import json
from app.deps import get_current_user, get_friend_service, get_delivery_service
from app.models import User
from app.services.friend import FriendService
from app.services.messaging.delivery import DeliveryService

router = APIRouter(prefix="/api/friends", tags=["friends"])

from pydantic import BaseModel

class FriendRequestBody(BaseModel):
    friend_id: int

@router.post("/request")
async def send_friend_request_body(
    body: FriendRequestBody,
    current_user: User = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service)
):
    result = await service.send_friend_request(body.friend_id, current_user)
    delivery: DeliveryService = get_delivery_service()
    await delivery.broadcast_event(
        {
            "type": "notification",
            "event": "friend_request",
            "sender_username": current_user.username,
            "sender_id": current_user.id
        },
        recipient_ids=[body.friend_id]
    )
    return result

@router.post("/request/{friend_id}")
async def send_friend_request(
    friend_id: int, 
    current_user: User = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service)
):
    result = await service.send_friend_request(friend_id, current_user)

    # Notify target over their realtime channel (if online)
    delivery: DeliveryService = get_delivery_service()
    await delivery.broadcast_event(
        {
            "type": "notification",
            "event": "friend_request",
            "sender_username": current_user.username,
            "sender_id": current_user.id
        },
        recipient_ids=[friend_id]
    )
    return result

@router.get("/requests")
def get_incoming_requests(
    current_user: User = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service)
):
    return service.get_incoming_requests(current_user)

@router.post("/accept/{friendship_id}")
async def accept_request(
    friendship_id: int,
    current_user: User = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service)
):
    result = service.accept_request(friendship_id, current_user)

    # Notify original requester over their realtime channel (if online)
    delivery: DeliveryService = get_delivery_service()
    await delivery.broadcast_event(
        {
            "type": "notification",
            "event": "friend_accepted",
            "sender_username": current_user.username,
            "sender_id": current_user.id
        },
        recipient_ids=[result["user_id"]]
    )
    return {"status": "success", "message": result["message"]}

@router.post("/reject/{friendship_id}")
def reject_request(
    friendship_id: int,
    current_user: User = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service)
):
    return service.reject_request(friendship_id, current_user)

@router.get("/")
def get_my_friends(
    current_user: User = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service)
):
    return service.get_my_friends(current_user)

@router.get("/search")
def search_users(
    q: str = "",
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service)
):
    return service.search_users(q, current_user, limit=limit)

@router.get("/suggestions")
def get_friend_suggestions(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service)
):
    return service.get_friend_suggestions(current_user, limit=limit)

