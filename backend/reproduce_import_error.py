import sys
import os

# Simulate Vercel which might set cwd to project root or api/
# We want to emulate 'api/index.py' execution context
current_dir = os.path.dirname(os.path.abspath(__file__)) # This is where reproduction script runs
project_root = current_dir # For local simulation, say we are in backend/

# Attempt the same logic as api/index.py
# Vercel structure: /var/task/api/index.py
# Backend code: /var/task/backend/app or /var/task/app depending on upload

print(f"Current CWD: {os.getcwd()}")
print(f"Script Dir: {current_dir}")

# Attempt to import app.main
try:
    # Logic from api/index.py
    # sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) 
    # ^In real deployment, if index.py is at root/api/index.py, dirname(dirname) is root/
    
    # Let's adjust sys.path explicitly to include THIS directory (backend/)
    if current_dir not in sys.path:
        sys.path.append(current_dir)
        
    print(f"Sys Path: {sys.path}")
    
    from app.main import app
    print("Import SUCCESS")
except ImportError as e:
    print(f"Import FAILED: {e}")
except Exception as e:
    print(f"Other Error: {e}")
