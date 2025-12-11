from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from typing import List, Dict
from datetime import datetime, timedelta
from app.db import get_session
from app.models import ModerationLog, User, Post
from app.deps import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/stats")
def get_stats(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Total flagged vs safe (from ModerationLog)
    total_logs = session.exec(select(func.count(ModerationLog.id))).one()
    flagged_logs = session.exec(select(func.count(ModerationLog.id)).where(ModerationLog.is_flagged == True)).one()
    safe_logs = total_logs - flagged_logs

    # Flags by type (using content_type for now as approximation).
    # NOTE: This assumes 'content_type' accurately reflects the media type.
    # Future improvement: Normalize violation types in a separate table for cleaner grouping.
    # For MVP, counting by content_type is sufficient.
    
    text_count = session.exec(select(func.count(ModerationLog.id)).where(ModerationLog.content_type == "text")).one()
    image_count = session.exec(select(func.count(ModerationLog.id)).where(ModerationLog.content_type == "image")).one()
    video_count = session.exec(select(func.count(ModerationLog.id)).where(ModerationLog.content_type.like("video%"))).one()
    audio_count = session.exec(select(func.count(ModerationLog.id)).where(ModerationLog.content_type == "audio")).one()

    return {
        "overview": {
            "total_scanned": total_logs,
            "flagged": flagged_logs,
            "safe": safe_logs,
            "flag_rate": round((flagged_logs / total_logs * 100) if total_logs > 0 else 0, 2)
        },
        "by_type": {
            "text": text_count,
            "image": image_count,
            "video": video_count,
            "audio": audio_count
        }
    }

@router.get("/trends")
def get_trends(
    days: int = 7,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Get counts for last N days
    # NOTE: We fetch raw data and aggregate in Python to support both SQLite (dev) and PostgreSQL (prod)
    # without relying on DB-specific date truncation functions (e.g., date_trunc vs strftime).
    # This is acceptable for the MVP scale but should be optimized to raw SQL for high volume.
    
    cutoff = datetime.utcnow() - timedelta(days=days)
    logs = session.exec(select(ModerationLog).where(ModerationLog.created_at >= cutoff)).all()

    # Aggregate
    daily_stats = {}
    for i in range(days):
        day_str = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_stats[day_str] = {"flagged": 0, "total": 0}
    
    for log in logs:
        day_str = log.created_at.strftime("%Y-%m-%d")
        if day_str in daily_stats:
            daily_stats[day_str]["total"] += 1
            if log.is_flagged:
                daily_stats[day_str]["flagged"] += 1
    
    # Convert to list sorted by date
    result = []
    for day in sorted(daily_stats.keys()):
        result.append({
            "date": day,
            "flagged": daily_stats[day]["flagged"],
            "total": daily_stats[day]["total"]
        })
        
    return {"trends": result}
