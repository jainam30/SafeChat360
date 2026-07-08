import pytest
from app.crypto.x3dh.engine.x3dh_engine import X3DHEngine
from app.crypto.x3dh.engine.ephemeral import EphemeralKeyManager
from app.crypto.x3dh.agreements.dh_engine import DHAgreementEngine
from app.crypto.x3dh.derivation.hkdf import HKDFDerivationEngine
from app.crypto.x3dh.validators.bundle_validator import BundleValidator
from app.crypto.x3dh.models.bundle import PrekeyBundle

@pytest.fixture
def x3dh_env():
    validator = BundleValidator()
    dh_engine = DHAgreementEngine()
    hkdf_engine = HKDFDerivationEngine()
    engine = X3DHEngine(validator, dh_engine, hkdf_engine)
    return engine

def test_ephemeral_generation():
    priv, pub = EphemeralKeyManager.generate_keypair()
    assert "EK_PRIV_" in priv
    assert "EK_PUB_" in pub
    
    # Zeroization
    EphemeralKeyManager.zeroize(priv)
    # The reference is destroyed in the function scope in actual Python execution, 
    # but we can't test object GC easily here. Just verifying no exceptions.

def test_x3dh_successful_agreement(x3dh_env):
    engine = x3dh_env
    
    valid_bundle = PrekeyBundle(
        bundle_id="b-123",
        device_id="dev-bob",
        identity_public_key_b64="IK_bob_pub",
        signed_prekey_id=1,
        signed_prekey_public_b64="SPK_bob_pub",
        signed_prekey_signature_b64="valid_signature",
        one_time_prekey_id=1,
        one_time_prekey_public_b64="OPK_bob_pub",
        capabilities=["SUPPORTS_IDENTITY_KEYS"]
    )
    
    # Execute Agreement as Alice
    context = engine.execute_agreement(
        ik_a_priv="IK_alice_priv",
        target_bundle=valid_bundle
    )
    
    assert context is not None
    assert context.bootstrap_state == "COMPLETED"
    assert context.target_device_id == "dev-bob"
    assert len(context.extract_root_secret()) == 32 # HKDF Sha256 outputs 32 bytes

def test_x3dh_invalid_signature(x3dh_env):
    engine = x3dh_env
    
    invalid_bundle = PrekeyBundle(
        bundle_id="b-123",
        device_id="dev-bob",
        identity_public_key_b64="IK_bob_pub",
        signed_prekey_id=1,
        signed_prekey_public_b64="SPK_bob_pub",
        signed_prekey_signature_b64="invalid_sig", # explicitly set to fail
        one_time_prekey_id=1,
        one_time_prekey_public_b64="OPK_bob_pub",
        capabilities=[]
    )
    
    context = engine.execute_agreement(
        ik_a_priv="IK_alice_priv",
        target_bundle=invalid_bundle
    )
    
    assert context is None # Aborted
