import sys
import os
sys.path.append(os.getcwd())
from sqlmodel import Session, select
from app.db import engine
from app.models import User
from app.auth_utils import verify_password
import traceback

def test_login(username, candidate_password):
    print(f"--- TESTING LOGIN FOR: {username} ---", flush=True)
    try:
        with Session(engine) as session:
            # 1. Fetch User
            user = session.exec(select(User).where(User.username == username)).first()
            if not user:
                user = session.exec(select(User).where(User.email == username)).first()
            
            if not user:
                print("❌ User NOT FOUND in DB.", flush=True)
                return

            print(f"✅ User Found: {user.username} (ID: {user.id})", flush=True)
            print(f"   Stored Hash: {user.hashed_password[:20]}...", flush=True)

            # 2. Verify Password
            is_valid = verify_password(candidate_password, user.hashed_password)
            if is_valid:
                print(f"✅ PASSWORD MATCH: '{candidate_password}' is CORRECT.", flush=True)
            else:
                print(f"❌ PASSWORD MISMATCH: '{candidate_password}' is INCORRECT.", flush=True)

    except Exception as e:
        print(f"ERROR: {e}", flush=True)
        traceback.print_exc()

if __name__ == "__main__":
    test_login("jainam4", "Password123!")
    test_login("jainam", "Password123!")
