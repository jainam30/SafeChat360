from sqlmodel import Session, select
from app.db import engine, get_session
from app.models import User
from app.auth_utils import get_secure_password_hash
import sys
import os

# Add current directory to path so we can import app modules
sys.path.append(os.getcwd())

def fix_user(username_or_email, new_password="Password123!"):
    print(f"--- Fixing User: {username_or_email} ---")
    
    with Session(engine) as session:
        # Try to find user
        user = session.exec(select(User).where(User.username == username_or_email)).first()
        if not user:
             user = session.exec(select(User).where(User.email == username_or_email)).first()
             
        if not user:
            print(f"❌ User '{username_or_email}' NOT FOUND in the database.")
            print("Please Register properly on the website first.")
            return

        print(f"✅ User Found: ID={user.id}, Username={user.username}, Email={user.email}")
        
        # Reset Password
        print(f"Resetting password to: '{new_password}'")
        hashed = get_secure_password_hash(new_password)
        user.hashed_password = hashed
        session.add(user)
        session.commit()
        session.refresh(user)
        print("✅ Password Reset Successfully.")
        print(f"Try logging in with: {user.username} / {new_password}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python fix_user_login.py <username_or_email>")
        print("Example: python fix_user_login.py jainam4")
    else:
        fix_user(sys.argv[1])
