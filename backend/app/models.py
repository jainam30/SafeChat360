from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field
from sqlalchemy import Column
import os

# Use JSONB for PostgreSQL, JSON for SQLite
if os.getenv("DATABASE_URL", "").startswith("postgresql"):
    from sqlalchemy.dialects.postgresql import JSONB
    json_type = JSONB
else:
    from sqlalchemy import JSON
    json_type = JSON


class ModerationLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content_type: str
    content_excerpt: Optional[str] = None
    is_flagged: bool = False
    details: dict = Field(default={}, sa_column=Column(json_type))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    source: Optional[str] = None


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, nullable=False, unique=True)
    username: str = Field(index=True, nullable=False, unique=True)
    phone_number: str = Field(index=True, nullable=False, unique=True)
    full_name: Optional[str] = None
    profile_photo: Optional[str] = None
    hashed_password: str
    is_active: bool = True
    role: str = "user"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Post(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    is_flagged: bool = False
    flag_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
