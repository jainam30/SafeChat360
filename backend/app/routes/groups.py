from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from typing import List
from app.db import get_session
from app.models import User, Group, GroupMember
from app.deps import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/groups", tags=["groups"])

class GroupCreate(BaseModel):
    name: str
    member_ids: List[int]

class GroupResponse(BaseModel):
    id: int
    name: str
    admin_id: int
    member_count: int

@router.post("/", response_model=GroupResponse)
def create_group(
    group_in: GroupCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Create Group
    group = Group(name=group_in.name, admin_id=current_user.id)
    session.add(group)
    session.commit()
    session.refresh(group)
    
    # Add Admin
    session.add(GroupMember(group_id=group.id, user_id=current_user.id))
    
    # Add Members
    for uid in group_in.member_ids:
        if uid != current_user.id:
            # Check user exists
            if session.get(User, uid):
                session.add(GroupMember(group_id=group.id, user_id=uid))
    
    session.commit()
    
    # Count members
    count = len(session.exec(select(GroupMember).where(GroupMember.group_id == group.id)).all())
    
    return GroupResponse(
        id=group.id,
        name=group.name,
        admin_id=group.admin_id,
        member_count=count
    )

@router.get("/", response_model=List[GroupResponse])
def get_my_groups(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Get groups where I am member
    memberships = session.exec(select(GroupMember).where(GroupMember.user_id == current_user.id)).all()
    group_ids = [m.group_id for m in memberships]
    
    groups = session.exec(select(Group).where(Group.id.in_(group_ids))).all()
    
    results = []
    for g in groups:
        count = len(session.exec(select(GroupMember).where(GroupMember.group_id == g.id)).all())
        results.append(GroupResponse(
            id=g.id,
            name=g.name,
            admin_id=g.admin_id,
            member_count=count
        ))
    return results

@router.get("/{group_id}/members", response_model=List[dict])
def get_group_members(
    group_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Verify membership
    is_member = session.exec(select(GroupMember).where(
        (GroupMember.group_id == group_id) & (GroupMember.user_id == current_user.id)
    )).first()
    
    if not is_member:
        raise HTTPException(status_code=403, detail="Not a member")
        
    members = session.exec(select(GroupMember).where(GroupMember.group_id == group_id)).all()
    users = []
    for m in members:
        u = session.get(User, m.user_id)
        if u:
            users.append({
                "id": u.id,
                "username": u.username,
                "profile_photo": u.profile_photo,
                "is_admin": u.id == session.get(Group, group_id).admin_id
            })
    return users
