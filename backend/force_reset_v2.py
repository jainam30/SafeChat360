import sys
import os
import traceback

# Setup Absolute Log Path
log_file = os.path.join(os.getcwd(), "force_reset.log")

def log(msg):
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

log("--- STARTING RESET ---")

try:
    sys.path.append(os.getcwd())
    log(f"CWD: {os.getcwd()}")
    
    from sqlmodel import Session, select
    from app.db import engine
    from app.models import User
    from app.auth_utils import get_secure_password_hash
    
    log("Imports successful.")

    def reset(username, new_pass="Password123!"):
        log(f"Attempting reset for: {username}")
        with Session(engine) as session:
            user = session.exec(select(User).where(User.username == username)).first()
            if not user:
                 user = session.exec(select(User).where(User.email == username)).first()
            
            if user:
                log(f"FOUND USER: {user.username} (ID: {user.id})")
                user.hashed_password = get_secure_password_hash(new_pass)
                session.add(user)
                session.commit()
                log(f"SUCCESS: Password reset to '{new_pass}'")
            else:
                log("User NOT FOUND.")

    targets = ["jainam4", "jainam", "admin"]
    for t in targets:
        reset(t)

except Exception as e:
    log(f"CRITICAL ERROR: {e}")
    log(traceback.format_exc())

log("--- END ---")
