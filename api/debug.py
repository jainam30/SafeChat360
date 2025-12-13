from fastapi import FastAPI
import sys
import os

app = FastAPI()

@app.get("/api/debug")
def debug():
    return {
        "status": "alive",
        "message": "Debug endpoint working from safechat360/api/debug.py",
        "sys_path": sys.path,
        "cwd": os.getcwd(),
        "env_keys": list(os.environ.keys())
    }
