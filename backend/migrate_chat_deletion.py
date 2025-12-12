from sqlmodel import Session, text
from app.db import engine

def migrate():
    with Session(engine) as session:
        try:
            print("Adding is_unsent column...")
            session.exec(text("ALTER TABLE message ADD COLUMN is_unsent BOOLEAN DEFAULT 0"))
        except Exception as e:
            print(f"Column exists or error: {e}")

        try:
            print("Adding deleted_by_ids column...")
            session.exec(text("ALTER TABLE message ADD COLUMN deleted_by_ids TEXT"))
        except Exception as e:
            print(f"Column exists or error: {e}")
            
        session.commit()
        print("Migration complete.")

if __name__ == "__main__":
    migrate()
