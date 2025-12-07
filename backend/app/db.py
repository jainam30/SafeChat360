from sqlmodel import SQLModel, create_engine, Session
import os

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./safechat.db")

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
