import requests

def test_assist():
    try:
        # We need a token, but the endpoint requires auth.
        # Assuming we can just test the python function directly or bypass auth for a quick local test
        # Actually proper way: login via script or just test the service function directly to verify model load.
        
        # Method 1: Test service function directly (easiest for backend logic check)
        from app.services.ai_assistant import improve_text
        print("Testing AI Service...")
        text = "hey how are u doing"
        res = improve_text(text)
        print(f"Original: {text}")
        print(f"Improved: {res}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_assist()
