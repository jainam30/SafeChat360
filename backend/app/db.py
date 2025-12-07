from sqlmodel import SQLModel, create_engine, Session
import os

from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env if present

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
