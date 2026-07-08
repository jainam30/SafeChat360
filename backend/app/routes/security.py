from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
import logging

from app.deps import get_current_user, get_session
from app.models import User
from app.services.devices.service import DeviceService
from app.services.session.service import SessionService

# Assuming we can inject these later via deps.py
# For now we'll do simple mock instantiation or add to deps.py in Step 13.
from app.deps import get_device_service, get_session_service

router = APIRouter(prefix="/api/security", tags=["security"])
logger = logging.getLogger(__name__)

@router.get("/devices")
async def get_trusted_devices(
    current_user: User = Depends(get_current_user),
    device_service: DeviceService = Depends(get_device_service)
):
    """
    Returns a list of trusted devices for the user.
    """
    devices = device_service.get_trusted_devices(current_user.id)
    return [{
        "device_id": d.device_id,
        "last_active": d.last_active.isoformat(),
        "created_at": d.created_at.isoformat(),
        "is_active": d.is_active
    } for d in devices]

@router.post("/devices/{device_id}/revoke")
async def revoke_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
    session_service: SessionService = Depends(get_session_service)
):
    """
    Revokes trust for a device, forcing it to log out.
    """
    try:
        await session_service.revoke_session(current_user.id, device_id)
        return {"status": "success", "message": f"Device {device_id} revoked successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
