from sqlmodel import SQLModel, create_engine, Session
import os

from dotenv import load_dotenv

load_dotenv(override=True)  # Load environment variables from .env if present, overriding system env

# DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./safechat.db")
# For Vercel: Use /tmp for SQLite if no DATABASE_URL is set (prevents Read-Only error), 
# OR prefer the actual environment variable.
if os.environ.get("VERCEL"):
    DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:////tmp/safechat.db")
else:
    DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./safechat.db")

# Fix for Supabase/Heroku using deprecated 'postgres://' scheme
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine_args = {}
if DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    echo=True,
    **engine_args
)

def get_session():
    with Session(engine) as session:
        yield session
