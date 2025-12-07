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

class Post(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    user_id: int
    is_flagged: bool = False
    flag_reason: Optional[str] = None
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
