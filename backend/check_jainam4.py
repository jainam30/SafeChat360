from sqlmodel import Session, select, col, or_
from app.db import engine
from app.models import User
import sys
import os

sys.path.append(os.getcwd())

def check_user(username):
    with Session(engine) as session:
        # Check direct existence
        print(f"Checking for user: '{username}'")
        u = session.exec(select(User).where(User.username == username)).first()
        if u:
            print(f"FOUND: ID={u.id}, Username={u.username}, Email={u.email}")
        else:
            print("NOT FOUND by exact match.")
            # List similar
            similar = session.exec(select(User).where(col(User.username).contains(username))).all()
            if similar:
                print(f"Found similar users: {[u.username for u in similar]}")

        # Simulate Search Logic
        q = username
        statement = select(User).where(
            or_(
                col(User.username).ilike(f"%{q}%"), 
                col(User.full_name).ilike(f"%{q}%")
            )
        ).limit(20)
        search_results = session.exec(statement).all()
        print(f"\nSearch Logic Results for '{q}': {len(search_results)} found.")
        for r in search_results:
            print(f"- {r.username} (ID: {r.id})")

if __name__ == "__main__":
    check_user("jainam4")
