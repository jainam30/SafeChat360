from sqlmodel import SQLModel, create_engine, Session
import os

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./safechat.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Needed for SQLite
    echo=True
)

def get_session():
    with Session(engine) as session:
        yield session
