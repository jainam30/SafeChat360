import pytest
from app.crypto.random.secure_random import SecureRandomService
from app.crypto.serialization.serializers import CryptoSerializer
from app.crypto.policy import CryptoPolicyService
from app.crypto.algorithms.registry import AlgorithmRegistry

def test_secure_random_bytes():
    b1 = SecureRandomService.random_bytes(16)
    b2 = SecureRandomService.random_bytes(16)
    assert len(b1) == 16
    assert b1 != b2

def test_secure_random_identifier():
    id1 = SecureRandomService.random_identifier()
    assert isinstance(id1, str)
    assert len(id1) > 0

def test_crypto_serialization():
    original_key = b"dummy_public_key_bytes_12345"
    encoded = CryptoSerializer.serialize_public_key(original_key)
    
    # Needs to be string
    assert isinstance(encoded, str)
    
    decoded = CryptoSerializer.deserialize_public_key(encoded)
    assert decoded == original_key

def test_crypto_serialization_unsupported_version():
    import base64
    # Version 2 (unsupported)
    bad_payload = b'\x02' + b"dummy_public_key_bytes"
    encoded = base64.b64encode(bad_payload).decode('utf-8')
    with pytest.raises(ValueError):
        CryptoSerializer.deserialize_public_key(encoded)

def test_policy_approved_algorithms():
    policy = CryptoPolicyService()
    assert policy.is_algorithm_approved("X25519") is True
    assert policy.is_algorithm_approved("InvalidAlgo") is False

def test_policy_deprecation():
    policy = CryptoPolicyService()
    assert policy.check_deprecation("SHA-1") is True
    assert policy.check_deprecation("SHA-256") is False

def test_registry_defaults():
    registry = AlgorithmRegistry()
    assert registry.key_agreement.value == "X25519"
    assert registry.signature.value == "Ed25519"
    assert registry.aead.value == "AES-256-GCM"
