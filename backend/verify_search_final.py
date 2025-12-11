import logging
# Clean output
logging.basicConfig(level=logging.ERROR)

from sqlmodel import Session, select, col, or_
from app.db import engine
from app.models import User
import sys
import os

sys.path.append(os.getcwd())

def verify_search():
    with Session(engine) as session:
        # Get Charu
        charu = session.exec(select(User).where(User.username == "charu")).first()
        if not charu:
            print("CRITICAL: User 'charu' not found in DB.")
            return

        print(f"Testing as User: {charu.username} (ID: {charu.id})")

        test_cases = [
            "jainam4",      # Exact
            "Jainam4",      # Case
            " jainam4 ",    # Spaces (Backend should handle stripping if frontend doesn't, but here we test raw query logic if we implemented strip in API)
            "JAINAM4"       # Uppercase
        ]

        print("-" * 30)
        for q in test_cases:
            # Backend Logic Simulation (as per friends.py)
            # Note: friends.py does `q = q.strip()` at the start of the endpoint.
            clean_q = q.strip()
            
            print(f"Query: '{q}' -> Cleaned: '{clean_q}'")
            
            statement = select(User).where(
                or_(
                    col(User.username).ilike(f"%{clean_q}%"), 
                    col(User.full_name).ilike(f"%{clean_q}%")
                )
            ).where(User.id != charu.id).limit(20)
            
            results = session.exec(statement).all()
            
            found = False
            for u in results:
                if u.username == "jainam4":
                    found = True
                    break
            
            status = "✅ FOUND" if found else "❌ FAILED"
            print(f"Result: {status}")
            print("-" * 30)

if __name__ == "__main__":
    verify_search()
