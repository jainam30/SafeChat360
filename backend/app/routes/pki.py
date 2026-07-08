from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional

from app.deps import get_current_user, get_session, get_metrics_service, get_audit_service
from app.services.identity.service import IdentityService
from app.deps import get_identity_service, get_device_service
from app.services.devices.service import DeviceService
from app.models import User

router = APIRouter(prefix="/api/pki", tags=["pki"])

class IdentityKeyUpload(BaseModel):
    device_id: str
    identity_key_b64: str
    signed_prekey_b64: str
    signature_b64: str

class OneTimePreKeyUpload(BaseModel):
    device_id: str
    keys: List[dict] # { keyId: str, publicBytesB64: str }

@router.post("/keys/identity", status_code=status.HTTP_201_CREATED)
async def register_identity_key(
    payload: IdentityKeyUpload,
    current_user: User = Depends(get_current_user),
    device_service: DeviceService = Depends(get_device_service),
    identity_service: IdentityService = Depends(get_identity_service),
    metrics = Depends(get_metrics_service),
    audit = Depends(get_audit_service)
):
    """
    Step 5: Register a device's Identity Key.
    The backend MUST only store public keys.
    """
    # Enforce Trusted Device policy (Step 11)
    if not device_service.is_device_trusted(current_user.id, payload.device_id):
        raise HTTPException(status_code=403, detail="Untrusted device")
        
    # In a real database, we would store this in a PKI KeyStore table.
    # For now, we mock the metadata mapping via IdentityService.
    identity_service._identity_metadata[current_user.id] = {
        "has_public_key": True,
        "primary_key_id": "pk_mock",
        "identity_key_b64": payload.identity_key_b64,
        "signed_prekey_b64": payload.signed_prekey_b64
    }
    
    metrics.increment("pki_identity_key_uploads")
    audit.log_action("PKI_KEY_REGISTERED", current_user.id, f"Device:{payload.device_id}", "SUCCESS")
    
    return {"status": "success"}

@router.post("/keys/prekeys", status_code=status.HTTP_201_CREATED)
async def upload_onetime_prekeys(
    payload: OneTimePreKeyUpload,
    current_user: User = Depends(get_current_user),
    device_service: DeviceService = Depends(get_device_service),
    metrics = Depends(get_metrics_service)
):
    """
    Step 7: One-Time Pre-Key Pool replenishment.
    """
    if not device_service.is_device_trusted(current_user.id, payload.device_id):
        raise HTTPException(status_code=403, detail="Untrusted device")
        
    metrics.increment("pki_onetime_prekeys_uploaded", len(payload.keys))
    
    # Store in KeyStore (mocked)
    return {"status": "success", "count": len(payload.keys)}

@router.get("/keys/device/{device_id}")
async def get_device_keys(
    device_id: str,
    target_user_id: int,
    current_user: User = Depends(get_current_user),
    identity_service: IdentityService = Depends(get_identity_service)
):
    """
    Fetch public keys for a specific device. 
    Returns IdentityKey, SignedPreKey, and pops ONE OneTimePreKey.
    """
    meta = identity_service.get_identity(target_user_id)
    if not meta.get("has_public_key"):
        raise HTTPException(status_code=404, detail="User has no registered keys")
        
    return {
        "identity_key_b64": meta.get("identity_key_b64"),
        "signed_prekey_b64": meta.get("signed_prekey_b64"),
        "onetime_prekey_b64": "mock_onetime_prekey" # Pop one from inventory
    }
