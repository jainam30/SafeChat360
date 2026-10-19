from typing import List, Optional, Dict
from sqlmodel import select, or_, and_, col
from app.repositories.friend import FriendshipRepository
from app.repositories.user import UserRepository
from app.models import User, Friendship, Notification
from app.core.exceptions import APIException
import logging

logger = logging.getLogger(__name__)

class FriendService:
    def __init__(self, friend_repo: FriendshipRepository, user_repo: UserRepository, msg_repo=None):
        self.friend_repo = friend_repo
        self.user_repo = user_repo
        self.msg_repo = msg_repo  # Optional: powers last_message/unread_count enrichment

    def _create_notification(self, user_id: int, notif_type: str, current_user: User, reference_id: Optional[int] = None):
        """Helper to persist in-app notifications for offline and durable tracking."""
        try:
            notif = Notification(
                user_id=user_id,
                type=notif_type,
                source_id=current_user.id,
                source_name=current_user.username,
                reference_id=reference_id,
                is_read=False
            )
            self.user_repo.session.add(notif)
            self.user_repo.session.commit()
        except Exception as e:
            logger.warning(f"Could not persist notification: {e}")
            self.user_repo.session.rollback()

    async def send_friend_request(self, friend_id: int, current_user: User) -> dict:
        if friend_id == current_user.id:
            raise APIException(status_code=400, detail="Cannot add yourself")
        
        target_user = self.user_repo.get(friend_id)
        if not target_user:
            raise APIException(status_code=404, detail="User not found")

        # Check existing friendship record
        existing = self.friend_repo.get_friendship(current_user.id, friend_id)
        if existing:
            if existing.status == "accepted":
                return {
                    "status": "info",
                    "message": "You are already friends",
                    "data": {"id": existing.id, "status": "accepted"}
                }
            elif existing.status == "pending":
                if existing.user_id == current_user.id:
                    # Idempotent duplicate: request already sent by current_user
                    return {
                        "status": "info",
                        "message": "Friend request already sent",
                        "friendship_id": existing.id,
                        "data": {"id": existing.id, "status": "pending"}
                    }
                else:
                    # Target user had already sent a request to current_user: auto-accept!
                    self.friend_repo.update(db_obj=existing, obj_in={"status": "accepted"})
                    self._create_notification(
                        user_id=existing.user_id,
                        notif_type="friend_accepted",
                        current_user=current_user,
                        reference_id=existing.id
                    )
                    return {
                        "status": "success",
                        "message": "Friend request accepted",
                        "friendship_id": existing.id,
                        "data": {"id": existing.id, "status": "accepted"}
                    }
            elif existing.status == "rejected":
                # Re-open request as pending from current_user
                self.friend_repo.update(db_obj=existing, obj_in={
                    "user_id": current_user.id,
                    "friend_id": friend_id,
                    "status": "pending"
                })
                friendship = existing
            else:
                friendship = existing
        else:
            friendship = self.friend_repo.create(obj_in={
                "user_id": current_user.id,
                "friend_id": friend_id,
                "status": "pending"
            })

        # Persist notification for target user
        self._create_notification(
            user_id=friend_id,
            notif_type="friend_request",
            current_user=current_user,
            reference_id=friendship.id
        )

        return {
            "status": "success",
            "message": "Friend request sent",
            "friendship_id": friendship.id,
            "data": {"id": friendship.id, "status": "pending"}
        }

    def get_incoming_requests(self, current_user: User) -> list:
        requests = self.friend_repo.get_requests(current_user.id)
        if not requests:
            return []

        # Batch-fetch all requesters in a single query (eliminates N+1)
        requester_ids = list({req.user_id for req in requests})
        requesters = {u.id: u for u in self.user_repo.get_users_by_ids(requester_ids)}

        enriched_requests = []
        for req in requests:
            requester = requesters.get(req.user_id)
            enriched_requests.append({
                "id": req.id,
                "requester_id": req.user_id,
                "requester_name": requester.full_name or requester.username if requester else "Unknown",
                "requester_username": requester.username if requester else "unknown",
                "requester_photo": requester.profile_photo if requester else None,
                "created_at": req.created_at
            })
        return enriched_requests

    def accept_request(self, friendship_id: int, current_user: User) -> dict:
        friendship = self.friend_repo.get(friendship_id)
        if not friendship:
            raise APIException(status_code=404, detail="Request not found")
        
        # Authorization check: only recipient can accept
        if friendship.friend_id != current_user.id:
            raise APIException(status_code=403, detail="Not authorized")

        self.friend_repo.update(db_obj=friendship, obj_in={"status": "accepted"})
        
        # Persist acceptance notification
        self._create_notification(
            user_id=friendship.user_id,
            notif_type="friend_accepted",
            current_user=current_user,
            reference_id=friendship.id
        )

        return {"status": "success", "message": "Friend request accepted", "user_id": friendship.user_id}

    def reject_request(self, friendship_id: int, current_user: User) -> dict:
        friendship = self.friend_repo.get(friendship_id)
        if not friendship:
            raise APIException(status_code=404, detail="Request not found")
        
        # Either the recipient declines, or the sender cancels
        if friendship.friend_id == current_user.id:
            self.friend_repo.update(db_obj=friendship, obj_in={"status": "rejected"})
            return {"status": "success", "message": "Friend request declined"}
        elif friendship.user_id == current_user.id:
            self.friend_repo.delete(id=friendship.id)
            return {"status": "success", "message": "Friend request cancelled"}
        else:
            raise APIException(status_code=403, detail="Not authorized")

    def get_my_friends(self, current_user: User) -> list:
        friend_ids = self.friend_repo.get_friends(current_user.id)
        if not friend_ids:
            return []

        # Batch-fetch all friend User records in a single query (eliminates N+1)
        users = self.user_repo.get_users_by_ids(friend_ids)
        users_map = {u.id: u for u in users}

        friends = []
        for fid in friend_ids:
            u = users_map.get(fid)
            if u:
                entry = {
                    "id": u.id,
                    "username": u.username,
                    "full_name": u.full_name,
                    "profile_photo": u.profile_photo,
                    "trust_score": u.trust_score,
                }
                if self.msg_repo is not None:
                    last = self.msg_repo.get_last_private_message(current_user.id, fid)
                    if last is not None:
                        entry["last_message"] = last.content
                        entry["last_message_at"] = last.created_at.isoformat() if last.created_at else None
                    entry["unread_count"] = self.msg_repo.count_unread_private(current_user.id, fid)
                friends.append(entry)
        return friends

    def search_users(self, q: str = "", current_user: User = None, limit: int = 20, query: str = "") -> list:
        search_text = (q or query or "").strip()
        if not search_text:
            return []
        
        # Enforce query length limits
        search_text = search_text[:50]
        max_limit = min(max(1, limit), 50)
            
        # Search by username or full_name only (never email/phone to prevent enumeration)
        statement = select(User).where(
            or_(
                col(User.username).ilike(f"%{search_text}%"), 
                col(User.full_name).ilike(f"%{search_text}%")
            )
        ).where(User.id != current_user.id).limit(max_limit)
        
        users = self.user_repo.session.exec(statement).all()
        if not users:
            return []

        # Batch-fetch friendships for all returned users in a single query (eliminates N+1)
        user_ids = [u.id for u in users]
        f_statement = select(Friendship).where(
            or_(
                and_(Friendship.user_id == current_user.id, col(Friendship.friend_id).in_(user_ids)),
                and_(Friendship.friend_id == current_user.id, col(Friendship.user_id).in_(user_ids))
            )
        )
        friendships = self.user_repo.session.exec(f_statement).all()
        
        # Map: other_user_id -> Friendship
        f_map = {}
        for f in friendships:
            other_id = f.friend_id if f.user_id == current_user.id else f.user_id
            f_map[other_id] = f
        
        results = []
        for u in users:
            friendship = f_map.get(u.id)
            status = "none"
            request_id = None
            if friendship:
                if friendship.status == "accepted":
                    status = "accepted"
                elif friendship.status == "pending":
                    if friendship.friend_id == current_user.id:
                        status = "incoming_request" 
                    elif friendship.user_id == current_user.id:
                        status = "outgoing_request" 
                elif friendship.status == "rejected":
                    status = "rejected"
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

    def get_friend_suggestions(self, current_user: User, limit: int = 10) -> list:
        my_friend_ids = set(self.friend_repo.get_friends(current_user.id))
        max_limit = min(max(1, limit), 20)
        candidate_ids = set()
        
        # 1. First find mutual friends (friends of friends)
        if my_friend_ids:
            statement = select(Friendship).where(
                (col(Friendship.user_id).in_(my_friend_ids)) | 
                (col(Friendship.friend_id).in_(my_friend_ids))
            ).where(Friendship.status == "accepted")
            
            network_links = self.friend_repo.session.exec(statement).all()
            for link in network_links:
                c_id = link.friend_id if link.user_id in my_friend_ids else link.user_id
                if c_id and c_id != current_user.id and c_id not in my_friend_ids:
                    candidate_ids.add(c_id)
        
        # 2. If candidates are fewer than requested limit, supplement with community users
        # Exclude current user and already connected friends
        exclude_ids = my_friend_ids | {current_user.id} | candidate_ids
        if len(candidate_ids) < max_limit:
            needed = max_limit - len(candidate_ids)
            recent_stmt = select(User.id).where(
                col(User.id).not_in(list(exclude_ids)) if exclude_ids else True
            ).order_by(col(User.created_at).desc()).limit(needed)
            recent_ids = self.user_repo.session.exec(recent_stmt).all()
            candidate_ids.update(recent_ids)

        if not candidate_ids:
            return []

        # Batch-fetch all candidate User records in 1 query
        candidates_list = list(candidate_ids)[:max_limit]
        candidate_users = {u.id: u for u in self.user_repo.get_users_by_ids(candidates_list)}
        
        # Batch-check existing friendships
        f_stmt = select(Friendship).where(
            or_(
                and_(Friendship.user_id == current_user.id, col(Friendship.friend_id).in_(candidates_list)),
                and_(Friendship.friend_id == current_user.id, col(Friendship.user_id).in_(candidates_list))
            )
        )
        existing_friendships = {
            (f.friend_id if f.user_id == current_user.id else f.user_id): f
            for f in self.user_repo.session.exec(f_stmt).all()
        }

        suggestions = []
        for mid in candidates_list:
            existing_link = existing_friendships.get(mid)
            if existing_link and existing_link.status == "accepted":
                continue 
                
            u = candidate_users.get(mid)
            if u:
                status = "none"
                if existing_link:
                    if existing_link.status == "pending":
                        status = "outgoing_request" if existing_link.user_id == current_user.id else "incoming_request"
                    else:
                        status = existing_link.status

                suggestions.append({
                    "id": u.id,
                    "username": u.username,
                    "full_name": u.full_name,
                    "profile_photo": u.profile_photo,
                    "mutual_count": 1 if mid in my_friend_ids else 0,
                    "friendship_status": status,
                    "friendship_id": existing_link.id if existing_link else None
                })
                
        return suggestions

