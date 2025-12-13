import os
import sys
from dotenv import load_dotenv

load_dotenv()

print(f"DATABASE_URL env var: {os.environ.get('DATABASE_URL')}")

try:
    from app.db import engine
    print(f"Engine URL: {engine.url}")
except Exception as e:
    print(f"Error importing engine: {e}")
