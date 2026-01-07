from app.db import engine
from sqlalchemy import text

def migrate():
    print("--- STARTING MIGRATION ---")
    print("Attempting to add 'type' column to 'message' table...")
    try:
        with engine.connect() as connection:
            # Check if column exists first to avoid error? 
            # Postgres will throw an error if it exists, but that's fine, we catch it.
            # SQLite syntax is slightly different but usually ALTER TABLE ADD COLUMN works for both.
            # However, for SQLite, 'VARCHAR' might be TEXT. SQLModel/SQLAlchemy abstracts this usually but raw SQL is specific.
            # 'VARCHAR' works in both usually (sqlite treats it as text affinity).
            
            connection.execute(text("ALTER TABLE message ADD COLUMN type VARCHAR DEFAULT 'text'"))
            connection.commit()
            
        print("SUCCESS: 'type' column added to 'message' table.")
    except Exception as e:
        print(f"MIGRATION INFO: {e}")
        print("The column might already exist or there was a syntax issue. If the app works, ignore this.")

if __name__ == "__main__":
    migrate()
