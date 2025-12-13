from sqlmodel import Session, select
from app.db import engine
from app.models import User, UserSession

def clear_sessions(identifier):
    with Session(engine) as session:
        # Find user
        user = session.exec(select(User).where(User.email == identifier)).first()
        if not user:
             user = session.exec(select(User).where(User.username == identifier)).first()
        
        if not user:
             print("User not found.")
             return

        print(f"Clearing sessions for user {user.username} (ID: {user.id})...")
        
        # Deactivate all
        statement = select(UserSession).where(UserSession.user_id == user.id, UserSession.is_active == True)
        sessions = session.exec(statement).all()
        
        count = 0
        for s in sessions:
            s.is_active = False
            session.add(s)
            count += 1
            
        session.commit()
        print(f"✅ Deactivated {count} active sessions.")

if __name__ == "__main__":
    clear_sessions("jainamjainrj@gmail.com")
