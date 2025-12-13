import sys
import os
import traceback

# Setup Path assuming we run from 'backend' dir or root
cwd = os.getcwd()
print(f"Running from: {cwd}")

if "safechat360" in cwd and "backend" not in cwd:
    sys.path.append(os.path.join(cwd, "backend"))
    os.chdir("backend") # behave like we are in backend

print(f"Sys Path: {sys.path}")

try:
    print("Importing app.main...")
    from app.main import app
    print("SUCCESS: app.main imported")
except ImportError as ie:
    print(f"ImportError: {ie}")
    # Check if upload is the issue
    if "upload" in str(ie):
        print("Upload module seems missing or broken.")
except Exception as e:
    print(f"General Exception: {e}")
    traceback.print_exc()

# Try manual import of routes
try:
    print("Importing app.routes.upload...")
    from app.routes import upload
    print("SUCCESS: upload imported")
except Exception as e:
    print(f"Upload Import Failed: {e}")
    traceback.print_exc()
