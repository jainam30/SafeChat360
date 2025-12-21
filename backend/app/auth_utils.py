from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, Union, Any
from jose import jwt
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.environ.get("JWT_SECRET", "superstrongsecret_here_changeit")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRES_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRES_MINUTES", 30))

import hashlib

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # 1. Try checking as a Pre-Hashed SHA256 password (New Standard)
    # This prevents the 72-byte limit issue of bcrypt
    sha256_password = hashlib.sha256(plain_password.encode()).hexdigest()
    if pwd_context.verify(sha256_password, hashed_password):
        return True
        
    # 2. Fallback: Check as raw password (Legacy / Short passwords)
    # Only if the first check failed. This supports existing users.
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # If password is too long for raw bcrypt, verify() might throw. 
        # In that case, it wasn't a raw password anyway.
        return False

def get_secure_password_hash(password: str) -> str:
    # Always pre-hash with SHA256 to ensure length is 64 chars (Safe for bcrypt)
    try:
        sha256_password = hashlib.sha256(password.encode("utf-8")).hexdigest()
        # Ensure it's definitely short enough (hex digest is 64 chars, bcrypt limit is 72)
        # Just to be paranoid, slice it.
        final_input = sha256_password[:64]
        return pwd_context.hash(final_input)
    except Exception as e:
        # Fallback: if encoding fails, just hash the string directly but safely truncated
        print(f"Hashing Error: {e}")
        safe_pass = password[:71]
        return pwd_context.hash(safe_pass)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRES_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
