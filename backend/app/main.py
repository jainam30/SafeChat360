from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth as auth_router
from app.routes import moderation as mod_router
from app.routes import history as history_router
from app.routes import users as users_router
from app.routes import social as social_router
from app.routes import video as video_router
from app.db import init_db, get_session
from app import crud
from app.auth_utils import get_password_hash

app = FastAPI(title="SafeChat360 API")

import os

origins_str = os.getenv("ALLOWED_ORIGINS", "*")
origins = [origin.strip() for origin in origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    # Create demo user if it doesn't exist
    try:
        session = next(get_session())
        try:
            demo_email = "demo@safechat.com"
            demo_password = "DemoPassword123!"
            existing = crud.get_user_by_email(session, demo_email)
            if not existing:
                hashed = get_password_hash(demo_password)
                crud.create_user(
                    session,
                    email=demo_email,
                    username="demo_user",
                    phone_number="+1234567890",
                    hashed_password=hashed,
                    full_name="Demo User",
                    role="user"
                )
        finally:
            session.close()
    except Exception as e:
        print(f"Warning: Could not create demo user: {e}")

app.include_router(auth_router.router)
app.include_router(mod_router.router)
app.include_router(history_router.router)
app.include_router(users_router.router)
app.include_router(social_router.router)
app.include_router(video_router.router)
