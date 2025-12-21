from passlib.context import CryptContext
import hashlib

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def test(password):
    print(f"Testing password: '{password}' (Len: {len(password)})")
    
    # 1. SHA256 Pre-hash (as done in app)
    sha256 = hashlib.sha256(password.encode("utf-8")).hexdigest()
    print(f"SHA256: {sha256} (Len: {len(sha256)})")
    
    try:
        h = pwd_context.hash(sha256)
        print(f"✅ Success. Hash: {h[:20]}...")
    except Exception as e:
        print(f"❌ Failed (SHA256): {e}")

    # 2. Raw
    try:
        h = pwd_context.hash(password)
        print(f"✅ Success (Raw). Hash: {h[:20]}...")
    except Exception as e:
        print(f"❌ Failed (Raw): {e}")

if __name__ == "__main__":
    test("fb_place")
    test("x" * 72)
    test("x" * 73)
