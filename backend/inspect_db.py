import sqlite3

def inspect():
    try:
        conn = sqlite3.connect('safechat.db')
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(user)")
        columns = cursor.fetchall()
        print("Columns in 'user' table:")
        for col in columns:
            print(f"- {col[1]}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect()
