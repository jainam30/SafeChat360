from app.repositories.user import UserRepository
from app.schemas.user import UpdateProfileRequest, UpdateEmailRequest, UpdatePasswordRequest
from app.models import User
from app.core.exceptions import APIException
from app.utils.security import verify_password, get_secure_password_hash

class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def get_me(self, current_user: User) -> dict:
        return {
            "id": current_user.id,
            "email": current_user.email,
            "username": current_user.username,
            "full_name": current_user.full_name,
            "phone_number": current_user.phone_number,
            "profile_photo": current_user.profile_photo,
            "trust_score": current_user.trust_score,
            "role": current_user.role,
            "created_at": current_user.created_at
        }

    def update_profile(self, req: UpdateProfileRequest, current_user: User) -> dict:
        updates = {}
        if req.full_name is not None:
            updates["full_name"] = req.full_name
        if req.profile_photo is not None:
            updates["profile_photo"] = req.profile_photo
        if req.username is not None and req.username != current_user.username:
            if self.user_repo.get_by_username(req.username):
                raise APIException(status_code=400, detail="Username already taken")
            updates["username"] = req.username
        
        updated_user = self.user_repo.update(db_obj=current_user, obj_in=updates)
        return {
            "status": "success",
            "data": {
                "username": updated_user.username,
                "full_name": updated_user.full_name,
                "profile_photo": updated_user.profile_photo
            }
        }

    def update_email(self, req: UpdateEmailRequest, current_user: User) -> dict:
        if not verify_password(req.password, current_user.hashed_password):
            raise APIException(status_code=401, detail="Invalid password")
        
        if req.new_email == current_user.email:
            return {"status": "success", "message": "Email unchanged"}
            
        if self.user_repo.get_by_email(req.new_email):
            raise APIException(status_code=400, detail="Email already registered")
        
        updated_user = self.user_repo.update(db_obj=current_user, obj_in={"email": req.new_email})
        return {"status": "success", "data": {"email": updated_user.email}}

    def update_password(self, req: UpdatePasswordRequest, current_user: User) -> dict:
        user_in_session = self.user_repo.get(current_user.id)
        if not user_in_session:
            raise APIException(status_code=404, detail="User not found")

        if not verify_password(req.old_password, user_in_session.hashed_password):
            raise APIException(status_code=401, detail="Invalid old password")
        
        new_hashed = get_secure_password_hash(req.new_password)
        self.user_repo.update(db_obj=user_in_session, obj_in={"hashed_password": new_hashed})
        return {"status": "success", "message": "Password updated successfully"}

    def get_user_public_profile(self, user_id: int, current_user: User) -> dict:
        user = self.user_repo.get(user_id)
        if not user:
            raise APIException(status_code=404, detail="User not found")
            
        return {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "profile_photo": user.profile_photo,
            "trust_score": user.trust_score,
            "role": user.role,
            "created_at": user.created_at,
            "is_self": user.id == current_user.id
        }
