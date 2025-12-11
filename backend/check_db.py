import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Force load .env from parent dir or current
# backend/.env might exist?
load_dotenv() 

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./safechat.db")
print(f"Testing connection to: {DATABASE_URL}")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("Connection successful!", result.fetchone())
except Exception as e:
    print(f"Connection FAILED: {e}")
    sys.exit(1)
