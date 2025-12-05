import sqlite3

def check_hash():
    try:
        conn = sqlite3.connect('safechat.db')
        cursor = conn.cursor()
        cursor.execute("SELECT email, hashed_password FROM user WHERE email = 'jainamjainrj@gmail.com'")
        user = cursor.fetchone()
        if user:
            print(f"Email: {user[0]}")
            print(f"Hash: {user[1]}")
        else:
            print("User not found")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_hash()
