from sqlmodel import create_engine, text
import os

# Robust path handling
current_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(current_dir, "database.db")
sqlite_url = f"sqlite:///{db_path}"

if os.environ.get("DATABASE_URL"):
    engine = create_engine(os.environ.get("DATABASE_URL"))
else:
    engine = create_engine(sqlite_url)

def fix_schema():
    print(f"Checking schema on {engine.url}...")
    with engine.connect() as conn:
        # 1. Fix Story Table
        try:
            print("Attempting to add missing columns to 'story' table...")
            queries = [
                "ALTER TABLE story ADD COLUMN music_url VARCHAR;",
                "ALTER TABLE story ADD COLUMN overlays VARCHAR;"
            ]
            for q in queries:
                try:
                    conn.execute(text(q))
                    print(f"Executed: {q}")
                except Exception as e:
                    if "duplicate column" in str(e).lower() or "no such column" not in str(e).lower():
                        # Postgres: duplicate column; SQLite: no such column (if table missing)
                         print(f"Skipping (likely exists): {q} - {e}")
            conn.commit()
            print("Story schema patched.")
        except Exception as e:
            print(f"Story patch failed: {e}")

        # 2. Fix Message Table
        try:
            print("Checking 'message' table for missing columns...")
            queries = [
                "ALTER TABLE message ADD COLUMN group_id INTEGER;"
            ]
            for q in queries:
                try:
                    conn.execute(text(q))
                    print(f"Executed: {q}")
                except Exception as e:
                    if "duplicate column" in str(e).lower():
                        print(f"Column already exists in 'message' table.")
                    else:
                        print(f"Skipping: {q} - {e}")
            conn.commit()
        except Exception as e:
            print(f"Message patch failed: {e}")

        # 3. Fix Post Table (Just in case)
        try:
            print("Checking 'post' table...")
            queries = [
                "ALTER TABLE post ADD COLUMN is_flagged BOOLEAN DEFAULT 0;",
                "ALTER TABLE post ADD COLUMN flag_reason VARCHAR;"
            ]
            for q in queries:
                try:
                    conn.execute(text(q))
                except:
                    pass
            conn.commit()
        except:
            pass

if __name__ == "__main__":
    fix_schema()
