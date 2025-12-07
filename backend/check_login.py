import requests
import sys

BASE_URL = "http://localhost:8000"

def test_flow():
    email = "jainamjainrj@gmail.com"
    password = "TempPass123!"
    
    print(f"Testing login for {email}...")

    print("\n2. Attempting login...")
    try:
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        print(f"Login status: {r.status_code}")
        try:
            print(f"Login JSON: {r.json()}")
        except:
            print(f"Login Text: {r.text}")
            
    except Exception as e:
        print(f"Login Request Failed: {e}")

if __name__ == "__main__":
    test_flow()
