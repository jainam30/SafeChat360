from typing import List
from fastapi import APIRouter, Depends
from app.models import User
from app.deps import get_current_user, get_social_service
from app.schemas.social import (
    PostCreate, PostResponse, CommentCreate, CommentResponse, 
    PostUpdate, StoryCreate, StoryResponse
)
from app.services.social import SocialService

router = APIRouter(prefix="/api/social", tags=["social"])

@router.post("/posts", response_model=PostResponse)
def create_post(
    post_in: PostCreate,
    current_user: User = Depends(get_current_user),
    service: SocialService = Depends(get_social_service)
):
    return service.create_post(post_in, current_user)

@router.get("/posts", response_model=List[PostResponse])
def get_posts(
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    service: SocialService = Depends(get_social_service)
):
    return service.get_posts(current_user, limit, offset)

@router.get("/posts/{post_id}", response_model=PostResponse)
def get_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    service: SocialService = Depends(get_social_service)
):
    return service.get_post(post_id, current_user)

@router.put("/posts/{post_id}", response_model=PostResponse)
def update_post(
    post_id: int,
    post_update: PostUpdate,
    current_user: User = Depends(get_current_user),
    service: SocialService = Depends(get_social_service)
):
    return service.update_post(post_id, post_update, current_user)

@router.delete("/posts/{post_id}")
def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    service: SocialService = Depends(get_social_service)
):
    return service.delete_post(post_id, current_user)

@router.post("/posts/{post_id}/like")
def like_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    service: SocialService = Depends(get_social_service)
):
    return service.like_post(post_id, current_user)

@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
def add_comment(
    post_id: int,
    comment_in: CommentCreate,
    current_user: User = Depends(get_current_user),
    service: SocialService = Depends(get_social_service)
):
    return service.add_comment(post_id, comment_in, current_user)

@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
def get_comments(
    post_id: int,
    service: SocialService = Depends(get_social_service)
):
    return service.get_comments(post_id)

@router.post("/posts/{post_id}/save")
def save_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    service: SocialService = Depends(get_social_service)
):
    return service.save_post(post_id, current_user)

@router.get("/saved", response_model=List[PostResponse])
def get_saved_posts(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    service: SocialService = Depends(get_social_service)
):
    return service.get_saved_posts(current_user, limit, offset)

@router.post("/stories", response_model=StoryResponse)
def create_story(
    story_in: StoryCreate,
    current_user: User = Depends(get_current_user),
    service: SocialService = Depends(get_social_service)
):
    return service.create_story(story_in, current_user)

@router.get("/stories", response_model=List[StoryResponse])
def get_stories(
    current_user: User = Depends(get_current_user),
    service: SocialService = Depends(get_social_service)
):
    return service.get_stories(current_user)
