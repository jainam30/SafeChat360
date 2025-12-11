import sqlite3
import os

db_path = 'safechat.db'
if not os.path.exists(db_path):
    print(f"Database not found at {os.path.abspath(db_path)}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()
try:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user'")
    if not cursor.fetchone():
        print("Table 'user' does not exist.")
        # Try finding tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        print("Tables found:", [r[0] for r in cursor.fetchall()])
    else:
        cursor.execute("SELECT id, username, email, role FROM user ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        if row:
            print("--- LAST USER ---")
            print(f"ID: {row[0]}")
            print(f"Username: {row[1]}")
            print(f"Email: {row[2]}")
            print(f"Role: {row[3]}")
        else:
            print("No users in table.")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
