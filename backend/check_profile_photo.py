from sqlmodel import Session, select, create_engine
from app.models import User
import os

# Setup DB connection
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    # Fallback for local dev if env not set
    DATABASE_URL = "sqlite:///./backend/safechat.db"

engine = create_engine(DATABASE_URL)

def check_avatars():
    with Session(engine) as session:
        statement = select(User)
        users = session.exec(statement).all()
        print(f"Found {len(users)} users.")
        for user in users:
            photo = user.profile_photo
            status = "MISSING"
            if photo:
                if len(photo) > 100:
                    status = f"PRESENT (Len: {len(photo)} chars, Starts with: {photo[:30]}...)"
                else:
                    status = f"PRESENT (Short: {photo})"
            
            print(f"User: {user.username} | Email: {user.email} | Photo: {status}")

if __name__ == "__main__":
    check_avatars()
