from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import logging
from jose import jwt, JWTError

from app.core.config import settings
from app.events.bus import EventBus
from app.audit.service import AuditService
from app.cache.service import CacheService
from app.core.exceptions import APIException
from app.services.devices.service import DeviceService

logger = logging.getLogger(__name__)

class SessionService:
    """
    Manages JWT lifecycle, refresh token rotation, and session security.
    """
    def __init__(self, cache: CacheService, event_bus: EventBus, audit: AuditService, device_service: DeviceService):
        self.cache = cache
        self.event_bus = event_bus
        self.audit = audit
        self.device_service = device_service

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRES_MINUTES)
        
        to_encode.update({"exp": expire, "iss": "safechat360", "aud": "safechat360-clients"})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    async def create_session(self, user_id: int, device_id: str, user_agent: str, ip: str) -> Dict[str, str]:
        # 1. Register/Update Device
        await self.device_service.register_device(user_id, device_id, user_agent, ip)
        
        # 2. Issue Access Token
        access_token = self.create_access_token(
            data={"sub": str(user_id), "device_id": device_id}
        )
        
        # 3. Issue Refresh Token (Opaque Hash)
        # We don't store plain tokens in DB, we use cache/hash
        refresh_token = f"rt_{user_id}_{device_id}_{datetime.utcnow().timestamp()}"
        
        # Store in cache (simulate saving hash)
        self.cache.set(f"refresh:{device_id}", refresh_token, ttl=86400 * 7) # 7 days
        
        self.audit.log_action("SESSION_CREATED", user_id, device_id, "SUCCESS")
        
        from app.events.types import SessionCreatedEvent
        await self.event_bus.publish(SessionCreatedEvent(
            actor_id=user_id,
            payload={"device_id": device_id}
        ))
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "refresh_token": refresh_token
        }

    async def refresh_session(self, user_id: int, device_id: str, old_refresh_token: str) -> Dict[str, str]:
        """
        Implements Refresh Token Rotation and replay protection.
        """
        stored_token = self.cache.get(f"refresh:{device_id}")
        
        if not stored_token or stored_token != old_refresh_token:
            # Replay detection / compromised token
            self.audit.log_action("SESSION_REFRESH_FAILED", user_id, device_id, "FAILURE", details={"reason": "Invalid or reused refresh token"})
            # Revoke all sessions for this device just to be safe
            await self.revoke_session(user_id, device_id)
            raise APIException(status_code=401, detail="Invalid refresh token. Please login again.")
            
        # Issue new pair
        self.audit.log_action("SESSION_REFRESHED", user_id, device_id, "SUCCESS")
        
        from app.events.types import RefreshRotatedEvent
        await self.event_bus.publish(RefreshRotatedEvent(
            actor_id=user_id,
            payload={"device_id": device_id}
        ))
        
        # Mocking user agent / IP as empty for refresh flow
        return await self.create_session(user_id, device_id, "", "")

    async def revoke_session(self, user_id: int, device_id: str):
        """
        Logs a user out of a specific device.
        """
        self.cache.delete(f"refresh:{device_id}")
        await self.device_service.revoke_device(user_id, device_id)
        
        self.audit.log_action("SESSION_REVOKED", user_id, device_id, "SUCCESS")
        
        from app.events.types import SessionRevokedEvent
        await self.event_bus.publish(SessionRevokedEvent(
            actor_id=user_id,
            payload={"device_id": device_id}
        ))
