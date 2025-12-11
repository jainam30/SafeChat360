from sqlmodel import Session, select, col
from app.db import engine
from app.models import User
import sys
import os

sys.path.append(os.getcwd())

def test_search():
    with Session(engine) as session:
        # Check if user exists at all
        all_users = session.exec(select(User)).all()
        print(f"Total Users in DB: {len(all_users)}")
        for u in all_users:
            print(f" - ID: {u.id}, Username: '{u.username}'")

        query = "charu"
        print(f"\nSearching for exact match '{query}':")
        results = session.exec(select(User).where(User.username == query)).all()
        print(f"Found: {len(results)}")

        print(f"\nSearching with contains '{query}':")
        results = session.exec(select(User).where(col(User.username).contains(query))).all()
        print(f"Found: {len(results)}")
        
        query_cap = "Charu"
        print(f"\nSearching with contains '{query_cap}':")
        results = session.exec(select(User).where(col(User.username).contains(query_cap))).all()
        print(f"Found: {len(results)}")

if __name__ == "__main__":
    test_search()
