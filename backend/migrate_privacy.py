import sqlite3
import os

DB_PATH = "backend/safechat.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if columns exist
        cursor.execute("PRAGMA table_info(post)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "privacy" not in columns:
            print("Adding 'privacy' column...")
            cursor.execute("ALTER TABLE post ADD COLUMN privacy TEXT DEFAULT 'public'")
        else:
            print("'privacy' column already exists.")

        if "allowed_users" not in columns:
            print("Adding 'allowed_users' column...")
            cursor.execute("ALTER TABLE post ADD COLUMN allowed_users TEXT")
        else:
            print("'allowed_users' column already exists.")

        conn.commit()
        print("Migration completed successfully.")
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
