import sys
import os
import certifi

# FORCE SSL CERTIFICATE PATH (Fixes Vercel/Firebase SSL Errors)
os.environ['SSL_CERT_FILE'] = certifi.where()

# Robust path handling for Vercel
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)

# Add parent directory to sys.path so we can import 'backend'
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# CRITICAL: Add 'backend' directory to sys.path so 'from app import ...' works inside main.py
backend_dir = os.path.join(parent_dir, 'backend')
if os.path.exists(backend_dir) and backend_dir not in sys.path:
    sys.path.append(backend_dir)

try:
    # Try importing from backend.app.main
    from backend.app.main import app
except Exception as e:
    # SAFETY NET: Return startup error as JSON
    import traceback
    from fastapi import FastAPI
    
    error_msg = traceback.format_exc()
    print(f"CRITICAL STARTUP ERROR: {error_msg}")
    
    app = FastAPI()
    
    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    async def catch_all(path_name: str):
        return {
            "status": "startup_error", 
            "detail": f"Backend failed to start. Traceback: {error_msg}",
            "sys_path": sys.path,
            "cwd": os.getcwd()
        }
