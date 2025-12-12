import requests
import sys

BASE_URL = "http://localhost:8000"

def test_backend():
    print(f"Testing backend at {BASE_URL}...")
    
    # 1. Login
    try:
        print("1. Logging in...")
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "identifier": "testuser",
            "password": "password123"
        })
        if resp.status_code != 200:
            print(f"Login Failed: {resp.status_code} - {resp.text}")
            return
        
        data = resp.json()
        token = data["access_token"]
        print(f"Login Successful. Token: {token[:10]}...")
    except Exception as e:
        print(f"Login Exception: {e}")
        return

    # 2. Get History (Crash suspect)
    try:
        print("\n2. Fetching Chat History...")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{BASE_URL}/api/chat/history", headers=headers)
        
        if resp.status_code == 200:
            print(f"History Fetch Success: {len(resp.json())} messages found.")
            print(resp.json())
        else:
            print(f"History Fetch Failed: {resp.status_code}")
            print(resp.text)
    except Exception as e:
        print(f"History Exception: {e}")

if __name__ == "__main__":
    test_backend()
