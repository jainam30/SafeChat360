import asyncio
import websockets
import json
import requests
import sys

# 1. Login as jainam4 to get token
BASE_URL = "http://localhost:8000"

def login(username, password="password123"):
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={"identifier": username, "password": password})
    if resp.status_code != 200:
        print(f"Login failed for {username}: {resp.text}")
        sys.exit(1)
    return resp.json(), resp.json()["access_token"]

async def listen():
    user_data, token = login("jainam4") # ID: ?
    user_id = user_data["user"]["id"]
    print(f"Logged in as {user_data['user']['username']} (ID: {user_id}). Listening for notifications...")
    
    ws_url = f"ws://localhost:8000/api/chat/ws/{user_id}?token={token}"
    
    async with websockets.connect(ws_url) as websocket:
        print("WS Connected!")
        while True:
            msg = await websocket.recv()
            print(f"Received: {msg}")
            data = json.loads(msg)
            if data.get("type") == "notification":
                print(f"SUCCESS! Notification received: {data['event']} from {data.get('sender_username')}")
                break # Test passed

if __name__ == "__main__":
    try:
        asyncio.run(listen())
    except KeyboardInterrupt:
        pass
