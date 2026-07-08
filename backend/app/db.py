from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings
from app.core.logger import logger

DATABASE_URL = settings.DATABASE_URL
logger.info(f"Configured DATABASE_URL for DB connection")

# Fix for Supabase/Heroku using deprecated 'postgres://' scheme
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine_args = {}
if DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    echo=False,
    **engine_args
)

def get_session():
    with Session(engine) as session:
        yield session
