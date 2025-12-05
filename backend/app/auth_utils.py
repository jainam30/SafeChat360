import os
import hashlib
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt

JWT_SECRET = os.getenv("JWT_SECRET", "unsafe_dev_secret_change_me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRES_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRES_MINUTES", "60"))

# Use simple PBKDF2 hashing for local development (no external dependencies)
def get_password_hash(password: str) -> str:
    pwd_str = str(password).strip()
    # Simple SHA256 hashing (not production-ready, but good for dev)
    return hashlib.pbkdf2_hmac('sha256', pwd_str.encode(), b'salt_dev', 100000).hex()

def verify_password(plain: str, hashed: str) -> bool:
    try:
        plain_str = str(plain).strip()
        computed = hashlib.pbkdf2_hmac('sha256', plain_str.encode(), b'salt_dev', 100000).hex()
        return computed == hashed
    except Exception as e:
        print(f"DEBUG: Verify error: {e}")
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRES_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None
