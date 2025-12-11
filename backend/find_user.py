from sqlmodel import Session, select
from app.db import engine
from app.models import User
import sys
import os

# Ensure we can import 'app'
sys.path.append(os.getcwd())

def find_user_by_email(email):
    with Session(engine) as session:
        statement = select(User).where(User.email == email)
        user = session.exec(statement).first()
        if user:
            print(f"FOUND USER: Username='{user.username}'")
        else:
            print(f"No user found with email '{email}'")

if __name__ == "__main__":
    find_user_by_email("jainamjainrj@gmail.com")
