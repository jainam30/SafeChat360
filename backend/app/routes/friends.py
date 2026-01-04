from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select, or_, col
from typing import List, Dict
from app.db import get_session
from app import crud
from app.deps import get_current_user
from app.models import User, Friendship

router = APIRouter(prefix="/api/friends", tags=["friends"])

from app.routes.chat import manager
import json

@router.post("/request/{friend_id}")
async def send_friend_request(
    friend_id: int, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    if friend_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself")
    
    target_user = crud.get_user(session, friend_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    friendship = crud.create_friendship(session, current_user.id, friend_id)
    
    # Notify target
    await manager.broadcast(
        json.dumps({
            "type": "notification",
            "event": "friend_request",
            "sender_username": current_user.username,
            "sender_id": current_user.id
        }),
        receiver_id=friend_id
    )

    return {"status": "success", "message": "Friend request sent", "data": friendship}

@router.get("/requests")
def get_incoming_requests(
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    requests = crud.get_friendship_requests(session, current_user.id)
    # Enhance with requester details
    enriched_requests = []
    for req in requests:
        requester = crud.get_user(session, req.user_id)
        enriched_requests.append({
            "id": req.id,
            "requester_id": req.user_id,
            "requester_name": requester.username if requester else "Unknown",
            "requester_photo": requester.profile_photo,
            "created_at": req.created_at
        })
    return enriched_requests

@router.post("/accept/{friendship_id}")
async def accept_request(
    friendship_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verify this request belongs to current user
    friendship = session.get(Friendship, friendship_id)
    if not friendship:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if friendship.friend_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    updated = crud.update_friendship_status(session, friendship_id, "accepted")
    
    # Notify original requester
    await manager.broadcast(
        json.dumps({
            "type": "notification",
            "event": "friend_accepted",
            "sender_username": current_user.username,
            "sender_id": current_user.id
        }),
        receiver_id=friendship.user_id
    )

    return {"status": "success", "message": "Friend request accepted"}

@router.get("/")
def get_my_friends(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    friend_ids = crud.get_friends(session, current_user.id)
    friends = []
    for fid in friend_ids:
        u = crud.get_user(session, fid)
        if u:
            friends.append({
                "id": u.id,
                "username": u.username,
                "full_name": u.full_name,
                "profile_photo": u.profile_photo,
                "trust_score": u.trust_score
            })
    return friends

@router.get("/search")
def search_users(
    q: str = "",
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    try:
        if not q:
            return []
        
        # Search users by username or full name
        # Use ilike for case-insensitive search
        statement = select(User).where(
            or_(
                col(User.username).ilike(f"%{q}%"), 
                col(User.full_name).ilike(f"%{q}%"),
                col(User.email).ilike(f"%{q}%")
            )
        ).where(User.id != current_user.id).limit(20)
        
        users = session.exec(statement).all()
        results = []
        
        for u in users:
            # Check friendship status
            friendship = session.exec(select(Friendship).where(
                ((Friendship.user_id == current_user.id) & (Friendship.friend_id == u.id)) |
                ((Friendship.user_id == u.id) & (Friendship.friend_id == current_user.id))
            )).first()
            
            status = "none"
            request_id = None
            if friendship:
                status = friendship.status
                if status == "pending" and friendship.friend_id == current_user.id:
                     status = "incoming_request" # Waiting for me to accept
                elif status == "pending" and friendship.user_id == current_user.id:
                     status = "outgoing_request" # Waiting for them
                request_id = friendship.id
    
            results.append({
                "id": u.id,
                "username": u.username,
                "full_name": u.full_name,
                "profile_photo": u.profile_photo,
                "friendship_status": status,
                "friendship_id": request_id
            })
            
        return results
    except Exception as e:
        import traceback
        with open("error.log", "w") as f:
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
