import requests
import json

BASE_URL = "http://localhost:8000"
EMAIL = "jainamjainrj@gmail.com"
PASSWORD = "password123"

def debug_chat():
    print("--- Debug Chat Sending ---")
    
    # 1. Login
    try:
        print("Logging in...")
        res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": EMAIL,
            "password": PASSWORD,
            "device_id": "debug_script"
        })
        if res.status_code != 200:
            print(f"❌ Login Failed: {res.status_code} - {res.text}")
            return
            
        token = res.json().get("access_token")
        print("✅ Login Success! Token acquired.")
        
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return

    # 2. Send Message
    try:
        print("\nSending Test Message...")
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "content": "Hello from debug script!"
        }
        
        # Note: receiver_id and group_id are optional (Global Chat)
        msg_res = requests.post(f"{BASE_URL}/api/chat/send", json=payload, headers=headers)
        
        if msg_res.status_code == 200:
            print("✅ Message Sent Successfully!")
            print(f"Response: {json.dumps(msg_res.json(), indent=2)}")
        else:
            print(f"❌ Send Failed: {msg_res.status_code}")
            print(f"Error: {msg_res.text}")
            
    except Exception as e:
        print(f"❌ Request Error: {e}")

if __name__ == "__main__":
    debug_chat()
