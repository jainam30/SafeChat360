from sqlmodel import Session, select
from app.db import engine
from app.models import User
import sys
import os

# Ensure we can import 'app'
sys.path.append(os.getcwd())

def get_last_user():
    with Session(engine) as session:
        statement = select(User).order_by(User.id.desc()).limit(1)
        user = session.exec(statement).first()
        if user:
            print("--- LAST REGISTERED USER ---")
            print(f"ID: {user.id}")
            print(f"Username: {user.username}")
            print(f"Email: {user.email}")
            print(f"Role: {user.role}")
            print("Password: [HASHED] (Cannot retrieve plain text)")
        else:
            print("No users found.")

if __name__ == "__main__":
    get_last_user()
