from app.repositories.friend import FriendshipRepository
from app.repositories.user import UserRepository
from app.models import User, Friendship
from app.core.exceptions import APIException
import logging

logger = logging.getLogger(__name__)

class FriendService:
    def __init__(self, friend_repo: FriendshipRepository, user_repo: UserRepository):
        self.friend_repo = friend_repo
        self.user_repo = user_repo

    async def send_friend_request(self, friend_id: int, current_user: User) -> dict:
        if friend_id == current_user.id:
            raise APIException(status_code=400, detail="Cannot add yourself")
        
        target_user = self.user_repo.get(friend_id)
        if not target_user:
            raise APIException(status_code=404, detail="User not found")

        # Check existing
        existing = self.friend_repo.get_friendship(current_user.id, friend_id)
        if existing:
            friendship = existing
        else:
            friendship = self.friend_repo.create(obj_in={"user_id": current_user.id, "friend_id": friend_id, "status": "pending"})

        # Broadcast handled in router via WS (we can leave it in router or move it here if we pass manager or use event system)
        # For simplicity, returning friendship details so router can broadcast
        return {"status": "success", "message": "Friend request sent", "data": friendship}

    def get_incoming_requests(self, current_user: User) -> list:
        requests = self.friend_repo.get_requests(current_user.id)
        enriched_requests = []
        for req in requests:
            requester = self.user_repo.get(req.user_id)
            enriched_requests.append({
                "id": req.id,
                "requester_id": req.user_id,
                "requester_name": requester.username if requester else "Unknown",
                "requester_photo": requester.profile_photo if requester else None,
                "created_at": req.created_at
            })
        return enriched_requests

    def accept_request(self, friendship_id: int, current_user: User) -> dict:
        friendship = self.friend_repo.get(friendship_id)
        if not friendship:
            raise APIException(status_code=404, detail="Request not found")
        
        if friendship.friend_id != current_user.id:
            raise APIException(status_code=403, detail="Not authorized")

        self.friend_repo.update(db_obj=friendship, obj_in={"status": "accepted"})
        return {"status": "success", "message": "Friend request accepted", "user_id": friendship.user_id}

    def get_my_friends(self, current_user: User) -> list:
        friend_ids = self.friend_repo.get_friends(current_user.id)
        friends = []
        for fid in friend_ids:
            u = self.user_repo.get(fid)
            if u:
                friends.append({
                    "id": u.id,
                    "username": u.username,
                    "full_name": u.full_name,
                    "profile_photo": u.profile_photo,
                    "trust_score": u.trust_score
                })
        return friends

    def search_users(self, q: str, current_user: User) -> list:
        if not q:
            return []
            
        from sqlmodel import select, or_, col
        statement = select(User).where(
            or_(
                col(User.username).ilike(f"%{q}%"), 
                col(User.full_name).ilike(f"%{q}%"),
                col(User.email).ilike(f"%{q}%")
            )
        ).where(User.id != current_user.id).limit(20)
        
        users = self.user_repo.session.exec(statement).all()
        results = []
        
        for u in users:
            friendship = self.friend_repo.get_friendship(current_user.id, u.id)
            status = "none"
            request_id = None
            if friendship:
                status = friendship.status
                if status == "pending" and friendship.friend_id == current_user.id:
                     status = "incoming_request" 
                elif status == "pending" and friendship.user_id == current_user.id:
                     status = "outgoing_request" 
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

    def get_friend_suggestions(self, current_user: User) -> list:
        my_friend_ids = self.friend_repo.get_friends(current_user.id)
        if not my_friend_ids:
            return []
            
        from sqlmodel import select, col
        candidate_ids = set()
        
        statement = select(Friendship).where(
            (col(Friendship.user_id).in_(my_friend_ids)) | 
            (col(Friendship.friend_id).in_(my_friend_ids))
        ).where(Friendship.status == "accepted")
        
        network_links = self.friend_repo.session.exec(statement).all()
        
        for link in network_links:
            c_id = None
            if link.user_id in my_friend_ids:
                c_id = link.friend_id
            elif link.friend_id in my_friend_ids:
                c_id = link.user_id
                
            if c_id:
                 if c_id == current_user.id: continue 
                 if c_id in my_friend_ids: continue 
                 candidate_ids.add(c_id)
                 
        if not candidate_ids:
            return []

        suggestions = []
        candidates_list = list(candidate_ids)[:10] 
        
        for mid in candidates_list:
            existing_link = self.friend_repo.get_friendship(current_user.id, mid)
            if existing_link:
                continue 
                
            u = self.user_repo.get(mid)
            if u:
                suggestions.append({
                    "id": u.id,
                    "username": u.username,
                    "full_name": u.full_name,
                    "profile_photo": u.profile_photo,
                    "mutual_count": 1 
                })
                
        return suggestions
