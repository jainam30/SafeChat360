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
    usernames = ["jainam4", "jainam", "admin", "supervisor"]
    if len(sys.argv) > 1:
        usernames = [sys.argv[1]]
        
    with open("fix_result.txt", "w", encoding="utf-8") as f:
        f.write("--- FIX REPORT ---\n")
        
    for u in usernames:
        try:
            # Capture stdout to file
            original_stdout = sys.stdout
            with open("fix_result.txt", "a", encoding="utf-8") as f:
                sys.stdout = f
                fix_user(u)
                sys.stdout = original_stdout
        except Exception as e:
             with open("fix_result.txt", "a", encoding="utf-8") as f:
                f.write(f"\nError fixing {u}: {e}\n")
