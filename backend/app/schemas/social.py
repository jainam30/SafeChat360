from pydantic import BaseModel
from typing import Optional, List

class PostCreate(BaseModel):
    content: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    privacy: str = "public"
    allowed_users: Optional[List[int]] = None

class PostResponse(BaseModel):
    id: int
    content: str
    username: str
    user_id: int
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    is_flagged: bool
    flag_reason: Optional[str]
    created_at: str
    privacy: str
    author_photo: Optional[str] = None
    likes_count: int = 0
    comments_count: int = 0
    has_liked: bool = False
    is_saved: bool = False

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: int
    content: str
    username: str
    user_id: int
    created_at: str

class PostUpdate(BaseModel):
    content: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    privacy: Optional[str] = None
    allowed_users: Optional[List[int]] = None

class StoryCreate(BaseModel):
    media_url: str
    media_type: str = "image"
    content: Optional[str] = None
    privacy: str = "public"
    music_url: Optional[str] = None
    overlays: Optional[str] = None

class StoryResponse(BaseModel):
    id: int
    user_id: int
    username: str
    media_url: str
    media_type: str
    content: Optional[str]
    created_at: str
    expires_at: str
    author_photo: Optional[str] = None
    music_url: Optional[str] = None
    overlays: Optional[str] = None
