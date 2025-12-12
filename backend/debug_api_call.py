import requests
import sys

BASE_URL = "http://localhost:8000"

def debug_api():
    # 1. Login
    print("Logging in as charu...")
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "identifier": "charu",
        "password": "password123"
    })
    
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        sys.exit(1)
        
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Search
    email_q = "jainamjainrj@gmail.com"
    print(f"Searching API for '{email_q}'...")
    
    resp = requests.get(f"{BASE_URL}/api/friends/search", params={"q": email_q}, headers=headers)
    
    if resp.status_code != 200:
        print(f"Search failed: {resp.text}")
        return
        
    data = resp.json()
    print(f"API Response Status: {resp.status_code}")
    print(f"Results Count: {len(data)}")
    for u in data:
        print(f"- {u['username']} (ID: {u['id']})")

if __name__ == "__main__":
    debug_api()
