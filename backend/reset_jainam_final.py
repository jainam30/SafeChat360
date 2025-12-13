from app.db import get_session
from app import crud
from app.auth_utils import get_password_hash

session = next(get_session())
email = "jainamjainrj@gmail.com"
user = crud.get_user_by_email(session, email)

if user:
    print(f"Resetting password for {user.email}...")
    user.hashed_password = get_password_hash("password123")
    session.add(user)
    session.commit()
    print("Password reset to: password123")
else:
    print("User not found locally.")
