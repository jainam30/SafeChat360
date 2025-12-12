import requests
import asyncio
import websockets
import json
import sys

BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000"

async def test_chat_persistence():
    print("1. Registering/Logging in User A...")
    # Helper to clean up or ensure user exists
    import random
    suffix = random.randint(1000, 9999)
    user_a = {
        "email": f"testA{suffix}@example.com", 
        "password": "password123", 
        "username": f"testA{suffix}", 
        "full_name": "Test A",
        "phone_number": f"123456{suffix}"
    }
    
    # Try register
    print(f"Registering {user_a['username']}...")
    reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json=user_a)
    if reg_resp.status_code != 200:
        if "already registered" in reg_resp.text:
            print("User already likely exists, trying login...")
        else:
            print(f"Registration failed: {reg_resp.text}")
            
    # Login
    print(f"Logging in {user_a['username']}...")
    login_payload = {"identifier": user_a["username"], "password": user_a["password"]}
    resp = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
    if resp.status_code != 200:
        print(f"Failed to login User A: {resp.text}")
        return
    token_a = resp.json()["access_token"]
    
    # Get User A ID
    resp = requests.get(f"{BASE_URL}/api/users/me", headers={"Authorization": f"Bearer {token_a}"})
    user_a_id = resp.json()["id"]
    print(f"User A ID: {user_a_id}")

    print("2. Connecting User A to WebSocket...")
    ws_url = f"{WS_URL}/api/chat/ws/{user_a_id}?token={token_a}"
    
    try:
        async with websockets.connect(ws_url) as websocket:
            print("Connected.")
            
            # Message Content
            msg_content = f"Test Message Persistence {asyncio.get_event_loop().time()}"
            msg_data = {
                "sender_id": user_a_id,
                "sender_username": user_a["username"],
                "content": msg_content,
                "receiver_id": None, # Global chat for simplicity
                "group_id": None
            }
            
            print(f"3. Sending Message: {msg_content}")
            await websocket.send(json.dumps(msg_data))
            
            # Wait a bit for server to process and broadcast
            await asyncio.sleep(1)
            print("Message sent.")
            
    except Exception as e:
        print(f"WebSocket Error: {e}")
        return

    print("4. Verifying Persistence via API...")
    # Fetch history
    resp = requests.get(f"{BASE_URL}/api/chat/history", headers={"Authorization": f"Bearer {token_a}"})
    if resp.status_code != 200:
         print(f"Failed to fetch history: {resp.text}")
         return
         
    history = resp.json()
    found = False
    for msg in history:
        if msg["content"] == msg_content:
            found = True
            print("SUCCESS: Message found in history!")
            break
            
    if not found:
        print("FAILURE: Message NOT found in history.")
        print("Recent messages:", history[:3])

if __name__ == "__main__":
    try:
        asyncio.run(test_chat_persistence())
    except KeyboardInterrupt:
        pass
