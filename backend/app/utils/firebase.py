import firebase_admin
from firebase_admin import credentials
import os
import json
import logging

logger = logging.getLogger(__name__)

def _parse_service_account_dict(raw: str):
    if not raw or not raw.strip():
        return None
    cleaned = raw.strip()
    # Strip wrapping outer quotes if user pasted '"...json..."' or ''...json...'' in hosting dashboard
    if (cleaned.startswith('"') and cleaned.endswith('"')) or (cleaned.startswith("'") and cleaned.endswith("'")):
        cleaned = cleaned[1:-1].strip()
    
    # 1. Try direct parse
    try:
        return json.loads(cleaned, strict=False)
    except Exception:
        pass
        
    # 2. Try converting literal escaped newlines to real newlines
    try:
        return json.loads(cleaned.replace('\\n', '\n'), strict=False)
    except Exception:
        pass

    # 3. Try converting unescaped newlines to escaped newlines
    try:
        return json.loads(cleaned.replace('\n', '\\n').replace('\r', ''), strict=False)
    except Exception:
        pass

    return None

def init_firebase():
    try:
        # Check if already initialized to avoid errors on reload
        if not firebase_admin._apps:
            # 1. Try Environment Variable (For Render/Production)
            firebase_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON") or os.environ.get("firebase_service_account_json")
            
            if firebase_json:
                cred_dict = _parse_service_account_dict(firebase_json)
                if cred_dict:
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred)
                    logger.info("Firebase Admin Initialized successfully from Environment Variable")
                    return
                else:
                    logger.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON environment variable as valid JSON.")

            # 2. Try Local File / Configured Path
            possible_paths = [
                os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "serviceAccountKey.json"),
                os.path.join(os.getcwd(), "serviceAccountKey.json"),
                os.path.join(os.getcwd(), "backend", "serviceAccountKey.json")
            ]
            
            for path in possible_paths:
                if os.path.exists(path):
                    try:
                        cred = credentials.Certificate(path)
                        firebase_admin.initialize_app(cred)
                        logger.info(f"Firebase Admin Initialized successfully from Local File: {path}")
                        return
                    except Exception as e:
                        logger.error(f"Error loading Firebase credentials from {path}: {e}")

            logger.warning("WARNING: Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT_JSON env var or place serviceAccountKey.json in backend directory.")
    except Exception as e:
        logger.error(f"Error initializing Firebase Admin SDK: {e}")

