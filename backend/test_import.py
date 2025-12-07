import sys
import os
import traceback

# Mimic index.py path logic
# backend/test_import.py -> parent is backend
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

print(f"Sys Path: {sys.path}")

with open("error_trace.txt", "w") as f:
    try:
        from app.main import app
        f.write("SUCCESS")
    except Exception:
        traceback.print_exc(file=f)
