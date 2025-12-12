from sqlmodel import Session, select
from app.db import engine
from app.models import User
from app.auth_utils import get_password_hash

def create_test_user():
    with Session(engine) as session:
        # Check if exists
        existing = session.exec(select(User).where(User.username == "testuser")).first()
        if existing:
            print("User already exists")
            return

        user = User(
            email="test@example.com",
            username="testuser",
            hashed_password=get_password_hash("password123"),
            full_name="Test User",
            role="user"
        )
        session.add(user)
        session.commit()
        print("User 'testuser' created successfully.")

if __name__ == "__main__":
    create_test_user()
