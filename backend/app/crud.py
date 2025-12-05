from typing import List, Optional
from sqlmodel import Session, select
from app.models import ModerationLog, User, Post
from sqlalchemy.exc import IntegrityError

def create_log(session: Session, *, content_type: str, content_excerpt: Optional[str], is_flagged: bool, details: dict, source: Optional[str] = None) -> ModerationLog:
    m = ModerationLog(content_type=content_type, content_excerpt=content_excerpt, is_flagged=is_flagged, details=details, source=source)
    session.add(m)
    session.commit()
    session.refresh(m)
    return m

def get_logs(session: Session, limit: int = 100, offset: int = 0, content_type: Optional[str] = None) -> List[ModerationLog]:
    q = select(ModerationLog).offset(offset).limit(limit).order_by(ModerationLog.created_at.desc())
    if content_type:
        q = q.where(ModerationLog.content_type == content_type)
    return session.exec(q).all()

def create_user(session: Session, *, email: str, username: str, phone_number: str, hashed_password: str, full_name: Optional[str] = None, role: str = "user") -> User:
    user = User(
        email=email.lower(),
        username=username,
        phone_number=phone_number,
        hashed_password=hashed_password,
        full_name=full_name,
        role=role
    )
    session.add(user)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise
    session.refresh(user)
    return user

def get_user_by_email(session: Session, email: str) -> Optional[User]:
    q = select(User).where(User.email == email.lower())
    return session.exec(q).first()

def get_user_by_username(session: Session, username: str) -> Optional[User]:
    q = select(User).where(User.username == username)
    return session.exec(q).first()

def get_user_by_phone(session: Session, phone: str) -> Optional[User]:
    q = select(User).where(User.phone_number == phone)
    return session.exec(q).first()

def get_user(session: Session, user_id: int) -> Optional[User]:
    return session.get(User, user_id)

def update_user(session: Session, user: User, updates: dict) -> User:
    for key, value in updates.items():
        setattr(user, key, value)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

def create_post(session: Session, *, content: str, user_id: int, is_flagged: bool = False, flag_reason: Optional[str] = None) -> Post:
    post = Post(content=content, user_id=user_id, is_flagged=is_flagged, flag_reason=flag_reason)
    session.add(post)
    session.commit()
    session.refresh(post)
    return post

def get_posts(session: Session, limit: int = 100, offset: int = 0) -> List[Post]:
    q = select(Post).offset(offset).limit(limit).order_by(Post.created_at.desc())
    return session.exec(q).all()
