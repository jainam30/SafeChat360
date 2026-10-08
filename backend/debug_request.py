import requests

BASE_URL = "http://127.0.0.1:8000"

def debug_api():
    # 1. Login
    try:
        print("Logging in...")
        resp = requests.post(f"{BASE_URL}/api/auth/token", json={"username": "admin", "password": "admin123"})
        if resp.status_code != 200:
            print(f"Login failed: {resp.status_code} {resp.text}")
            return # check form data vs json

        # Auth usually expects 'username' and 'password' as form data if using OAuth2PasswordRequestForm
        # Let's try form data
        resp = requests.post(f"{BASE_URL}/api/auth/token", data={"username": "admin", "password": "admin123"})
        if resp.status_code != 200:
             print(f"Login form failed: {resp.status_code} {resp.text}")
             return

        token = resp.json()["access_token"]
        print(f"Got token.")

        # 2. Call Stats
        print("Calling /stats...")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{BASE_URL}/api/analytics/stats", headers=headers)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_api()
