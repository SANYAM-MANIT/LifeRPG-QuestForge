from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, Attribute, ActivityLog
from app.schemas import UserOut, UpdateProfile, ActivityLogOut
from app.auth import get_current_user
from app.routers.auth_router import format_user_out

router = APIRouter(prefix="/api/character", tags=["Character"])

@router.get("/profile", response_model=UserOut)
def get_character_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return format_user_out(current_user, db)

@router.patch("/profile", response_model=UserOut)
def update_character_profile(
    profile_data: UpdateProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if profile_data.avatar:
        current_user.avatar = profile_data.avatar
    if profile_data.title:
        current_user.title = profile_data.title
    if profile_data.theme:
        current_user.theme = profile_data.theme

    db.commit()
    db.refresh(current_user)
    return format_user_out(current_user, db)

@router.get("/activity", response_model=List[ActivityLogOut])
def get_activity_history(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = db.query(ActivityLog).filter(
        ActivityLog.user_id == current_user.id
    ).order_by(ActivityLog.created_at.desc()).limit(limit).all()
    return logs
