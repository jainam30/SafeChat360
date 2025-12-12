import sqlite3
import os

DB_NAME = "safechat.db" # Check if safechat.db is in root or backend? 
# Based on previous tasks, it seems to be in root or backend/safechat.db?
# migrate_privacy.py used "backend/safechat.db" or similar?
# Let's check where safechat.db is.
# user's cwd is 'c:\Users\JAINAM\OneDrive\Desktop\safechat360'
# verify_privacy updated to use in memory, but earlier it referenced backend/safechat.db?
# let's try 'backend/safechat.db' first.

DB_PATH = "backend/safechat.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Checking for 'notification' table...")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='notification'")
    if cursor.fetchone():
        print("'notification' table already exists.")
    else:
        print("Creating 'notification' table...")
        # SQLModel: id (int pk), user_id(int), type(str), source_id(int), source_name(str), reference_id(int), is_read(bool), created_at(datetime)
        cursor.execute("""
            CREATE TABLE notification (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type VARCHAR NOT NULL,
                source_id INTEGER,
                source_name VARCHAR,
                reference_id INTEGER,
                is_read BOOLEAN DEFAULT 0,
                created_at DATETIME
            )
        """)
        # Indexes
        cursor.execute("CREATE INDEX ix_notification_user_id ON notification (user_id)")
        print("'notification' table created.")
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
