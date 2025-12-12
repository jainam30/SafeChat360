from sqlmodel import Session, select, create_engine
from app.models import User
from app.auth_utils import get_password_hash
import sys

# Using the main database
DB_PATH = "backend/safechat.db"
sqlite_url = f"sqlite:///{DB_PATH}"
engine = create_engine(sqlite_url)

def reset_password(username, new_password):
    with Session(engine) as session:
        statement = select(User).where(User.username == username)
        user = session.exec(statement).first()
        
        if not user:
            print(f"User '{username}' not found.")
            return
            
        print(f"Found user: {user.username} (ID: {user.id})")
        
        hashed_password = get_password_hash(new_password)
        user.hashed_password = hashed_password
        
        session.add(user)
        session.commit()
        session.refresh(user)
        
        print(f"✅ Password for '{username}' has been successfully reset to '{new_password}'.")

if __name__ == "__main__":
    target_user = "jainam2"
    new_pass = "password123" # Default temporary password
    reset_password(target_user, new_pass)
