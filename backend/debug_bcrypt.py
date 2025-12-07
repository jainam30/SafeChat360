from app.auth_utils import verify_password, get_password_hash

try:
    hashed = get_password_hash("TestPassword123!")
    print(f"Hash: {hashed}")
    print(f"Verify: {verify_password('TestPassword123!', hashed)}")
    print("Success")
except Exception as e:
    print(f"Error: {e}")
