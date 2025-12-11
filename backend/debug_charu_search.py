from sqlmodel import Session, select, col, or_
from app.db import engine
from app.models import User
import sys
import os

sys.path.append(os.getcwd())

def test_charu_search():
    with Session(engine) as session:
        # 1. Get Charu
        charu = session.exec(select(User).where(User.username == "charu")).first()
        if not charu:
            print("Error: User 'charu' not found.")
            return

        # 2. Get Jainam4 (to confirm existence)
        jainam4 = session.exec(select(User).where(User.username == "jainam4")).first()
        if not jainam4:
            print("Error: User 'jainam4' not found.")
            # List all users to see what's there
            print("Listing all users:")
            for u in session.exec(select(User)).all():
                print(f"- {u.username}")
            return
        
        print(f"Charu ID: {charu.id}")
        print(f"Jainam4 ID: {jainam4.id}")

        # 3. Simulate Search
        q = "jainam4"
        print(f"\nSimulating search query: '{q}' as Charu...")
        
        # EXACT LOGIC FROM friends.py
        statement = select(User).where(
            or_(
                col(User.username).ilike(f"%{q}%"), 
                col(User.full_name).ilike(f"%{q}%")
            )
        ).where(User.id != charu.id).limit(20)
        
        results = session.exec(statement).all()
        
        print(f"Results Found: {len(results)}")
        found = False
        for user in results:
            print(f"- Found: {user.username} (ID: {user.id})")
            if user.id == jainam4.id:
                found = True
        
        if found:
            print("\nSUCCESS: jainam4 was found in the search results.")
        else:
            print("\nFAILURE: jainam4 was NOT in the search results.")

if __name__ == "__main__":
    test_charu_search()
