from fastapi import APIRouter, Depends
from typing import List, Dict
from app.deps import get_current_user, get_friend_service
from app.models import User
from app.services.friend import FriendService

router = APIRouter(prefix="/api/friends", tags=["friends"])

@router.post("/request/{friend_id}")
async def send_friend_request(
    friend_id: int, 
    current_user: User = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service)
):
    result = await service.send_friend_request(friend_id, current_user)
    
    # Notify target
    from app.routes.chat import manager
    import json
    await manager.broadcast(
        json.dumps({
            "type": "notification",
            "event": "friend_request",
            "sender_username": current_user.username,
            "sender_id": current_user.id
        }),
        receiver_id=friend_id
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
    
    # Notify original requester
    from app.routes.chat import manager
    import json
    await manager.broadcast(
        json.dumps({
            "type": "notification",
            "event": "friend_accepted",
            "sender_username": current_user.username,
            "sender_id": current_user.id
        }),
        receiver_id=result["user_id"]
    )
    return {"status": "success", "message": result["message"]}

@router.get("/")
def get_my_friends(
    current_user: User = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service)
):
    return service.get_my_friends(current_user)

@router.get("/search")
def search_users(
    q: str = "",
    current_user: User = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service)
):
    return service.search_users(q, current_user)

@router.get("/suggestions")
def get_friend_suggestions(
    current_user: User = Depends(get_current_user),
    service: FriendService = Depends(get_friend_service)
):
    return service.get_friend_suggestions(current_user)
