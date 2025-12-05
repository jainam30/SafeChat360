import requests
import sys

BASE_URL = "http://localhost:8000"

def check_backend():
    print(f"Checking backend at {BASE_URL}...")
    try:
        # Check health/docs
        r = requests.get(f"{BASE_URL}/docs")
        if r.status_code == 200:
            print("Backend is reachable.")
        else:
            print(f"Backend reachable but returned {r.status_code}")
    except Exception as e:
        print(f"Backend not reachable: {e}")
        return

    # Try registration
    print("Attempting registration...")
    try:
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": "test_new@safechat.com",
            "username": "test_user_new",
            "phone_number": "+1987654321",
            "password": "TestPassword123!",
            "full_name": "Test User"
        })
        print(f"Registration status: {r.status_code}")
        with open("response.txt", "w") as f:
            f.write(r.text)
        print("Response written to response.txt")
    except Exception as e:
        print(f"Registration request failed: {e}")

if __name__ == "__main__":
    check_backend()
