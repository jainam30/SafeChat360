from app.repositories.user import UserRepository
from app.utils.security import get_secure_password_hash, verify_password
from app.utils.firebase import init_firebase
from firebase_admin import auth as firebase_auth
import hashlib
from app.schemas.auth import RegisterRequest, LoginRequest, VerifyRequest
from app.core.exceptions import APIException
import logging
from app.services.session.service import SessionService

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, user_repo: UserRepository, session_service: SessionService):
        self.user_repo = user_repo
        self.session_service = session_service

    async def register(self, req: RegisterRequest) -> dict:
        init_firebase()
        
        import firebase_admin
        if not firebase_admin._apps:
            raise APIException(status_code=500, detail="Backend configuration error: Firebase Admin is not initialized. Please check FIREBASE_SERVICE_ACCOUNT_JSON environment variable on the server.")

        try:
            decoded_token = firebase_auth.verify_id_token(req.firebase_token)
            firebase_email = decoded_token.get('email')
            if not firebase_email or firebase_email != req.email:
                raise APIException(status_code=400, detail="Firebase email verification failed or mismatch")
        except APIException:
            raise
        except Exception as e:
             raise APIException(status_code=400, detail=f"Invalid Firebase Token: {str(e)}")

        if self.user_repo.get_by_email(req.email):
            raise APIException(status_code=400, detail="Email already registered")
        if self.user_repo.get_by_username(req.username):
            raise APIException(status_code=400, detail="Username already taken")
        if self.user_repo.get_by_phone(req.phone_number):
            raise APIException(status_code=400, detail="Phone number already registered")

        pwd_for_hash = req.password
        if len(req.password) > 70:
            pwd_for_hash = hashlib.sha256(req.password.encode('utf-8')).hexdigest()
        
        hashed = get_secure_password_hash(pwd_for_hash)
        
        user_data = {
            "email": req.email,
            "username": req.username,
            "phone_number": req.phone_number,
            "hashed_password": hashed,
            "full_name": req.full_name,
            "role": req.role or "user"
        }
        user = self.user_repo.create(obj_in=user_data)
        
        # Abstract session creation
        tokens = await self.session_service.create_session(
            user_id=user.id,
            device_id="unknown_device_register",
            user_agent="Register",
            ip="127.0.0.1"
        )
        
        return {
            "status": "success", 
            "data": {
                "id": user.id, 
                "email": user.email, 
                "role": user.role,
                "access_token": tokens["access_token"]
            }
        }

    async def login(self, req: LoginRequest) -> dict:
        user = self.user_repo.get_by_email(req.identifier)
        if not user:
            user = self.user_repo.get_by_username(req.identifier)
            
        if not user:
            raise APIException(status_code=401, detail="Invalid credentials")
            
        is_valid, needs_upgrade = verify_password(req.password, user.hashed_password)
        if not is_valid:
            raise APIException(status_code=401, detail="Invalid credentials")
            
        if needs_upgrade:
            logger.info(f"Upgrading password hash for user {user.id}")
            pwd_for_hash = req.password
            if len(req.password) > 70:
                pwd_for_hash = hashlib.sha256(req.password.encode('utf-8')).hexdigest()
            user.hashed_password = get_secure_password_hash(pwd_for_hash)
            self.user_repo.session.add(user)
            self.user_repo.session.commit()
        
        active_count = self.user_repo.get_active_sessions_count(user.id)
        if active_count >= 5: # Increased limit since we now have robust token revocation
            raise APIException(status_code=403, detail="DEVICE_LIMIT_EXCEEDED")

        tokens = await self.session_service.create_session(
            user_id=user.id,
            device_id=req.device_id,
            user_agent="Login",
            ip="127.0.0.1"
        )

        return tokens

    async def verify_identity(self, req: VerifyRequest) -> dict:
        init_firebase()
        
        try:
            decoded_token = firebase_auth.verify_id_token(req.firebase_token, clock_skew_seconds=60)
        except Exception as e:
            raise APIException(status_code=401, detail=f"Identity verification failed: {str(e)}")
            
        email = decoded_token.get('email')
        
        user = self.user_repo.get_by_email(email)
        
        if not user:
             logger.info(f"JIT Provisioning: Creating user for {email}")
             username = email.split('@')[0]
             
             if self.user_repo.get_by_username(username):
                 import random
                 username = f"{username}{random.randint(100, 999)}"
                 
             try:
                hashed = get_secure_password_hash("fb_place")
             except Exception as e:
                logger.error(f"JIT Hash Failed: {e}. Using fallback.")
                hashed = "$2b$12$imMeVPcMyn9md.m/..//dummyhashfallbackignoredanyway"
             
             user_data = {
                 "email": email,
                 "username": username,
                 "phone_number": "",
                 "hashed_password": hashed,
                 "full_name": decoded_token.get('name', username),
                 "role": "user"
             }
             user = self.user_repo.create(obj_in=user_data)

        # Let SessionService handle device tracking 
        # (Though we might want to revoke old sessions if we enforce 1 device)
        tokens = await self.session_service.create_session(
            user_id=user.id,
            device_id=req.device_id,
            user_agent="VerifyIdentity",
            ip="127.0.0.1"
        )
        return tokens
