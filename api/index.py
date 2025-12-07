import sys
import os

# Add the 'backend' directory to sys.path
# Since this file is in /api/index.py, the root is one level up '..'
# and the backend is in '../backend'
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, 'backend')

sys.path.append(backend_dir)

try:
    from app.main import app
except Exception as e:
    import traceback
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI()

    @app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    async def catch_all(path: str):
        error_msg = {
            "error": "Backend failed to start",
            "details": str(e),
            "traceback": traceback.format_exc()
        }
        return JSONResponse(status_code=500, content=error_msg)

