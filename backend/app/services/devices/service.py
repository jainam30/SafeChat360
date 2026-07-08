from typing import List, Optional
from datetime import datetime
from sqlmodel import Session, select
import logging

from app.models import UserSession
from app.events.bus import EventBus
from app.audit.service import AuditService
from app.core.exceptions import APIException

logger = logging.getLogger(__name__)

class DeviceService:
    """
    Manages trusted devices wrapped around the UserSession table.
    """
    def __init__(self, db: Session, event_bus: EventBus, audit: AuditService):
        self.db = db
        self.event_bus = event_bus
        self.audit = audit

    def get_trusted_devices(self, user_id: int) -> List[UserSession]:
        return self.db.exec(
            select(UserSession).where(UserSession.user_id == user_id, UserSession.is_active == True)
        ).all()

    async def register_device(self, user_id: int, device_id: str, user_agent: str, ip_address: str) -> UserSession:
        """
        Creates or updates a device record upon login.
        """
        # Check if already exists
        device = self.db.exec(
            select(UserSession).where(UserSession.user_id == user_id, UserSession.device_id == device_id)
        ).first()

        if not device:
            device = UserSession(
                user_id=user_id,
                device_id=device_id,
                # In a real schema, we'd add user_agent, ip_address, etc.
                # For now, we reuse UserSession without breaking schema
                last_active=datetime.utcnow()
            )
            self.db.add(device)
            self.audit.log_action("DEVICE_REGISTERED", user_id, device_id, "SUCCESS")
        else:
            device.last_active = datetime.utcnow()
            device.is_active = True
            self.db.add(device)

        self.db.commit()
        self.db.refresh(device)
        
        from app.events.types import DeviceRegisteredEvent
        await self.event_bus.publish(DeviceRegisteredEvent(
            actor_id=user_id,
            payload={"device_id": device_id}
        ))
        
        return device

    async def revoke_device(self, user_id: int, device_id: str):
        device = self.db.exec(
            select(UserSession).where(UserSession.user_id == user_id, UserSession.device_id == device_id)
        ).first()

        if not device:
            raise APIException(status_code=404, detail="Device not found")

        device.is_active = False
        self.db.add(device)
        self.db.commit()

        self.audit.log_action("DEVICE_REVOKED", user_id, device_id, "SUCCESS")
        
        from app.events.types import DeviceRevokedEvent
        await self.event_bus.publish(DeviceRevokedEvent(
            actor_id=user_id,
            payload={"device_id": device_id}
        ))
