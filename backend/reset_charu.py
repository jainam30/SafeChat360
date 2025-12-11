from app.auth_utils import get_password_hash
from sqlmodel import Session, select
from app.db import engine
from app.models import User
import sys
import os

sys.path.append(os.getcwd())

def reset_password(username, new_password):
    hashed = get_password_hash(new_password)
    with Session(engine) as session:
        statement = select(User).where(User.username == username)
        user = session.exec(statement).first()
        if user:
            user.hashed_password = hashed
            session.add(user)
            session.commit()
            print(f"SUCCESS: Password for '{username}' updated successfully.")
        else:
            print(f"ERROR: User '{username}' not found.")

if __name__ == "__main__":
    reset_password("charu", "password123")
