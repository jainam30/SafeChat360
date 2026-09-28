import sys
from app.core.logger import logger
logger.info("--- BACKEND STARTING ---")
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, moderation, history, social, users, video, analytics, review, blocklist, chat, friends, groups, notifications, security, pki
from app.db import engine
from sqlmodel import SQLModel
import app.models  # Register models
import uvicorn
import os
from app.utils.firebase import init_firebase

# Initialize Firebase Admin
# init_firebase() moved to lifespan

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the DB
    try:
        logger.info("Creating database tables...")
        SQLModel.metadata.create_all(engine)
        logger.info("Tables created.")
        
        # AUTO-MIGRATION: Fix missing 'type' column for existing production DB
        try:
            from sqlalchemy import text
            with engine.connect() as connection:
                connection.execute(text("ALTER TABLE message ADD COLUMN type VARCHAR DEFAULT 'text'"))
                connection.commit()
            logger.info("MIGRATION SUCCESS: Added 'type' column to message table.")
        except Exception as e:
            logger.info(f"MIGRATION INFO: Column 'type' likely exists or other error. {e}")
        
        # Initialize Firebase
        logger.info("Initializing Firebase...")
        init_firebase()
        logger.info("Firebase initialized.")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}", exc_info=True)
        # Continue anyway so the app starts and can return JSON errors
    yield

from app.core.middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware
from app.core.exceptions import APIException, api_exception_handler, custom_exception_handler
from app.core.config import settings

app = FastAPI(title="SafeChat360 Backend", lifespan=lifespan)

# Add custom exception handlers
app.add_exception_handler(APIException, api_exception_handler)
app.add_exception_handler(Exception, custom_exception_handler)

# Add Middlewares
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# Security: Rate Limiting
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.limiter import limiter

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS setup - drop wildcard entries; a wildcard origin is incompatible with
# credentialed requests and unsafe.
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip() and origin.strip() != "*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(moderation.router)
app.include_router(history.router)
app.include_router(social.router)
app.include_router(users.router)
app.include_router(video.router)
app.include_router(review.router)
app.include_router(analytics.router)
app.include_router(blocklist.router)
app.include_router(chat.router)
app.include_router(friends.router)
app.include_router(groups.router)
app.include_router(notifications.router)
app.include_router(security.router)
app.include_router(pki.router)

from app.routes import debug
app.include_router(debug.router)

from fastapi import WebSocket

# MANUAL FIX: Register WebSocket explicitly in main app to bypass Router issues
@app.websocket("/api/chat/ws/{client_id}")
async def ws_proxy(websocket: WebSocket, client_id: str, token: str = None):
    # Delegate to the logic in chat.py
    await chat.websocket_endpoint(websocket, client_id, token)
from app.routes import upload
app.include_router(upload.router)

from fastapi.staticfiles import StaticFiles
# Mount uploads directory to serve files (Robust for Vercel)
try:
    if not os.path.exists("uploads"):
        os.makedirs("uploads")
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
except Exception as e:
    logger.warning(f"WARNING: Could not mount /uploads (Read-only filesystem?): {e}")
    # We might be on Vercel. We can try mounting /tmp or just skip serving static files
    # For now, we just don't crash.

# Health Endpoints
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "SafeChat360 Backend"}

@app.get("/ready")
def readiness_check():
    # In a real app, you might ping the DB here
    return {"status": "ready"}

@app.get("/live")
def liveness_check():
    return {"status": "alive"}

@app.get("/")
def read_root():
    db_url = settings.DATABASE_URL
    db_type = "PostgreSQL" if "postgres" in db_url else "SQLite (Read-Only on Vercel)"
    
    return {
        "message": "SafeChat360 Backend is running",
        "database_type": db_type,
        "env_check": "DATABASE_URL found" if "postgres" in db_url else "WARNING: DATABASE_URL missing, using SQLite"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)