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

@app.get("/api/debug/firebase")
def firebase_check():
    import firebase_admin
    from firebase_admin import credentials
    import json
    
    status = {
        "env_var_present": False,
        "env_var_length": 0,
        "json_valid": False,
        "json_keys": [],
        "app_initialized": False,
        "app_name": None,
        "error": None
    }
    
    # 1. Check Env Var
    fb_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    if fb_json:
        status["env_var_present"] = True
        status["env_var_length"] = len(fb_json)
        
        # 2. Try Parse
        try:
            cred_dict = json.loads(fb_json)
            status["json_valid"] = True
            status["json_keys"] = list(cred_dict.keys())
            
            # 3. Try Init
            if not firebase_admin._apps:
                try:
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred)
                    status["app_initialized"] = True
                    status["app_name"] = "[NEWLY INITIALIZED]"
                    status["project_id"] = cred_dict.get("project_id") # EXPOSE ID
                except Exception as e:
                    status["error"] = f"Init Failed: {str(e)}"
            else:
                status["app_initialized"] = True
                status["app_name"] = firebase_admin.get_app().name
                status["project_id"] = firebase_admin.get_app().options.get('projectId') or cred_dict.get("project_id") # EXPOSE ID
                
        except json.JSONDecodeError as e:
            status["error"] = f"JSON Decode Error: {str(e)}"
    else:
        status["error"] = "FIREBASE_SERVICE_ACCOUNT_JSON not found in environment"
        
    return status

# Alias to handle potential path stripping
@app.get("/debug/firebase")
def firebase_check_alias():
    return firebase_check()

@app.get("/firebase")
def firebase_check_alias_2():
    return firebase_check()

# CATCH-ALL TO DEBUG PATH ISSUES
@app.get("/{path_name:path}")
def catch_all(path_name: str):
    return {
        "status": "not_found_caught",
        "message": f"Route not found in debug.py. You requested: {path_name}",
        "available_routes": [
            "/api/debug", 
            "/api/debug/firebase", 
            "/debug/firebase", 
            "/firebase"
        ]
    }
