from app.db import engine, DATABASE_URL
from sqlmodel import SQLModel
from app import models  # Import models to register them

def reset_db():
    print(f"Resetting database at: {DATABASE_URL}")
    print("Dropping all tables...")
    SQLModel.metadata.drop_all(engine)
    print("Creating all tables...")
    SQLModel.metadata.create_all(engine)
    print("Database reset complete.")

if __name__ == "__main__":
    reset_db()
