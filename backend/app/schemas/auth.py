from pydantic import BaseModel, EmailStr
from typing import Optional

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    phone_number: str
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = "user"
    firebase_token: str

class LoginRequest(BaseModel):
    identifier: str
    password: str
    device_id: str = "unknown_device"

class VerifyRequest(BaseModel):
    firebase_token: str
    device_id: str = "unknown_device"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
