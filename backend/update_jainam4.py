from sqlmodel import Session, select
from app.db import engine
from app.models import User

def update_jainam4():
    with Session(engine) as session:
        statement = select(User).where(User.username == "jainam4")
        user = session.exec(statement).first()
        
        if not user:
            print("User jainam4 not found.")
            return

        print(f"Found user: {user.username}, current phone: {user.phone_number}")
        
        # Update phone number to include +91 if not present, or just set a dummy valid one if missing
        if user.phone_number:
            if not user.phone_number.startswith("+91"):
                # Append or prepend? 
                # If it's just a number like '9876543210', make it '+919876543210'
                clean_num = user.phone_number.replace("+", "")
                user.phone_number = f"+91{clean_num}"
            else:
                print("User already has +91 code.")
        else:
             user.phone_number = "+919876543210" # Default dummy if missing
             
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"Updated user: {user.username}, new phone: {user.phone_number}")

if __name__ == "__main__":
    update_jainam4()
