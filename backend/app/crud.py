from sqlmodel import Session, select, or_, and_
from app.models import User, ModerationLog, Post, Notification
from typing import Optional, Dict, Any, List
import json

def get_user_by_email(session: Session, email: str) -> Optional[User]:
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()

def get_user_by_username(session: Session, username: str) -> Optional[User]:
    statement = select(User).where(User.username == username)
    return session.exec(statement).first()

def get_user_by_phone(session: Session, phone: str) -> Optional[User]:
    statement = select(User).where(User.phone_number == phone)
    return session.exec(statement).first()

def get_user(session: Session, user_id: int) -> Optional[User]:
    return session.get(User, user_id)

def get_users_by_ids(session: Session, user_ids: List[int]) -> List[User]:
    if not user_ids:
        return []
    statement = select(User).where(User.id.in_(user_ids))
    return session.exec(statement).all()

def create_user(session: Session, email: str, username: str, hashed_password: str, phone_number: str = None, full_name: str = None, role: str = "user") -> User:
    user = User(
        email=email,
        username=username,
        hashed_password=hashed_password,
        phone_number=phone_number,
        full_name=full_name,
        role=role
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

def update_user(session: Session, user: User, updates: Dict[str, Any]) -> User:
    for key, value in updates.items():
        setattr(user, key, value)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

def create_log(session: Session, content_type: str, content_excerpt: str, is_flagged: bool, details: Any, source: str, original_language: Optional[str] = None):
    # Convert details to string if it's a dict
    if isinstance(details, (dict, list)):
        details_str = json.dumps(details)
    else:
        details_str = str(details)
        
    log_entry = ModerationLog(
        content_type=content_type,
        content_excerpt=content_excerpt,
        is_flagged=is_flagged,
        details=details_str,
        source=source,
        original_language=original_language
    )
    session.add(log_entry)
    session.commit()
    session.refresh(log_entry)
    return log_entry

def get_logs(session: Session, limit: int = 50, offset: int = 0, content_type: Optional[str] = None) -> List[ModerationLog]:
    statement = select(ModerationLog)
    if content_type:
        statement = statement.where(ModerationLog.content_type == content_type)
    statement = statement.offset(offset).limit(limit).order_by(ModerationLog.created_at.desc())
    return session.exec(statement).all()

def create_post(session: Session, content: str, user_id: int, username: str, media_url: str = None, media_type: str = None, is_flagged: bool = False, flag_reason: Optional[str] = None, privacy: str = "public", allowed_users: str = None) -> Post:
    post = Post(
        content=content, 
        user_id=user_id, 
        username=username,
        media_url=media_url,
        media_type=media_type,
        is_flagged=is_flagged, 
        flag_reason=flag_reason,
        privacy=privacy,
        allowed_users=allowed_users
    )
    session.add(post)
    session.commit()
    session.refresh(post)
    return post

def get_posts(session: Session, current_user_id: int, limit: int = 100, offset: int = 0) -> List[Post]:
    # Logic:
    # 1. Public posts
    # 2. My own posts
    # 3. Friends' posts where privacy is 'friends' (or 'public')
    # 4. Private posts where I am in allowed_users
    
    # Get friend IDs
    friend_ids = get_friends(session, current_user_id)
    
    # We need to filter in Python for complex logic or use complex OR
    # Simplest approach with SQLModel:
    # WHERE (privacy = 'public') 
    # OR (user_id = current_user_id)
    # OR (privacy = 'friends' AND user_id IN friend_ids)
    # OR (privacy = 'private' AND allowed_users LIKE '%,' + str(current_user_id) + ',%') Note: better to use JSON or specific table but string is simple for now
    
    # For 'private' check, since we store allowed_users as string, we can't easily do SQL LIKE in a portable way for IDs.
    # So we might fetch candidates and filter in Python, OR assume allowed_users contains ",ID," format.
    
    # Let's fetch potentially relevant posts first (public, friends, or mine) + private ones.
    # Actually, fetching all recent posts and filtering in memory is safer for this scale.
    # But let's try to be efficient.
    
    all_posts = session.exec(select(Post).order_by(Post.created_at.desc()).limit(limit + 50)).all() # Fetch a bit more to filter
    
    visible_posts = []
    for post in all_posts:
        if post.user_id == current_user_id:
            visible_posts.append(post)
            continue
            
        if post.privacy == 'public':
            visible_posts.append(post)
            continue
            
        if post.privacy == 'friends':
            if post.user_id in friend_ids:
                visible_posts.append(post)
            continue
            
        if post.privacy == 'private':
            if post.allowed_users:
                 # Check if ID is in the list. List format expected: "id1,id2,id3"
                 allowed = post.allowed_users.split(',')
                 if str(current_user_id) in allowed:
                     visible_posts.append(post)
            continue
            
    return visible_posts[:limit]

def get_post(session: Session, post_id: int) -> Optional[Post]:
    return session.get(Post, post_id)

def update_post(session: Session, post: Post, updates: Dict[str, Any]) -> Post:
    for key, value in updates.items():
        setattr(post, key, value)
    session.add(post)
    session.commit()
    session.refresh(post)
    return post

    session.delete(post)
    session.commit()

def create_like(session: Session, user_id: int, post_id: int) -> bool:
    from app.models import Like
    # Check if already liked
    existing = session.exec(select(Like).where(Like.user_id == user_id, Like.post_id == post_id)).first()
    if existing:
        # Toggle: Unlike
        session.delete(existing)
        session.commit()
        return False
    else:
        # Like
        like = Like(user_id=user_id, post_id=post_id)
        session.add(like)
        session.commit()
        return True

def get_likes_count(session: Session, post_id: int) -> int:
    from app.models import Like
    return len(session.exec(select(Like).where(Like.post_id == post_id)).all())

def has_user_liked(session: Session, user_id: int, post_id: int) -> bool:
    from app.models import Like
    return session.exec(select(Like).where(Like.user_id == user_id, Like.post_id == post_id)).first() is not None

def create_comment(session: Session, content: str, user_id: int, username: str, post_id: int):
    from app.models import Comment
    comment = Comment(content=content, user_id=user_id, username=username, post_id=post_id)
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return comment

def get_comments(session: Session, post_id: int) -> List[Any]:
    from app.models import Comment
    return session.exec(select(Comment).where(Comment.post_id == post_id).order_by(Comment.created_at.asc())).all()

# --- Friendship ---

from app.models import Friendship

def create_friendship(session: Session, user_id: int, friend_id: int) -> Friendship:
    # Check if exists
    statement = select(Friendship).where(
        (Friendship.user_id == user_id) | (Friendship.friend_id == user_id)
    )
    potential_matches = session.exec(statement).all()
    existing = None
    for f in potential_matches:
        if (f.user_id == user_id and f.friend_id == friend_id) or \
           (f.user_id == friend_id and f.friend_id == user_id):
            existing = f
            break
    if existing:
        return existing
    
    friendship = Friendship(user_id=user_id, friend_id=friend_id, status="pending")
    session.add(friendship)
    session.commit()
    session.refresh(friendship)
    return friendship

# --- Notifications ---

def create_notification(session: Session, user_id: int, type: str, source_id: int = None, source_name: str = None, reference_id: int = None) -> Notification:
    from app.models import Notification
    notif = Notification(
        user_id=user_id,
        type=type,
        source_id=source_id,
        source_name=source_name,
        reference_id=reference_id
    )
    session.add(notif)
    session.commit()
    session.refresh(notif)
    return notif

def create_moderation_log(
    session: Session,
    content_type: str,
    content_excerpt: str = None,
    is_flagged: bool = False,
    details: str = None,
    source: str = None, # user_id
    original_language: str = "en"
):
    log = ModerationLog(
        content_type=content_type,
        content_excerpt=content_excerpt[:100] if content_excerpt else None, # Truncate excerpt
        is_flagged=is_flagged,
        details=details,
        source=str(source) if source else None,
        original_language=original_language,
        review_status="pending" if is_flagged else "approved"
    )
    session.add(log)
    session.commit()
    session.refresh(log)
    return log

def get_notifications(session: Session, user_id: int, limit: int = 50) -> List[Notification]:
    from app.models import Notification
    statement = select(Notification).where(Notification.user_id == user_id).order_by(Notification.created_at.desc()).limit(limit)
    return session.exec(statement).all()

def mark_notification_read(session: Session, notification_id: int):
    from app.models import Notification
    notif = session.get(Notification, notification_id)
    if notif:
        notif.is_read = True
        session.add(notif)
        session.commit()
        session.refresh(notif)
        return notif
    return None

def get_friendship_requests(session: Session, user_id: int) -> List[Friendship]:
    # Requests where I am the friend_id and status is pending
    statement = select(Friendship).where(Friendship.friend_id == user_id, Friendship.status == "pending")
    return session.exec(statement).all()

def update_friendship_status(session: Session, friendship_id: int, status: str) -> Optional[Friendship]:
    friendship = session.get(Friendship, friendship_id)
    if friendship:
        friendship.status = status
        session.add(friendship)
        session.commit()
        session.refresh(friendship)
    return friendship

def get_friends(session: Session, user_id: int) -> List[int]:
    # Get all friendships involving user
    # Simplified query to avoid or_/and_ complexity issues
    try:
        statement = select(Friendship).where(
            (Friendship.user_id == user_id) | (Friendship.friend_id == user_id)
        )
        friendships = session.exec(statement).all()
        
        friend_ids = []
        for f in friendships:
            if f.status == "accepted":
                if f.user_id == user_id:
                    friend_ids.append(f.friend_id)
                else:
                    friend_ids.append(f.user_id)
        return friend_ids
    except Exception as e:
        print(f"Error in get_friends: {e}")
        return []

# --- User Sessions ---

def create_user_session(session: Session, user_id: int, device_id: str) -> None:
    from app.models import UserSession
    user_session = UserSession(user_id=user_id, device_id=device_id)
    session.add(user_session)
    session.commit()
    session.refresh(user_session)
    return user_session

def get_active_sessions_count(session: Session, user_id: int) -> int:
    from app.models import UserSession
    # Simple active count
    statement = select(UserSession).where(UserSession.user_id == user_id, UserSession.is_active == True)
    results = session.exec(statement).all()
    return len(results)

def deactivate_sessions(session: Session, user_id: int):
    from app.models import UserSession
    statement = select(UserSession).where(UserSession.user_id == user_id, UserSession.is_active == True)
    sessions = session.exec(statement).all()
    for s in sessions:
        s.is_active = False
        session.add(s)
    session.commit()
