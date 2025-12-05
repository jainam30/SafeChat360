import sqlite3
import hashlib

def get_password_hash(password: str) -> str:
    pwd_str = str(password).strip()
    return hashlib.pbkdf2_hmac('sha256', pwd_str.encode(), b'salt_dev', 100000).hex()

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
