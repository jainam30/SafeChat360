from sqlmodel import Session, select
from app.db import engine
from app.models import User, Friendship
import sys
import os

sys.path.append(os.getcwd())

def reset():
    with Session(engine) as session:
        u1 = session.exec(select(User).where(User.username == "charu")).first()
        u2 = session.exec(select(User).where(User.username == "jainam4")).first()
        
        if not u1 or not u2:
            print("Users not found")
            return

        # Find friendship
        fs = session.exec(select(Friendship).where(
            ((Friendship.user_id == u1.id) & (Friendship.friend_id == u2.id)) |
            ((Friendship.user_id == u2.id) & (Friendship.friend_id == u1.id))
        )).all()
        
        for f in fs:
            session.delete(f)
        
        session.commit()
        print(f"Deleted {len(fs)} friendship records between {u1.username} and {u2.username}")

if __name__ == "__main__":
    reset()
