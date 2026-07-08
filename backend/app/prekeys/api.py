import logging
from typing import List, Dict, Any, Optional
from app.prekeys.repository import PreKeyRepository
from app.prekeys.manager import PreKeyManager
from app.prekeys.service import PreKeyReservationService, PreKeyBundle
from app.prekeys.models import IdentityPublicKey, SignedPreKey, OneTimePreKey
from app.prekeys.validation import PreKeyValidator
from app.prekeys.metrics import PreKeyMetrics
from app.prekeys.policies import PreKeyPolicies

logger = logging.getLogger(__name__)

class PreKeyAPI:
    """
    Mock FastAPI router class. 
    Defines the endpoints that the frontend will call to upload and fetch keys.
    """
    
    def __init__(self, repository: PreKeyRepository, manager: PreKeyManager, service: PreKeyReservationService, metrics: PreKeyMetrics):
        self.repository = repository
        self.manager = manager
        self.service = service
        self.metrics = metrics
        
    def upload_initial_bundle(self, device_id: str, identity_key: IdentityPublicKey, signed_prekey: SignedPreKey, one_time_prekeys: List[OneTimePreKey]) -> bool:
        """
        Called when a device registers for the first time.
        """
        if not PreKeyValidator.validate_key_format(identity_key) or not PreKeyValidator.validate_key_format(signed_prekey) or not PreKeyValidator.validate_batch(one_time_prekeys):
            return False
            
        self.repository.store_identity_key(identity_key)
        self.repository.store_signed_prekey(signed_prekey)
        self.manager.handle_batch_upload(device_id, one_time_prekeys)
        
        self.metrics.record_available(len(one_time_prekeys))
        return True
        
    def fetch_prekey_bundle(self, target_device_id: str) -> Optional[PreKeyBundle]:
        """
        Called by a sender who wants to establish a session with target_device_id.
        Reserves a one-time pre-key.
        """
        bundle = self.service.reserve_bundle(target_device_id)
        if not bundle:
            self.metrics.record_reservation_failure()
            return None
            
        return bundle
        
    def confirm_session_established(self, target_device_id: str, opk_id: int) -> bool:
        """
        Called by the sender after successfully verifying the X3DH agreement, 
        to permanently mark the OPK as consumed.
        """
        success = self.service.confirm_consumption(target_device_id, opk_id)
        if success:
            self.metrics.record_consumed()
        else:
            self.metrics.record_replay_attempt()
        return success
        
    def check_inventory(self, device_id: str) -> Dict[str, Any]:
        """
        Called periodically by a device to see if it needs to generate and upload more OPKs.
        """
        return self.manager.check_pool_status(device_id)
