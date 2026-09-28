from fastapi import APIRouter, Depends
from sqlmodel import Session, select, text
from app.db import engine
from app.deps import get_current_user
from app.models import User
import os

router = APIRouter(prefix="/api/debug", tags=["Debug"])


@router.get("/db")
def check_db_connection(current_user: User = Depends(get_current_user)):
    """
    Diagnostic endpoint to verify database connection and configuration on Render.
    Requires an authenticated admin user.
    """
    if current_user.role != "admin":
        # Deliberately vague: don't reveal that the route exists differently
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Not found")

    db_url = os.environ.get("DATABASE_URL", "")
    render_env = os.environ.get("RENDER", "False")

    status = {
        "environment": {
            "RENDER": render_env,
            "DATABASE_URL_PRESENT": bool(db_url),
            "DATABASE_TYPE": "Postgres" if "postgres" in db_url else "SQLite (likely)" if "sqlite" in db_url else "Unknown",
        },
        "connection": "Pending",
        "error": None,
        "data": {}
    }

    # Mask URL for security
    if db_url:
        masked = db_url.split("@")[-1] if "@" in db_url else "..." + db_url[-10:]
        status["environment"]["DATABASE_URL_MASKED"] = masked
    else:
        status["environment"]["DATABASE_URL_MASKED"] = "None"

    try:
        with Session(engine) as session:
            # 1. Check Connection
            session.exec(text("SELECT 1"))
            status["connection"] = "SUCCESS"

            # 2. Check Tables
            try:
                if "sqlite" in str(engine.url):
                    tables = session.exec(text("SELECT name FROM sqlite_master WHERE type='table';")).all()
                else:
                    tables = session.exec(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")).all()
                status["data"]["tables"] = [t for t in tables]
            except Exception as e:
                status["data"]["tables_error"] = str(e)

            # 3. Check Data (counts only - never expose usernames)
            try:
                user_count = session.exec(select(User)).all()
                status["data"]["user_count"] = len(user_count)
            except Exception as e:
                status["data"]["data_error"] = f"Could not query Users: {str(e)}"

    except Exception as e:
        status["connection"] = "FAILED"
        status["error"] = str(e)

    return status
