import logging
# Disable sqlalchemy logs
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

from sqlmodel import Session, select, col, or_
from app.db import engine
from app.models import User
import sys
import os

sys.path.append(os.getcwd())

def test_charu_search():
    try:
        with Session(engine) as session:
            # 1. Get Charu
            charu = session.exec(select(User).where(User.username == "charu")).first()
            if not charu:
                print("Error: User 'charu' not found.", flush=True)
                return

            # 2. Get Jainam4
            jainam4 = session.exec(select(User).where(User.username == "jainam4")).first()
            if not jainam4:
                print("Error: User 'jainam4' not found.", flush=True)
                print("Listing all users:", flush=True)
                for u in session.exec(select(User)).all():
                    print(f"- {u.username}", flush=True)
                return
            
            print(f"Charu ID: {charu.id}", flush=True)
            print(f"Jainam4 ID: {jainam4.id}", flush=True)

            # 3. Simulate Search
            q = "jainam4"
            print(f"Simulating search query: '{q}' as Charu...", flush=True)
            
            statement = select(User).where(
                or_(
                    col(User.username).ilike(f"%{q}%"), 
                    col(User.full_name).ilike(f"%{q}%")
                )
            ).where(User.id != charu.id).limit(20)
            
            results = session.exec(statement).all()
            
            print(f"Results Found: {len(results)}", flush=True)
            found = False
            for user in results:
                print(f"- Found: {user.username} (ID: {user.id})", flush=True)
                if user.id == jainam4.id:
                    found = True
            
            if found:
                print("SUCCESS: jainam4 was found in the search results.", flush=True)
            else:
                print("FAILURE: jainam4 was NOT in the search results.", flush=True)
    except Exception as e:
        print(f"EXCEPTION: {e}", flush=True)

if __name__ == "__main__":
    test_charu_search()
