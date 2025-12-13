from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    username: str = Field(unique=True, index=True)
    hashed_password: str
    phone_number: Optional[str] = None
    full_name: Optional[str] = None
    profile_photo: Optional[str] = None
    role: str = "user"
    trust_score: int = Field(default=100)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    device_id: str
    last_active: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class Post(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None  # image, video
    user_id: int
    username: str # Denormalized for simpler queries
    privacy: str = "public" # public, friends, private
    allowed_users: Optional[str] = None # Comma separated user IDs for private posts
    is_flagged: bool = False
    flag_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Friendship(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    friend_id: int = Field(index=True)
    status: str = "pending" # pending, accepted, rejected
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ModerationLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content_type: str
    content_excerpt: Optional[str] = None
    is_flagged: bool = False
    details: Optional[str] = None # JSON string or similar
    source: Optional[str] = None # User ID or source identifier
    review_status: str = Field(default="pending") # pending, approved, rejected
    original_language: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BlockedTerm(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    term: str = Field(index=True)
    added_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sender_id: int
    sender_username: str  # Denormalize for easier display
    receiver_id: Optional[int] = None # None = Global (if group_id also None)
    group_id: Optional[int] = None # NEW: For Group Chats
    content: str
    is_unsent: bool = False
    deleted_by_ids: Optional[str] = None # Comma separated list of user_ids
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Group(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    admin_id: int # Creator
    icon: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GroupMember(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    group_id: int = Field(index=True)
    user_id: int = Field(index=True)
    joined_at: datetime = Field(default_factory=datetime.utcnow)

class Notification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True) # Recipient
    type: str # 'mention', 'friend_request', 'friend_accepted', 'like', 'comment'
    source_id: Optional[int] = None # User who triggered it
    source_name: Optional[str] = None # Username of trigger
    reference_id: Optional[int] = None # Post ID, etc.
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Story(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    username: str
    media_url: str
    media_type: str = "image" # image, video
    content: Optional[str] = None # Caption
    privacy: str = "public" # public, friends
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    music_url: Optional[str] = None
    overlays: Optional[str] = None # JSON string for stickers/text

class Like(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    post_id: int = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Comment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    user_id: int = Field(index=True)
    username: str
    post_id: int = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
