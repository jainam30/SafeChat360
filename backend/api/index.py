import sys
import os

# Robust path handling for Vercel
# We need to ensure the resolved path to 'backend' or 'app' parent is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)

# Add both current and parent to be safe, Vercel structure can vary
if current_dir not in sys.path:
    sys.path.append(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# Also try adding 'backend' explicitly if we are in a monorepo structure
backend_dir = os.path.join(parent_dir, 'backend')
if os.path.exists(backend_dir) and backend_dir not in sys.path:
    sys.path.append(backend_dir)

try:
    from app.main import app
except Exception as e:
    # SAFETY NET: If app fails to load (ImportError, Startup Error, etc.),
    # Create a dummy app that returns the error detail so we can see it in browser/frontend.
    import traceback
    from fastapi import FastAPI, Response
    
    error_msg = traceback.format_exc()
    print(f"CRITICAL STARTUP ERROR: {error_msg}")
    
    app = FastAPI()
    
    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    async def catch_all(path_name: str):
        return {
            "status": "startup_error", 
            "detail": f"Backend failed to start. Traceback: {error_msg}",
            "sys_path": sys.path,
            "cwd": os.getcwd(),
            "file": __file__
        }
