import sys
import os
import traceback

# Mimic api/index.py logic
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir) # safechat360 top level if this is in api/

print(f"Current: {current_dir}")
print(f"Parent: {parent_dir}")

# 1. Add Parent
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# 2. Add Backend
backend_dir = os.path.join(parent_dir, 'backend')
if os.path.exists(backend_dir) and backend_dir not in sys.path:
    sys.path.append(backend_dir)

print(f"Sys Path: {sys.path}")

try:
    print("Attempting import: from backend.app.main import app")
    from backend.app.main import app
    print("SUCCESS: backend.app.main imported")
except Exception as e:
    print("FAILURE 1 (backend.app.main):")
    traceback.print_exc()

try:
    print("Attempting import: from app.main import app")
    from app.main import app
    print("SUCCESS: app.main imported")
except Exception as e:
    print("FAILURE 2 (app.main):")
    traceback.print_exc()
