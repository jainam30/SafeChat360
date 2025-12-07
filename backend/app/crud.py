from sqlmodel import Session, select
from sqlmodel import Session, select
from app.models import User, ModerationLog, Post
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

def create_post(session: Session, content: str, user_id: int, is_flagged: bool, flag_reason: Optional[str] = None) -> Post:
    post = Post(content=content, user_id=user_id, is_flagged=is_flagged, flag_reason=flag_reason)
    session.add(post)
    session.commit()
    session.refresh(post)
    return post

def get_posts(session: Session, limit: int = 100, offset: int = 0) -> List[Post]:
    statement = select(Post).offset(offset).limit(limit).order_by(Post.created_at.desc())
    return session.exec(statement).all()
