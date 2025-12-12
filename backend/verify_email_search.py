from sqlmodel import Session, select, col, or_
from app.db import engine
from app.models import User
import sys
import os

sys.path.append(os.getcwd())

def verify_email_search():
    with Session(engine) as session:
        # Get target email
        target = session.exec(select(User).where(User.username == "jainam4")).first()
        if not target:
            print("Target 'jainam4' not found.")
            return

        print(f"Target: {target.username} | Email: {target.email}")
        
        # Test Queries
        queries = [
            target.email,             # Full email
            target.email.split('@')[0], # Prefix
            "gmail.com"               # Domain
        ]

        print(f"--- Testing Email Search ---")
        for q in queries:
            print(f"Searching for: '{q}'")
            statement = select(User).where(
                or_(
                    col(User.username).ilike(f"%{q}%"), 
                    col(User.full_name).ilike(f"%{q}%"),
                    col(User.email).ilike(f"%{q}%") # This is the new line
                )
            ).limit(20)
            
            results = session.exec(statement).all()
            found = any(u.username == target.username for u in results)
            print(f"Result: {'✅ Found' if found else '❌ Not Found'}")

if __name__ == "__main__":
    verify_email_search()
