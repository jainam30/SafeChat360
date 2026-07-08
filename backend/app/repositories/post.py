from typing import Optional, List
from sqlmodel import select, Session
from app.models import Post, Like, Comment
from app.repositories.base import BaseRepository

class PostRepository(BaseRepository[Post]):
    def __init__(self, session: Session):
        super().__init__(Post, session)

    def get_visible_posts(self, current_user_id: int, friend_ids: List[int], limit: int = 100, offset: int = 0) -> List[Post]:
        all_posts = self.session.exec(select(Post).order_by(Post.created_at.desc()).limit(limit + 50)).all()
        visible_posts = []
        for post in all_posts:
            if post.user_id == current_user_id:
                visible_posts.append(post)
                continue
            if post.privacy == 'public':
                visible_posts.append(post)
                continue
            if post.privacy == 'friends' and post.user_id in friend_ids:
                visible_posts.append(post)
                continue
            if post.privacy == 'private' and post.allowed_users:
                allowed = post.allowed_users.split(',')
                if str(current_user_id) in allowed:
                    visible_posts.append(post)
                continue
        return visible_posts[:limit]

    def create_like(self, user_id: int, post_id: int) -> bool:
        existing = self.session.exec(select(Like).where(Like.user_id == user_id, Like.post_id == post_id)).first()
        if existing:
            self.session.delete(existing)
            self.session.commit()
            return False
        else:
            like = Like(user_id=user_id, post_id=post_id)
            self.session.add(like)
            self.session.commit()
            return True

    def get_likes_count(self, post_id: int) -> int:
        return len(self.session.exec(select(Like).where(Like.post_id == post_id)).all())

    def has_user_liked(self, user_id: int, post_id: int) -> bool:
        return self.session.exec(select(Like).where(Like.user_id == user_id, Like.post_id == post_id)).first() is not None

    def create_comment(self, content: str, user_id: int, username: str, post_id: int) -> Comment:
        comment = Comment(content=content, user_id=user_id, username=username, post_id=post_id)
        self.session.add(comment)
        self.session.commit()
        self.session.refresh(comment)
        return comment

    def get_comments(self, post_id: int) -> List[Comment]:
        return self.session.exec(select(Comment).where(Comment.post_id == post_id).order_by(Comment.created_at.asc())).all()
