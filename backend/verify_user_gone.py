from sqlmodel import Session, select
from app.db import engine
from app.models import User

def verify_user(username: str):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.username == username)).first()
        if user:
            print(f"WARNING: User '{username}' STILL EXISTS with ID: {user.id}")
        else:
            print(f"CONFIRMED: User '{username}' does NOT exist in the database.")

if __name__ == "__main__":
    verify_user("shahdhwani500")
