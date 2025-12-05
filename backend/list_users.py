import sqlite3

def list_users():
    try:
        conn = sqlite3.connect('safechat.db')
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, username, role FROM user")
        users = cursor.fetchall()
        with open("users.txt", "w") as f:
            for u in users:
                f.write(f"ID: {u[0]} | Email: {u[1]} | Username: {u[2]}\n")
        print("Users written to users.txt")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_users()
