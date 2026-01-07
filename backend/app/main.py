import sys
sys.stdout.reconfigure(line_buffering=True)
print("--- BACKEND STARTING ---", flush=True)
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, moderation, history, social, users, video, analytics, review, blocklist, chat, friends, groups, notifications
from app.db import engine
from sqlmodel import SQLModel
import app.models  # Register models
import uvicorn
import os
from app.firebase_setup import init_firebase

# Initialize Firebase Admin
# init_firebase() moved to lifespan

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the DB
    try:
        print("Creating database tables...")
        SQLModel.metadata.create_all(engine)
        print("Tables created.")
        
        # Initialize Firebase
        print("Initializing Firebase...")
        init_firebase()
        print("Firebase initialized.")
    except Exception as e:
        print(f"Error creating database tables: {e}")
        # Continue anyway so the app starts and can return JSON errors
    yield

app = FastAPI(title="SafeChat360 Backend", lifespan=lifespan)

# Security: Rate Limiting
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.limiter import limiter

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS setup
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://safe-chat360.vercel.app", # Explicitly allow Vercel frontend
    "*" # For development, fine to allow all
]

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

# MANUAL FIX: Register WebSocket explicitly to bypass APIRouter prefix issues
app.add_websocket_route("/api/chat/ws/{client_id}", chat.websocket_endpoint)
from app.routes import upload
app.include_router(upload.router)

from fastapi.staticfiles import StaticFiles
# Mount uploads directory to serve files (Robust for Vercel)
try:
    if not os.path.exists("uploads"):
        os.makedirs("uploads")
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
except Exception as e:
    print(f"WARNING: Could not mount /uploads (Read-only filesystem?): {e}")
    # We might be on Vercel. We can try mounting /tmp or just skip serving static files
    # For now, we just don't crash.

@app.get("/")
def read_root():
    from app.db import engine
    import os
    db_url = os.environ.get("DATABASE_URL", "sqlite")
    db_type = "PostgreSQL" if "postgres" in db_url else "SQLite (Read-Only on Vercel)"
    
    return {
        "message": "SafeChat360 Backend is running",
        "database_type": db_type,
        "env_check": "DATABASE_URL found" if "postgres" in db_url else "WARNING: DATABASE_URL missing, using SQLite"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)