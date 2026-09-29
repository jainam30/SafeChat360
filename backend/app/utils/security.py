from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, Union, Any
from jose import jwt
from app.core.config import settings

# Trigger Redeploy
# We now support argon2 (new default) and bcrypt (legacy)
pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRES_MINUTES = settings.ACCESS_TOKEN_EXPIRES_MINUTES

import hashlib

def verify_password(plain_password: str, hashed_password: str) -> tuple[bool, bool]:
    """
    Verifies password and returns (is_valid, needs_upgrade).
    If needs_upgrade is True, the caller should rehash and save.
    """
    sha256_password = hashlib.sha256(plain_password.encode()).hexdigest()
    
    is_valid = False
    
    try:
        if pwd_context.verify(sha256_password, hashed_password):
            is_valid = True
        else:
            if pwd_context.verify(plain_password, hashed_password):
                is_valid = True
    except Exception:
        is_valid = False

    needs_upgrade = False
    if is_valid and pwd_context.needs_update(hashed_password):
        needs_upgrade = True
        
    return is_valid, needs_upgrade

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
