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

def get_password_hash(password: str) -> str:
    # Always pre-hash with SHA256 to ensure length is 64 chars (Safe for bcrypt)
    sha256_password = hashlib.sha256(password.encode()).hexdigest()
    print(f"DEBUG: Pre-hashing password via SHA256. Len: {len(sha256_password)}")
    return pwd_context.hash(sha256_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRES_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
