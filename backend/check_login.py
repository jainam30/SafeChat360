import requests
import sys

BASE_URL = "http://localhost:8000"

def test_flow():
    email = "jainamjainrj@gmail.com"
    password = "TempPass123!"
    
    print(f"Testing login for {email}...")
    # Skip registration since user exists
    # try:
    #     r = requests.post(f"{BASE_URL}/api/auth/register", json={...})
    # except ...

    print("\n2. Attempting login...")
    try:
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        print(f"Login status: {r.status_code}")
        print(f"Login response: {r.text}")
    except Exception as e:
        print(f"Login failed: {e}")

if __name__ == "__main__":
    test_flow()
