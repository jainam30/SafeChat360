from sqlmodel import SQLModel, Session, select
from app.db import engine, get_session
from app.models import User
from app.auth_utils import get_password_hash
from app import models # Import all models to register them with metadata

def init_db():
    print("Creating database tables...")
    SQLModel.metadata.create_all(engine)
    print("Tables created.")

    # Create test user if not exists
    with Session(engine) as session:
        email = "jainamjainrj@gmail.com"
        user = session.exec(select(User).where(User.email == email)).first()
        if not user:
            print(f"Creating test user: {email}")
            user = User(
                email=email,
                username="jainam",
                hashed_password=get_password_hash("password123"), # Initial password
                role="admin",
                trust_score=100
            )
            session.add(user)
            session.commit()
            print(f"User {email} created.")
        else:
            print(f"User {email} already exists.")

if __name__ == "__main__":
    init_db()
