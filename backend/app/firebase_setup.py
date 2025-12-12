import firebase_admin
from firebase_admin import credentials
import os

def init_firebase():
    try:
        # Check if already initialized to avoid errors on reload
        if not firebase_admin._apps:
            # Path to serviceAccountKey.json
            cred_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "serviceAccountKey.json")
            
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                print("Firebase Admin Initialized Successfully")
            else:
                print(f"WARNING: Firebase credentials not found at {cred_path}")
    except Exception as e:
        print(f"Error initializing Firebase: {str(e)}")
