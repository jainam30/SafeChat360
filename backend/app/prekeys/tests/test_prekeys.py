import pytest
from app.prekeys.models import IdentityPublicKey, SignedPreKey, OneTimePreKey, PreKeyStatus
from app.prekeys.repository import PreKeyRepository
from app.prekeys.manager import PreKeyManager
from app.prekeys.service import PreKeyReservationService
from app.prekeys.metrics import PreKeyMetrics
from app.prekeys.api import PreKeyAPI
from datetime import datetime, timedelta

@pytest.fixture
def repo():
    return PreKeyRepository()

@pytest.fixture
def api(repo):
    manager = PreKeyManager(repo)
    service = PreKeyReservationService(repo)
    metrics = PreKeyMetrics()
    return PreKeyAPI(repo, manager, service, metrics)

def test_initial_bundle_upload_and_fetch(api):
    ik = IdentityPublicKey(key_id=1, device_id="dev_A", user_id="user_A", public_key_bytes=b'A'*32, fingerprint="f")
    spk = SignedPreKey(key_id=1, device_id="dev_A", user_id="user_A", public_key_bytes=b'B'*32, fingerprint="f", signature=b'sig', expiration_time=datetime.utcnow()+timedelta(days=30))
    opks = [OneTimePreKey(key_id=i, device_id="dev_A", user_id="user_A", public_key_bytes=b'C'*32, fingerprint="f") for i in range(50)]
    
    success = api.upload_initial_bundle("dev_A", ik, spk, opks)
    assert success is True
    
    # Check inventory
    status = api.check_inventory("dev_A")
    assert status["available_count"] == 50
    assert status["needs_replenishment"] is False
    
    # Fetch bundle
    bundle = api.fetch_prekey_bundle("dev_A")
    assert bundle is not None
    assert bundle.identity_key.key_id == 1
    assert bundle.signed_prekey.key_id == 1
    assert bundle.one_time_prekey.key_id == 0 # First OPK
    
    # Ensure OPK is reserved
    opk = api.repository.get_one_time_prekey("dev_A", 0)
    assert opk.status == PreKeyStatus.RESERVED
    
    # Fetch again, should get the NEXT OPK because the first is reserved
    bundle2 = api.fetch_prekey_bundle("dev_A")
    assert bundle2.one_time_prekey.key_id == 1
    
def test_replay_protection(api):
    ik = IdentityPublicKey(key_id=1, device_id="dev_A", user_id="user_A", public_key_bytes=b'A'*32, fingerprint="f")
    spk = SignedPreKey(key_id=1, device_id="dev_A", user_id="user_A", public_key_bytes=b'B'*32, fingerprint="f", signature=b'sig', expiration_time=datetime.utcnow()+timedelta(days=30))
    opks = [OneTimePreKey(key_id=i, device_id="dev_A", user_id="user_A", public_key_bytes=b'C'*32, fingerprint="f") for i in range(1)]
    
    api.upload_initial_bundle("dev_A", ik, spk, opks)
    
    bundle = api.fetch_prekey_bundle("dev_A")
    opk_id = bundle.one_time_prekey.key_id
    
    # Confirm consumption (simulate successful X3DH)
    success = api.confirm_session_established("dev_A", opk_id)
    assert success is True
    
    # Attempt to consume it AGAIN (Replay attack)
    replay_success = api.confirm_session_established("dev_A", opk_id)
    assert replay_success is False
    
    # Attempt to fetch another bundle, but pool is empty
    bundle3 = api.fetch_prekey_bundle("dev_A")
    assert bundle3.one_time_prekey is None # Returns bundle, but no OPK
    
def test_validation_rejection(api):
    # Invalid length (not 32 bytes)
    ik = IdentityPublicKey(key_id=1, device_id="dev_A", user_id="user_A", public_key_bytes=b'Short', fingerprint="f")
    spk = SignedPreKey(key_id=1, device_id="dev_A", user_id="user_A", public_key_bytes=b'B'*32, fingerprint="f", signature=b'sig', expiration_time=datetime.utcnow())
    opks = []
    
    success = api.upload_initial_bundle("dev_A", ik, spk, opks)
    assert success is False # Rejected by validator
