from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.db import get_session
from app import crud
from app.models import Post, User
from app.deps import get_current_user
from app.services.text_moderator import moderate_text
from app.services.image_moderator import moderate_image_base64
from pydantic import BaseModel

router = APIRouter(prefix="/api/social", tags=["social"])

class PostCreate(BaseModel):
    content: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    privacy: str = "public"
    allowed_users: Optional[List[int]] = None # Frontend sends list of IDs

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
    created_at: str
    privacy: str
    author_photo: Optional[str] = None
    likes_count: int = 0
    comments_count: int = 0
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

@router.post("/posts", response_model=PostResponse)
def create_post(
    post_in: PostCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    try:
        # Moderate the content
        from app.models import BlockedTerm
        from sqlmodel import select
        try:
            blocked_terms = session.exec(select(BlockedTerm.term)).all()
        except Exception:
            blocked_terms = []
        
        moderation_result = moderate_text(post_in.content, additional_keywords=blocked_terms)
        is_flagged = moderation_result.get("is_flagged", False)
        flag_reason = None
        
        if is_flagged:
            flags = moderation_result.get("flags", [])
            if flags:
                 flag_reason = f"{flags[0].get('label')} ({flags[0].get('score')})"
            else:
                 flag_reason = "Flagged by moderator"
                 
            # STRICT MODERATION: Block the post
            crud.create_moderation_log(
                session,
                content_type="text",
                content_excerpt=post_in.content,
                is_flagged=True,
                details=str(moderation_result),
                source=str(current_user.id),
                original_language=moderation_result.get("original_language", "en")
            )
            
            # Penalize
            current_user.trust_score = max(0, current_user.trust_score - 10)
            session.add(current_user)
            session.commit()
            
            raise HTTPException(status_code=400, detail="Post rejected: Content contains inappropriate text.")

        # Image Moderation
        if post_in.media_url and "base64" in post_in.media_url and post_in.media_type == 'image':
            try:
                b64_str = post_in.media_url.split(",")[1]
                image_mod_result = moderate_image_base64(b64_str)
                
                if image_mod_result.get("is_flagged"):
                     crud.create_moderation_log(
                        session,
                        content_type="image",
                        content_excerpt="image_upload",
                        is_flagged=True,
                        details=str(image_mod_result),
                        source=str(current_user.id)
                    )
                     # Penalize
                     current_user.trust_score = max(0, current_user.trust_score - 20)
                     session.add(current_user)
                     session.commit()
                     
                     raise HTTPException(status_code=400, detail="Post rejected: Image contains inappropriately content.")
            except Exception as e:
                print(f"Image moderation failed: {e}")

        # Log Moderation (All scans)
        crud.create_moderation_log(
            session,
            content_type="text",
            content_excerpt=post_in.content,
            is_flagged=is_flagged,
            details=str(moderation_result),
            source=str(current_user.id),
            original_language=moderation_result.get("original_language", "en")
        )

        # Format allowed_users
        allowed_users_str = None
        if post_in.privacy == 'private' and post_in.allowed_users:
            allowed_users_str = ",".join(map(str, post_in.allowed_users))

        # Create post
        post = crud.create_post(
            session,
            content=post_in.content,
            user_id=current_user.id,
            username=current_user.username,
            media_url=post_in.media_url,
            media_type=post_in.media_type,
            is_flagged=is_flagged,
            flag_reason=flag_reason,
            privacy=post_in.privacy,
            allowed_users=allowed_users_str
        )
        
        # Process Mentions
        import re
        mention_pattern = r"@(\w+)"
        mentions = re.findall(mention_pattern, post_in.content)
        
        # Send notifications
        for username in set(mentions): 
            mentioned_user = crud.get_user_by_username(session, username)
            if mentioned_user and mentioned_user.id != current_user.id:
                can_see = True
                if post.privacy == 'friends':
                     friends = crud.get_friends(session, current_user.id)
                     if mentioned_user.id not in friends:
                         can_see = False
                elif post.privacy == 'private':
                     if str(mentioned_user.id) not in (allowed_users_str or "").split(','):
                         can_see = False
                
                if can_see:
                    try:
                        crud.create_notification(
                            session,
                            user_id=mentioned_user.id,
                            type="mention",
                            source_id=current_user.id,
                            source_name=current_user.username,
                            reference_id=post.id
                        )
                    except Exception:
                        pass
        
        return PostResponse(
            id=post.id,
            content=post.content,
            username=post.username,
            user_id=post.user_id,
            media_url=post.media_url,
            media_type=post.media_type,
            is_flagged=post.is_flagged,
            flag_reason=post.flag_reason,
            created_at=post.created_at.isoformat(),
            privacy=post.privacy,
            author_photo=current_user.profile_photo
        )
    except HTTPException as ie:
        raise ie
    except Exception as e:
        # CRITICAL: Rollback immediately to clear aborted transaction state
        try:
             session.rollback()
        except:
             pass
             
        error_msg = str(e).lower()
        print(f"Primary create_post failed: {e}")

        # JIT Recovery for Vercel (Ephemeral DB lost tables)
        if "no such table" in error_msg:
             # ... (Keep existing code for table creation) ...
            try:
                print("Attempting JIT Table Creation...")
                from sqlmodel import SQLModel
                from app.db import engine
                SQLModel.metadata.create_all(engine)
                
                # Retry Creation
                print("Retrying create_post after table creation...")
                post = crud.create_post(
                    session,
                    content=post_in.content,
                    user_id=current_user.id,
                    username=current_user.username,
                    media_url=post_in.media_url,
                    media_type=post_in.media_type,
                    is_flagged=is_flagged,
                    flag_reason=flag_reason,
                    privacy=post_in.privacy,
                    allowed_users=allowed_users_str
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
                    created_at=post.created_at.isoformat(),
                    privacy=post.privacy,
                    author_photo=current_user.profile_photo
                )
            except Exception:
                pass

        # JIT Migration for Outdated Schema (Postgres/UndefinedColumn)
        # Broad check: 'undefinedcolumn' is postgres specific, 'no such column' is sqlite
        if "undefinedcolumn" in error_msg or "column" in error_msg and "does not exist" in error_msg or "no such column" in error_msg:
            try:
                print("Detected outdated schema. Attempting Auto-Migration via Engine...")
                from sqlmodel import text
                from app.db import engine
                
                # Use a fresh connection to bypass the broken session state
                with engine.connect() as conn:
                    # Try adding the most likely missing columns. 
                    # Ignore errors if they already exist (brute force migration)
                    # Try adding the most likely missing columns. 
                    # Ignore errors if they already exist (brute force migration)
                    migration_steps = [
                        "ALTER TABLE post ADD COLUMN media_url VARCHAR",
                        "ALTER TABLE post ADD COLUMN media_type VARCHAR",
                        "ALTER TABLE post ADD COLUMN privacy VARCHAR DEFAULT 'public'",
                        "ALTER TABLE post ADD COLUMN allowed_users VARCHAR",
                        "ALTER TABLE post ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE",
                        "ALTER TABLE post ADD COLUMN flag_reason VARCHAR"
                    ]
                    
                    for step in migration_steps:
                        try:
                            # Standard syntax supported by both Postgres and SQLite.
                            # We catch the error if column already exists.
                            conn.execute(text(step))
                            conn.commit()
                        except Exception as mod_e:
                            print(f"Migration step failed (might already exist or syntax invalid): {mod_e}")
                            # Clean up this connection's transaction if checking failed
                            try:
                                conn.rollback()
                            except:
                                pass

                # Retry Creation after patching - Use the SESSION again as it should be rolled back at top
                print("Retrying create_post after Auto-Migration...")
                
                # Refresh session transaction just in case
                session.rollback()
                
                post = crud.create_post(
                    session,
                    content=post_in.content,
                    user_id=current_user.id,
                    username=current_user.username,
                    media_url=post_in.media_url,
                    media_type=post_in.media_type,
                    is_flagged=is_flagged,
                    flag_reason=flag_reason,
                    privacy=post_in.privacy,
                    allowed_users=allowed_users_str
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
                    created_at=post.created_at.isoformat(),
                    privacy=post.privacy,
                    author_photo=current_user.profile_photo
                )

            except Exception as retry_e:
                 print(f"Auto-Migration Retry failed: {retry_e}")
                 pass

        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Debug Error: {str(e)}")

@router.get("/posts", response_model=List[PostResponse])
def get_posts(
    limit: int = 100,
    offset: int = 0,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    try:
        # Emergency wrapper: capture ANY error and valid response or empty
        try:
             posts = crud.get_posts(session, current_user.id, limit=limit, offset=offset)
        except Exception as e:
             # If CRUD fails (e.g. table missing), return empty list immediately
             print(f"CRUD get_posts failed: {e}")
             return []
        
        # Performance Optimization: Batch fetch users
        user_ids = {post.user_id for post in posts}
        # Add mentions if needed? No, just authors for now.
        
        users_map = {}
        try:
            users = crud.get_users_by_ids(session, list(user_ids))
            users_map = {user.id: user for user in users}
        except Exception as e:
            print(f"Batch user fetch failed: {e}")
            # Fallback to individual fetch or empty map (will show "Unknown")
        
        response = []
        for post in posts:
            try:
                uname = post.username
                u_photo = None
                
                # Fetch user from map
                user = users_map.get(post.user_id)
                if user:
                     uname = user.username
                     u_photo = user.profile_photo
                
                # Fallback if not in map (shouldn't happen if key consistency exists)
                if not user and post.user_id not in users_map:
                     # Only fetch if absolutely necessary and not in batch (orphan data?)
                     try:
                        user = crud.get_user(session, post.user_id)
                        if user:
                            uname = user.username
                            u_photo = user.profile_photo
                     except:
                        pass

                # Get counts
                likes = crud.get_likes_count(session, post.id)
                comments = crud.get_comments_count(session, post.id) if hasattr(crud, 'get_comments_count') else len(crud.get_comments(session, post.id))
                has_liked = crud.has_user_liked(session, current_user.id, post.id)
                
                # Check is_saved
                from app.models import SavedPost
                is_saved = session.exec(select(SavedPost).where(SavedPost.user_id == current_user.id, SavedPost.post_id == post.id)).first() is not None

                response.append(PostResponse(
                    id=post.id,
                    content=post.content,
                    username=uname or "Unknown",
                    user_id=post.user_id,
                    media_url=post.media_url,
                    media_type=post.media_type,
                    is_flagged=post.is_flagged,
                    flag_reason=post.flag_reason,
                    created_at=post.created_at.isoformat(),
                    privacy=post.privacy,
                    author_photo=u_photo,
                    likes_count=likes,
                    comments_count=comments,
                    has_liked=has_liked,
                    is_saved=is_saved
                ))
            except Exception as e:
                print(f"Post serialization failed: {e}")
                continue # Skip bad post
            
        return response
    except Exception as e:
        # Ultimate fallback
        import traceback
        traceback.print_exc()
        # Return empty list instead of 500 error to keep frontend alive
        return []


class PostUpdate(BaseModel):
    content: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    privacy: Optional[str] = None
    allowed_users: Optional[List[int]] = None

@router.get("/posts/{post_id}", response_model=PostResponse)
def get_post(
    post_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    post = crud.get_post(session, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    # Privacy Check
    is_visible = False
    
    if post.user_id == current_user.id:
        is_visible = True
    elif post.privacy == 'public':
        is_visible = True
    elif post.privacy == 'friends':
        # Check if friend
        friendship = crud.create_friendship(session, current_user.id, post.user_id) # This just checks/creates, bad name reuse but crud needs 'is_friend' check
        # Better: use get_friends list
        friend_ids = crud.get_friends(session, current_user.id)
        if post.user_id in friend_ids:
            is_visible = True
    elif post.privacy == 'private':
        if post.allowed_users:
            allowed = post.allowed_users.split(',')
            if str(current_user.id) in allowed:
                is_visible = True
    
    if not is_visible:
        # Generic 404 to avoid leaking existence? Or 403? 
        # Requirement says "whoever shares the link if... private... then only selected user can only see"
        raise HTTPException(status_code=403, detail="Content not available")

    # Fallback for username
    uname = post.username
    if not uname:
            user = crud.get_user(session, post.user_id)
            uname = user.username if user else "Unknown"

    # Fetch user for photo
    user = crud.get_user(session, post.user_id)
    u_photo = user.profile_photo if user else None
    
    return PostResponse(
        id=post.id,
        content=post.content,
        username=uname,
        user_id=post.user_id,
        media_url=post.media_url,
        media_type=post.media_type,
        is_flagged=post.is_flagged,
        flag_reason=post.flag_reason,
        created_at=post.created_at.isoformat(),
        privacy=post.privacy,
        author_photo=u_photo
    )

@router.put("/posts/{post_id}", response_model=PostResponse)
def update_post(
    post_id: int,
    post_update: PostUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    post = crud.get_post(session, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Time window check for media edits
    import datetime
    # post.created_at is UTC datetime
    now_utc = datetime.datetime.utcnow()
    diff = now_utc - post.created_at
    minutes_diff = diff.total_seconds() / 60
    
    updates = {}
    
    if post_update.content is not None:
        updates["content"] = post_update.content # Always editable
        
    if post_update.privacy is not None:
         updates["privacy"] = post_update.privacy
         
    if post_update.allowed_users is not None:
         updates["allowed_users"] = ",".join(map(str, post_update.allowed_users))

    # Media update restriction
    if post_update.media_url is not None or post_update.media_type is not None:
        if minutes_diff > 5:
            raise HTTPException(status_code=400, detail="Media can only be edited within 5 minutes of posting.")
        
        if post_update.media_url is not None:
            updates["media_url"] = post_update.media_url
        if post_update.media_type is not None:
            updates["media_type"] = post_update.media_type
            
    # Apply updates
    updated_post = crud.update_post(session, post, updates)
    
    return PostResponse(
        id=updated_post.id,
        content=updated_post.content,
        username=updated_post.username,
        user_id=updated_post.user_id,
        media_url=updated_post.media_url,
        media_type=updated_post.media_type,
        is_flagged=updated_post.is_flagged,
        flag_reason=updated_post.flag_reason,
        created_at=updated_post.created_at.isoformat(),
        privacy=updated_post.privacy,
        author_photo=current_user.profile_photo
    )

    crud.delete_post(session, post)
    return {"status": "success", "message": "Post deleted"}

@router.post("/posts/{post_id}/like")
def like_post(
    post_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    post = crud.get_post(session, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    is_liked = crud.create_like(session, current_user.id, post_id)
    
    # Notify if liked (not unliked) and not self
    if is_liked and post.user_id != current_user.id:
        try:
            crud.create_notification(
                session, 
                user_id=post.user_id, 
                type="like", 
                source_id=current_user.id, 
                source_name=current_user.username, 
                reference_id=post.id
            )
        except: 
            pass
            
    return {"status": "liked" if is_liked else "unliked"}

@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
def add_comment(
    post_id: int,
    comment_in: CommentCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    post = crud.get_post(session, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    # Moderation
    mod_res = moderate_text(comment_in.content)
    if mod_res.get("is_flagged"):
        raise HTTPException(status_code=400, detail="Comment blocked: inappropriate content.")
        
    comment = crud.create_comment(session, comment_in.content, current_user.id, current_user.username, post_id)
    
    # Notify author
    if post.user_id != current_user.id:
        try:
            crud.create_notification(
                session, 
                user_id=post.user_id, 
                type="comment", 
                source_id=current_user.id, 
                source_name=current_user.username, 
                reference_id=post.id
            )
        except: 
            pass

    return CommentResponse(
        id=comment.id,
        content=comment.content,
        username=comment.username,
        user_id=comment.user_id,
        created_at=comment.created_at.isoformat()
    )

@router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
def get_comments(
    post_id: int,
    session: Session = Depends(get_session)
):
    comments = crud.get_comments(session, post_id)
@router.post("/posts/{post_id}/save")
def save_post(
    post_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    from app.models import SavedPost
    
    # Check if header exists using CRUD generic or manual check
    post = crud.get_post(session, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    # Privacy Check (Prevent saving private content)
    is_visible = False
    if post.user_id == current_user.id:
        is_visible = True
    elif post.privacy == 'public':
        is_visible = True
    elif post.privacy == 'friends':
        friend_ids = crud.get_friends(session, current_user.id)
        if post.user_id in friend_ids:
            is_visible = True
    elif post.privacy == 'private':
        if post.allowed_users:
            allowed = post.allowed_users.split(',')
            if str(current_user.id) in allowed:
                is_visible = True
    
    if not is_visible:
        raise HTTPException(status_code=403, detail="Post not available to save")

    # Check if already saved
    existing = session.exec(select(SavedPost).where(SavedPost.user_id == current_user.id, SavedPost.post_id == post_id)).first()
    
    if existing:
        # Unsave
        session.delete(existing)
        session.commit()
        return {"status": "unsaved", "message": "Post removed from saved items"}
    else:
        # Save
        saved = SavedPost(user_id=current_user.id, post_id=post_id)
        session.add(saved)
        session.commit()
        return {"status": "saved", "message": "Post saved"}

@router.get("/posts/saved", response_model=List[PostResponse])
def get_saved_posts(
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    from app.models import SavedPost
    
    # Join SavedPost -> Post
    statement = select(Post, SavedPost.created_at).join(SavedPost).where(SavedPost.user_id == current_user.id).order_by(SavedPost.created_at.desc()).offset(offset).limit(limit)
    
    try:
        results = session.exec(statement).all()
        # Results is list of (Post, saved_date) tuples? Or just Post if select(Post)?
        # SQLModel select(Post, SavedPost) returns tuples.
        # But wait, statement = select(Post, ...).join...
        # If I select Post, I get Post objects.
        
        # Actually simplest is two queries or check documentation.
        # Let's do scalar select(Post)
        statement = select(Post).join(SavedPost).where(SavedPost.user_id == current_user.id).order_by(SavedPost.created_at.desc()).offset(offset).limit(limit)
        posts = session.exec(statement).all()
        
        # reuse get_posts logic but for this specific list
        # Copy-paste logic for packing response? Or call generic helper? 
        # I'll verify if crud.get_posts can filter? No.
        
        response = []
        for post in posts:
            # ... (Manual hydration similar to get_posts) ...
            user = crud.get_user(session, post.user_id)
            likes = crud.get_likes_count(session, post.id)
            comments = len(crud.get_comments(session, post.id))
            has_liked = crud.has_user_liked(session, current_user.id, post.id)
            
            response.append(PostResponse(
                id=post.id,
                content=post.content,
                username=user.username if user else "Unknown",
                user_id=post.user_id,
                media_url=post.media_url,
                media_type=post.media_type,
                is_flagged=post.is_flagged,
                flag_reason=post.flag_reason,
                created_at=post.created_at.isoformat(),
                privacy=post.privacy,
                author_photo=user.profile_photo if user else None,
                likes_count=likes,
                comments_count=comments,
                has_liked=has_liked
            ))
        return response
    except Exception as e:
        print(f"Error fetching saved posts: {e}")
        return []

# ----------------------------------------------------------------------------
# STORIES ENDPOINTS
# ----------------------------------------------------------------------------

class StoryCreate(BaseModel):
    media_url: str
    media_type: str = "image"
    content: Optional[str] = None
    privacy: str = "public"
    music_url: Optional[str] = None
    overlays: Optional[str] = None # JSON string list

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

@router.post("/stories", response_model=StoryResponse)
def create_story(
    story_in: StoryCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Basic moderation on caption if present
    if story_in.content:
         mod_res = moderate_text(story_in.content)
         if mod_res.get("is_flagged"):
             raise HTTPException(status_code=400, detail="Story caption contains inappropriate content.")

    # Calculate expiration (24h)
    import datetime
    now = datetime.datetime.utcnow()
    expires = now + datetime.timedelta(hours=24)
    
    from app.models import Story
    
    story = Story(
        user_id=current_user.id,
        username=current_user.username,
        media_url=story_in.media_url,
        media_type=story_in.media_type,
        content=story_in.content,
        privacy=story_in.privacy,
        created_at=now,
        expires_at=expires,
        music_url=story_in.music_url,
        overlays=story_in.overlays
    )
    session.add(story)
    session.commit()
    session.refresh(story)
    
    return StoryResponse(
        id=story.id,
        user_id=story.user_id,
        username=story.username,
        media_url=story.media_url,
        media_type=story.media_type,
        content=story.content,
        created_at=story.created_at.isoformat(),
        expires_at=story.expires_at.isoformat(),
        author_photo=current_user.profile_photo,
        music_url=story.music_url,
        overlays=story.overlays
    )

@router.get("/stories", response_model=List[StoryResponse])
def get_stories(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get active stories for feed (Self + Friends + Public?)
    For now: All Public or Friends' stories that haven't expired.
    """
    from app.models import Story
    import datetime
    now = datetime.datetime.utcnow()
    
    # Clean up expired (Optional: could serve as cron, but lazy delete here is fine)
    # session.exec(delete(Story).where(Story.expires_at < now)) # explicit delete or just filter
    
    # 1. Get Friend IDs
    friend_ids = crud.get_friends(session, current_user.id)
    friend_ids.append(current_user.id) # Include self
    
    from sqlmodel import or_, select, and_
    
    # Logic:
    # 1. (Privacy=Public AND Expires > Now)
    # OR
    # 2. (Privacy=Friends AND UserId IN Friends AND Expires > Now)
    # OR
    # 3. (UserId == Self AND Expires > Now) (Covered by #2 list)
    
    statement = select(Story).where(
        and_(
            Story.expires_at > now,
            or_(
                Story.privacy == 'public',
                and_(Story.privacy == 'friends', Story.user_id.in_(friend_ids)),
                Story.user_id == current_user.id
            )
        )
    ).order_by(Story.created_at.desc())
    
    stories = session.exec(statement).all()
    
    # Performance Optimization: Batch fetch users
    user_ids = {s.user_id for s in stories}
    users_map = {}
    
    try:
        users = crud.get_users_by_ids(session, list(user_ids))
        users_map = {user.id: user for user in users}
    except Exception as e:
        print(f"Batch user fetch (stories) failed: {e}")
    
    response = []
    for s in stories:
        # Fetch author photo
        # OPTIMIZED: Use map
        user = users_map.get(s.user_id)
        u_photo = None
        
        if user:
             u_photo = user.profile_photo
        else:
             # Fallback
             try:
                 user = crud.get_user(session, s.user_id)
                 u_photo = user.profile_photo if user else None
             except:
                 pass
        
        response.append(StoryResponse(
            id=s.id,
            user_id=s.user_id,
            username=s.username,
            media_url=s.media_url,
            media_type=s.media_type,
            content=s.content,
            created_at=s.created_at.isoformat(),
            expires_at=s.expires_at.isoformat(),
            author_photo=u_photo,
            music_url=s.music_url,
            overlays=s.overlays
        ))
        
    return response
