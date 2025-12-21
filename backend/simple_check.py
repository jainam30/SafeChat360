import sys
import os
sys.path.append(os.getcwd())
from sqlmodel import Session, select
from app.db import engine
from app.models import User

def check():
    print("START CHECK", flush=True)
    try:
        with Session(engine) as session:
            users = session.exec(select(User).limit(10)).all()
            print(f"Total Users Found: {len(users)}", flush=True)
            for u in users:
                print(f"User: {u.username} | Email: {u.email}", flush=True)
                
            j4 = session.exec(select(User).where(User.username == "jainam4")).first()
            if j4:
                print(f"TARGET FOUND: {j4.username}", flush=True)
            else:
                print("TARGET 'jainam4' NOT FOUND", flush=True)
    except Exception as e:
        print(f"ERROR: {e}", flush=True)

if __name__ == "__main__":
    check()
