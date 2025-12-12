import requests
import time

BASE_URL = "http://localhost:8000/api"

def get_token(username, password):
    res = requests.post(f"http://localhost:8000/api/auth/login", json={"identifier": username, "password": password})
    if res.status_code == 200:
        return res.json()["access_token"]
    print(f"Login failed for {username}: {res.text}")
    return None

def test_mentions():
    print("--- Starting Verification: Mentions ---")
    
    # 1. Login as jainam2 (User A)
    token_a = get_token("jainam2", "password123")
    if not token_a: return
    headers_a = {"Authorization": f"Bearer {token_a}"}
    
    # 2. Login as jainam (User B - using existing user 'jainam' or 'jainam30'?)
    # I need another user. Let's register one if not exists or use jainam.
    # Assuming 'jainam' exists (from previous tasks).
    # Does 'jainam' exist? I reset password for 'jainam2'.
    # I'll try to register 'user_b' to be safe.
    
    print("\n[Setup] Registering/getting User B (user_b)...")
    res = requests.post(f"http://localhost:8000/api/auth/register", json={
        "email": "user_b@example.com",
        "username": "user_b",
        "password": "password123",
        "phone_number": "5555555555"
    })
    
    token_b = get_token("user_b", "password123")
    if not token_b: 
        print("Failed to get token for user_b")
        return
    headers_b = {"Authorization": f"Bearer {token_b}"}
    
    # 3. User A posts "Hello @user_b"
    print("\n[Action] User A posting mention of @user_b...")
    payload = {
        "content": "Hello @user_b, this is a test mention!",
        "privacy": "public" 
    }
    res = requests.post(f"{BASE_URL}/social/posts", json=payload, headers=headers_a)
    if res.status_code != 200:
        print("Failed to create post:", res.text)
        return
    post_id = res.json()["id"]
    print(f"✅ Post created (ID: {post_id})")
    
    # 4. Check User B's notifications
    print("\n[Action] Checking User B's notifications...")
    res = requests.get(f"{BASE_URL}/notifications/", headers=headers_b)
    if res.status_code == 200:
        notifs = res.json()
        found = False
        for n in notifs:
            if n["type"] == "mention" and n["reference_id"] == post_id:
                print(f"✅ Notification found! ID: {n['id']}, Source: {n['source_name']}")
                found = True
                break
        if not found:
            print("❌ Notification NOT found for mention.")
            print("All notifs:", notifs)
    else:
        print(f"❌ Failed to fetch notifications: {res.text}")

if __name__ == "__main__":
    try:
        test_mentions()
    except Exception as e:
        print(f"Error: {e}")
