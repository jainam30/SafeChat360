from sqlmodel import Session, select, col
from app.db import engine
from app.models import User
import sys
import os

sys.path.append(os.getcwd())

def test_search(query):
    print(f"Searching for: '{query}'")
    with Session(engine) as session:
        # Replicating the logic in friends.py
        statement = select(User).where(
            (col(User.username).contains(query)) | (col(User.full_name).contains(query))
        )
        users = session.exec(statement).all()
        print(f"Found {len(users)} users:")
        for u in users:
            print(f"- {u.username} (Full: {u.full_name})")

if __name__ == "__main__":
    test_search("charu")
    test_search("Charu")
    test_search("CHARU")
