from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlmodel import Session
from app.db import get_session
from app import crud
from app.auth_utils import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("email")
        if email is None:
            print("AUTH DEBUG: Email missing in token payload")
            raise credentials_exception
    except jwt.ExpiredSignatureError:
        print("AUTH DEBUG: Token Expired")
        raise credentials_exception
    except JWTError as e:
        print(f"AUTH DEBUG: JWT Error: {e}")
        raise credentials_exception
    
    user = crud.get_user_by_email(session, email=email)
    if user is None:
        print(f"AUTH DEBUG: User not found for email {email}")
        raise credentials_exception
    return user
