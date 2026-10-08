import sqlite3
from app.auth_utils import get_password_hash

# Removed incompatible local get_password_hash implementation

def reset_password(email, new_password):
    hashed = get_password_hash(new_password)
    try:
        conn = sqlite3.connect('safechat.db')
        cursor = conn.cursor()
        cursor.execute("UPDATE user SET hashed_password = ? WHERE email = ?", (hashed, email))
        conn.commit()
        if cursor.rowcount > 0:
            print(f"Password updated for {email}")
        else:
            print(f"User {email} not found")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    reset_password("jainamjainrj@gmail.com", "TempPass123!")
