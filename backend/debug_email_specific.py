from sqlmodel import Session, select, col, or_
from app.db import engine
from app.models import User
import sys
import os

sys.path.append(os.getcwd())

def test_exact_email_search():
    with Session(engine) as session:
        # 1. Who is searching? (Assume Charu)
        me = session.exec(select(User).where(User.username == "charu")).first()
        if not me:
            print("Charu not found")
            return

        # 2. Who are we looking for?
        target_email = "jainamjainrj@gmail.com"
        target = session.exec(select(User).where(User.email == target_email)).first()
        
        if not target:
            print(f"Target email '{target_email}' NOT found in DB.")
            return
        
        print(f"Me: {me.username} (ID: {me.id})")
        print(f"Target: {target.username} (ID: {target.id})")
        
        if me.id == target.id:
            print("WARNING: You are searching for yourself! Iterate logic excludes self.")
            return

        # 3. Simulate Search
        q = target_email # Exact string from user
        print(f"Searching for q='{q}'")
        
        statement = select(User).where(
            or_(
                col(User.username).ilike(f"%{q}%"), 
                col(User.full_name).ilike(f"%{q}%"),
                col(User.email).ilike(f"%{q}%")
            )
        ).where(User.id != me.id)
        
        results = session.exec(statement).all()
        print(f"Results: {len(results)}")
        for r in results:
            print(f"- Found: {r.username} (Email: {r.email})")

if __name__ == "__main__":
    test_exact_email_search()
