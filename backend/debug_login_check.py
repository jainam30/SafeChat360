from sqlmodel import Session, select
from app.db import engine
from app.models import User
from app.auth_utils import verify_password, get_password_hash

def check_user(identifier, password):
    with Session(engine) as session:
        print(f"Checking user: {identifier}")
        # Try finding by email
        user = session.exec(select(User).where(User.email == identifier)).first()
        if not user:
             # Try username
             user = session.exec(select(User).where(User.username == identifier)).first()
        
        if not user:
            print("❌ User NOT FOUND in database.")
            # List all users to help debug
            all_users = session.exec(select(User)).all()
            print(f"DEBUG: Found {len(all_users)} users in DB: {[u.email for u in all_users]}")
            return

        print(f"✅ User FOUND: ID={user.id}, Username={user.username}, Email={user.email}")
        print(f"Stored Hash: {user.hashed_password}")
        
        # Verify Password
        is_valid = verify_password(password, user.hashed_password)
        if is_valid:
            print("✅ Password MATCHES!")
        else:
            print("❌ Password does NOT match.")
            print(f"DEBUG: Test verification with 'password123': {verify_password('password123', user.hashed_password)}")

if __name__ == "__main__":
    # CHANGE THIS TO THE EMAIL/USER YOU ARE TRYING
    TEST_EMAIL = "jainamjainrj@gmail.com" 
    TEST_PASS = "password123" 
    
    print("--- User Verification Tool ---")
    try:
        check_user(TEST_EMAIL, TEST_PASS)
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
