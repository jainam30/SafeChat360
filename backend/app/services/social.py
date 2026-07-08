from app.repositories.post import PostRepository
from app.repositories.user import UserRepository
from app.repositories.friend import FriendshipRepository
from app.repositories.notification import NotificationRepository
from app.repositories.moderation import ModerationLogRepository
from app.schemas.social import PostCreate, PostUpdate, CommentCreate, StoryCreate
from app.models import User, Story, SavedPost
from app.services.text_moderator import moderate_text
from app.services.image_moderator import moderate_image_base64
from app.core.exceptions import APIException
from sqlmodel import select
import datetime
import logging

logger = logging.getLogger(__name__)

class SocialService:
    def __init__(
        self, 
        post_repo: PostRepository, 
        user_repo: UserRepository, 
        friend_repo: FriendshipRepository,
        notif_repo: NotificationRepository,
        mod_repo: ModerationLogRepository
    ):
        self.post_repo = post_repo
        self.user_repo = user_repo
        self.friend_repo = friend_repo
        self.notif_repo = notif_repo
        self.mod_repo = mod_repo

    def create_post(self, post_in: PostCreate, current_user: User) -> dict:
        moderation_result = moderate_text(post_in.content)
        is_flagged = moderation_result.get("is_flagged", False)
        flag_reason = None
        
        if is_flagged:
            flags = moderation_result.get("flags", [])
            if flags:
                 flag_reason = f"{flags[0].get('label')} ({flags[0].get('score')})"
            else:
                 flag_reason = "Flagged by moderator"
                 
            self.mod_repo.log(
                content_type="text",
                content_excerpt=post_in.content,
                is_flagged=True,
                details=str(moderation_result),
                source=str(current_user.id)
            )
            
            new_score = max(0, current_user.trust_score - 10)
            self.user_repo.update(db_obj=current_user, obj_in={"trust_score": new_score})
            raise APIException(status_code=400, detail="Post rejected: Content contains inappropriate text.")

        if post_in.media_url and "base64" in post_in.media_url and post_in.media_type == 'image':
            b64_str = post_in.media_url.split(",")[1]
            image_mod_result = moderate_image_base64(b64_str)
            
            if image_mod_result.get("is_flagged"):
                 self.mod_repo.log(
                    content_type="image",
                    content_excerpt="image_upload",
                    is_flagged=True,
                    details=str(image_mod_result),
                    source=str(current_user.id)
                 )
                 new_score = max(0, current_user.trust_score - 20)
                 self.user_repo.update(db_obj=current_user, obj_in={"trust_score": new_score})
                 raise APIException(status_code=400, detail="Post rejected: Image contains inappropriate content.")

        self.mod_repo.log(
            content_type="text",
            content_excerpt=post_in.content,
            is_flagged=is_flagged,
            details=str(moderation_result),
            source=str(current_user.id)
        )

        allowed_users_str = None
        if post_in.privacy == 'private' and post_in.allowed_users:
            allowed_users_str = ",".join(map(str, post_in.allowed_users))

        post_data = {
            "content": post_in.content,
            "user_id": current_user.id,
            "username": current_user.username,
            "media_url": post_in.media_url,
            "media_type": post_in.media_type,
            "is_flagged": is_flagged,
            "flag_reason": flag_reason,
            "privacy": post_in.privacy,
            "allowed_users": allowed_users_str
        }
        
        post = self.post_repo.create(obj_in=post_data)
        
        return {
            "id": post.id,
            "content": post.content,
            "username": post.username,
            "user_id": post.user_id,
            "media_url": post.media_url,
            "media_type": post.media_type,
            "is_flagged": post.is_flagged,
            "flag_reason": post.flag_reason,
            "created_at": post.created_at.isoformat(),
            "privacy": post.privacy,
            "author_photo": current_user.profile_photo
        }

    def get_posts(self, current_user: User, limit: int = 100, offset: int = 0) -> list:
        friend_ids = self.friend_repo.get_friends(current_user.id)
        posts = self.post_repo.get_visible_posts(current_user.id, friend_ids, limit, offset)
        
        response = []
        for post in posts:
            user = self.user_repo.get(post.user_id)
            likes = self.post_repo.get_likes_count(post.id)
            comments = len(self.post_repo.get_comments(post.id))
            has_liked = self.post_repo.has_user_liked(current_user.id, post.id)
            is_saved = self.post_repo.session.exec(select(SavedPost).where(SavedPost.user_id == current_user.id, SavedPost.post_id == post.id)).first() is not None

            response.append({
                "id": post.id,
                "content": post.content,
                "username": user.username if user else "Unknown",
                "user_id": post.user_id,
                "media_url": post.media_url,
                "media_type": post.media_type,
                "is_flagged": post.is_flagged,
                "flag_reason": post.flag_reason,
                "created_at": post.created_at.isoformat(),
                "privacy": post.privacy,
                "author_photo": user.profile_photo if user else None,
                "likes_count": likes,
                "comments_count": comments,
                "has_liked": has_liked,
                "is_saved": is_saved
            })
            
        return response

    def get_post(self, post_id: int, current_user: User) -> dict:
        post = self.post_repo.get(post_id)
        if not post:
            raise APIException(status_code=404, detail="Post not found")
            
        is_visible = False
        if post.user_id == current_user.id:
            is_visible = True
        elif post.privacy == 'public':
            is_visible = True
        elif post.privacy == 'friends':
            friend_ids = self.friend_repo.get_friends(current_user.id)
            if post.user_id in friend_ids:
                is_visible = True
        elif post.privacy == 'private':
            if post.allowed_users:
                allowed = post.allowed_users.split(',')
                if str(current_user.id) in allowed:
                    is_visible = True
        
        if not is_visible:
            raise APIException(status_code=403, detail="Content not available")

        user = self.user_repo.get(post.user_id)
        
        return {
            "id": post.id,
            "content": post.content,
            "username": user.username if user else "Unknown",
            "user_id": post.user_id,
            "media_url": post.media_url,
            "media_type": post.media_type,
            "is_flagged": post.is_flagged,
            "flag_reason": post.flag_reason,
            "created_at": post.created_at.isoformat(),
            "privacy": post.privacy,
            "author_photo": user.profile_photo if user else None
        }

    def update_post(self, post_id: int, post_update: PostUpdate, current_user: User) -> dict:
        post = self.post_repo.get(post_id)
        if not post:
            raise APIException(status_code=404, detail="Post not found")
        
        if post.user_id != current_user.id:
            raise APIException(status_code=403, detail="Not authorized")
            
        now_utc = datetime.datetime.utcnow()
        diff = now_utc - post.created_at
        minutes_diff = diff.total_seconds() / 60
        
        updates = {}
        
        if post_update.content is not None:
            updates["content"] = post_update.content
            
        if post_update.privacy is not None:
             updates["privacy"] = post_update.privacy
             
        if post_update.allowed_users is not None:
             updates["allowed_users"] = ",".join(map(str, post_update.allowed_users))

        if post_update.media_url is not None or post_update.media_type is not None:
            if minutes_diff > 5:
                raise APIException(status_code=400, detail="Media can only be edited within 5 minutes of posting.")
            
            if post_update.media_url is not None:
                updates["media_url"] = post_update.media_url
            if post_update.media_type is not None:
                updates["media_type"] = post_update.media_type
                
        updated_post = self.post_repo.update(db_obj=post, obj_in=updates)
        
        return {
            "id": updated_post.id,
            "content": updated_post.content,
            "username": updated_post.username,
            "user_id": updated_post.user_id,
            "media_url": updated_post.media_url,
            "media_type": updated_post.media_type,
            "is_flagged": updated_post.is_flagged,
            "flag_reason": updated_post.flag_reason,
            "created_at": updated_post.created_at.isoformat(),
            "privacy": updated_post.privacy,
            "author_photo": current_user.profile_photo
        }

    def delete_post(self, post_id: int, current_user: User) -> dict:
        post = self.post_repo.get(post_id)
        if not post:
            raise APIException(status_code=404, detail="Post not found")
        if post.user_id != current_user.id:
            raise APIException(status_code=403, detail="Not authorized")

        self.post_repo.remove(id=post.id)
        return {"status": "success", "message": "Post deleted"}

    def like_post(self, post_id: int, current_user: User) -> dict:
        post = self.post_repo.get(post_id)
        if not post:
            raise APIException(status_code=404, detail="Post not found")
            
        is_liked = self.post_repo.create_like(current_user.id, post_id)
        return {"status": "liked" if is_liked else "unliked"}

    def add_comment(self, post_id: int, comment_in: CommentCreate, current_user: User) -> dict:
        post = self.post_repo.get(post_id)
        if not post:
            raise APIException(status_code=404, detail="Post not found")
            
        mod_res = moderate_text(comment_in.content)
        if mod_res.get("is_flagged"):
            raise APIException(status_code=400, detail="Comment blocked: inappropriate content.")
            
        comment = self.post_repo.create_comment(comment_in.content, current_user.id, current_user.username, post_id)
        
        return {
            "id": comment.id,
            "content": comment.content,
            "username": comment.username,
            "user_id": comment.user_id,
            "created_at": comment.created_at.isoformat()
        }

    def get_comments(self, post_id: int) -> list:
        comments = self.post_repo.get_comments(post_id)
        return [{
            "id": c.id,
            "content": c.content,
            "username": c.username,
            "user_id": c.user_id,
            "created_at": c.created_at.isoformat()
        } for c in comments]

    def save_post(self, post_id: int, current_user: User) -> dict:
        post = self.post_repo.get(post_id)
        if not post:
            raise APIException(status_code=404, detail="Post not found")
            
        existing = self.post_repo.session.exec(select(SavedPost).where(SavedPost.user_id == current_user.id, SavedPost.post_id == post_id)).first()
        
        if existing:
            self.post_repo.session.delete(existing)
            self.post_repo.session.commit()
            return {"status": "unsaved", "message": "Post removed from saved items"}
        else:
            saved = SavedPost(user_id=current_user.id, post_id=post_id)
            self.post_repo.session.add(saved)
            self.post_repo.session.commit()
            return {"status": "saved", "message": "Post saved"}

    def get_saved_posts(self, current_user: User, limit: int = 50, offset: int = 0) -> list:
        from app.models import Post
        statement = select(Post).join(SavedPost).where(SavedPost.user_id == current_user.id).order_by(SavedPost.created_at.desc()).offset(offset).limit(limit)
        posts = self.post_repo.session.exec(statement).all()
        
        response = []
        for post in posts:
            user = self.user_repo.get(post.user_id)
            likes = self.post_repo.get_likes_count(post.id)
            comments = len(self.post_repo.get_comments(post.id))
            has_liked = self.post_repo.has_user_liked(current_user.id, post.id)
            
            response.append({
                "id": post.id,
                "content": post.content,
                "username": user.username if user else "Unknown",
                "user_id": post.user_id,
                "media_url": post.media_url,
                "media_type": post.media_type,
                "is_flagged": post.is_flagged,
                "flag_reason": post.flag_reason,
                "created_at": post.created_at.isoformat(),
                "privacy": post.privacy,
                "author_photo": user.profile_photo if user else None,
                "likes_count": likes,
                "comments_count": comments,
                "has_liked": has_liked
            })
        return response

    def create_story(self, story_in: StoryCreate, current_user: User) -> dict:
        if story_in.content:
             mod_res = moderate_text(story_in.content)
             if mod_res.get("is_flagged"):
                 raise APIException(status_code=400, detail="Story caption contains inappropriate content.")

        now = datetime.datetime.utcnow()
        expires = now + datetime.timedelta(hours=24)
        
        story = Story(
            user_id=current_user.id,
            username=current_user.username,
            media_url=story_in.media_url,
            media_type=story_in.media_type,
            content=story_in.content,
            privacy=story_in.privacy,
            created_at=now,
            expires_at=expires,
            music_url=story_in.music_url,
            overlays=story_in.overlays
        )
        self.post_repo.session.add(story)
        self.post_repo.session.commit()
        self.post_repo.session.refresh(story)
        
        return {
            "id": story.id,
            "user_id": story.user_id,
            "username": story.username,
            "media_url": story.media_url,
            "media_type": story.media_type,
            "content": story.content,
            "created_at": story.created_at.isoformat(),
            "expires_at": story.expires_at.isoformat(),
            "author_photo": current_user.profile_photo,
            "music_url": story.music_url,
            "overlays": story.overlays
        }

    def get_stories(self, current_user: User) -> list:
        now = datetime.datetime.utcnow()
        statement = select(Story).where(Story.expires_at > now).order_by(Story.created_at.desc())
        stories = self.post_repo.session.exec(statement).all()
        
        friend_ids = self.friend_repo.get_friends(current_user.id)
        
        filtered = []
        for s in stories:
            if s.user_id == current_user.id:
                filtered.append(s)
            elif s.privacy == 'public':
                filtered.append(s)
            elif s.privacy == 'friends' and s.user_id in friend_ids:
                filtered.append(s)
                
        return [{
            "id": s.id,
            "user_id": s.user_id,
            "username": s.username,
            "media_url": s.media_url,
            "media_type": s.media_type,
            "content": s.content,
            "created_at": s.created_at.isoformat(),
            "expires_at": s.expires_at.isoformat(),
            "author_photo": self.user_repo.get(s.user_id).profile_photo if self.user_repo.get(s.user_id) else None,
            "music_url": s.music_url,
            "overlays": s.overlays
        } for s in filtered]
