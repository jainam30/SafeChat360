from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.db import get_session
from app import crud
from app.models import Post, User
from app.deps import get_current_user
from app.services.text_moderator import moderate_text
from pydantic import BaseModel

router = APIRouter(prefix="/api/social", tags=["social"])

class PostCreate(BaseModel):
    content: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None

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

@router.post("/posts", response_model=PostResponse)
def create_post(
    post_in: PostCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Moderate the content
    from app.models import BlockedTerm
    from sqlmodel import select
    blocked_terms = session.exec(select(BlockedTerm.term)).all()
    
    moderation_result = moderate_text(post_in.content, additional_keywords=blocked_terms)
    is_flagged = moderation_result.get("is_flagged", False)
    flag_reason = None
    
    if is_flagged:
        flags = moderation_result.get("flags", [])
        if flags:
             flag_reason = f"{flags[0].get('label')} ({flags[0].get('score')})"
        else:
             flag_reason = "Flagged by moderator"
             
        # Reputation System: Penalize if flagged
        current_user.trust_score = max(0, current_user.trust_score - 5)
        session.add(current_user)
        session.commit()
        session.refresh(current_user)

    # Create post
    post = crud.create_post(
        session,
        content=post_in.content,
        user_id=current_user.id,
        username=current_user.username,
        media_url=post_in.media_url,
        media_type=post_in.media_type,
        is_flagged=is_flagged,
        flag_reason=flag_reason
    )
    
    return PostResponse(
        id=post.id,
        content=post.content,
        username=post.username,
        user_id=post.user_id,
        media_url=post.media_url,
        media_type=post.media_type,
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
    
    response = []
    for post in posts:
        # User is denormalized now? Or we rely on username field?
        # Post model now has 'username' field. We should check if it's populated.
        # If not (legacy), fetch from User. But we reset DB, so it should be fine.
        
        # Fallback if username is missing (though we require it in crud now)
        uname = post.username
        if not uname:
             user = crud.get_user(session, post.user_id)
             uname = user.username if user else "Unknown"

        response.append(PostResponse(
            id=post.id,
            content=post.content,
            username=uname,
            user_id=post.user_id,
            media_url=post.media_url,
            media_type=post.media_type,
            is_flagged=post.is_flagged,
            flag_reason=post.flag_reason,
            created_at=post.created_at.isoformat()
        ))
        
    return response
