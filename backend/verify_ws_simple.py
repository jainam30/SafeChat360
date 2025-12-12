import asyncio
import websockets
import sys

async def test_ws():
    uri = "ws://127.0.0.1:8000/api/chat/ws/1?token=test"
    print(f"Connecting to {uri}...")
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected successfully!")
            await websocket.close()
    except Exception as e:
        print(f"Connection failed: {e}")
        # It might fail auth (403) but that proves endpoint exists
        if "403" in str(e):
             print("Connected but rejected (Auth) -> Endpoint is UP!")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_ws())
