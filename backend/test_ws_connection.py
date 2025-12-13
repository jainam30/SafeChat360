import asyncio
import websockets
import json

async def test_ws():
    uri = "ws://localhost:8000/api/chat/ws/1"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            
            # Send a test message
            msg = {
                "content": "Hello via WS",
                "sender_username": "tester",
                "receiver_id": 1, # Self
                "type": "message"
            }
            await websocket.send(json.dumps(msg))
            print("Sent message.")
            
            response = await websocket.recv()
            print(f"Received: {response}")
            
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_ws())
