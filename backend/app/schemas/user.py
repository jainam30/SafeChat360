from pydantic import BaseModel, EmailStr
from typing import Optional

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    profile_photo: Optional[str] = None

class UpdateEmailRequest(BaseModel):
    new_email: EmailStr
    password: str

class UpdatePasswordRequest(BaseModel):
    old_password: str
    new_password: str
