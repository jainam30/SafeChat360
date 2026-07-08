import firebase_admin
from firebase_admin import credentials
import os
import json

def init_firebase():
    try:
        # Check if already initialized to avoid errors on reload
        if not firebase_admin._apps:
            # 1. Try Environment Variable (For Vercel/Production)
            firebase_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
            
            if firebase_json:
                try:
                    cred_dict = json.loads(firebase_json)
                    cred = credentials.Certificate(cred_dict)
                    firebase_admin.initialize_app(cred)
                    print("Firebase Admin Initialized from Environment Variable")
                    return
                except json.JSONDecodeError as e:
                    print(f"Error parsing FIREBASE_SERVICE_ACCOUNT_JSON: {e}")

            # 2. Try Local File (For Local Dev)
            # Path to serviceAccountKey.json
            cred_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "serviceAccountKey.json")
            
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                print("Firebase Admin Initialized from Local File")
            else:
                print(f"WARNING: Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT_JSON env var or place serviceAccountKey.json in backend root.")
    except Exception as e:
        print(f"Error initializing Firebase: {str(e)}")
