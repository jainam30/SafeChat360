import requests

BASE_URL = "http://localhost:8000"

def test_password_change():
    email = "jainamjainrj@gmail.com"
    old_password = "TempPass123!"
    new_password = "NewSecurePassword123!"
    
    print("1. Logging in...")
    try:
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": old_password
        })
        if r.status_code != 200:
            print(f"Login failed: {r.text}")
            return
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login successful.")
    except Exception as e:
        print(f"Login error: {e}")
        return

    print("\n2. Changing password...")
    try:
        r = requests.put(f"{BASE_URL}/api/users/me/password", headers=headers, json={
            "old_password": old_password,
            "new_password": new_password
        })
        print(f"Change status: {r.status_code}")
        print(f"Change response: {r.text}")
    except Exception as e:
        print(f"Change error: {e}")
        return

    print("\n3. Verifying new password...")
    try:
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": new_password
        })
        print(f"New login status: {r.status_code}")
        if r.status_code == 200:
            print("Password change verified!")
            # Revert back to temp password for user convenience
            print("\n4. Reverting password...")
            token = r.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            requests.put(f"{BASE_URL}/api/users/me/password", headers=headers, json={
                "old_password": new_password,
                "new_password": old_password
            })
            print("Password reverted.")
        else:
            print(f"New login failed: {r.text}")
    except Exception as e:
        print(f"Verification error: {e}")

if __name__ == "__main__":
    test_password_change()
