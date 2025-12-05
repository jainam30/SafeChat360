from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.db import get_session
from app import crud
from app.models import Post, User
from app.deps import get_current_user
from app.services.text_moderator import moderate_text
from pydantic import BaseModel

router = APIRouter(prefix="/social", tags=["social"])

class PostCreate(BaseModel):
    content: str

class PostResponse(BaseModel):
    id: int
    content: str
    username: str
    user_id: int
    is_flagged: bool
    flag_reason: Optional[str]
    created_at: str

@router.post("/posts", response_model=PostResponse)
def create_post(
    post_in: PostCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Moderate the content
    moderation_result = moderate_text(post_in.content)
    is_flagged = moderation_result.get("is_flagged", False)
    flag_reason = None
    
    if is_flagged:
        flags = moderation_result.get("flags", [])
        if flags:
             flag_reason = f"{flags[0].get('label')} ({flags[0].get('score')})"
        else:
             flag_reason = "Flagged by moderator"

    # Create post
    post = crud.create_post(
        session,
        content=post_in.content,
        user_id=current_user.id,
        is_flagged=is_flagged,
        flag_reason=flag_reason
    )
    
    return PostResponse(
        id=post.id,
        content=post.content,
        username=current_user.username,
        user_id=post.user_id,
        is_flagged=post.is_flagged,
        flag_reason=post.flag_reason,
        created_at=post.created_at.isoformat()
    )

@router.get("/posts", response_model=List[PostResponse])
def get_posts(
    limit: int = 100,
    offset: int = 0,
    session: Session = Depends(get_session)
):
    posts = crud.get_posts(session, limit=limit, offset=offset)
    
    # We need to fetch usernames. In a real app we'd join tables, 
    # but for simplicity we'll just fetch user for each post or rely on foreign keys if eager loaded.
    # Since we didn't set up relationship loading, let's just fetch manually for now or use crud.
    
    response = []
    for post in posts:
        user = crud.get_user(session, post.user_id)
        username = user.username if user else "Unknown"
        
        response.append(PostResponse(
            id=post.id,
            content=post.content,
            username=username,
            user_id=post.user_id,
            is_flagged=post.is_flagged,
            flag_reason=post.flag_reason,
            created_at=post.created_at.isoformat()
        ))
        
    return response
