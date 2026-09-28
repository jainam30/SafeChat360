import logging
from cryptography.hazmat.primitives.asymmetric import x25519, ed25519
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes

logger = logging.getLogger(__name__)

class OpaqueSessionMaterial:
    """Wrapper to prevent raw secret exposure to higher layers."""
    def __init__(self, raw_secret: bytes):
        self._raw_secret = raw_secret

    def get_ref(self) -> str:
        # In a real HSM/KMS, this would return a key handle.
        # Here we mock it by hashing it so it's opaque to logs.
        digest = hashes.Hash(hashes.SHA256())
        digest.update(self._raw_secret)
        return digest.finalize().hex()[:16]

class SessionCryptoProvider:
    """
    Wraps Phase F1 cryptographic core specifically for session derivation.
    Server remains Zero-Knowledge: It cannot derive this since it lacks private keys.
    This class models the operations that occur on the client, OR on a trusted KMS if the server is performing derivation for a web client (not recommended for true E2EE).
    For our Phase F3.3 goals, this demonstrates the derivation logic but we don't actually hold the client's private keys.
    We will mock the derivation assuming valid inputs, as the true derivation happens on the endpoints.
    """
    def perform_key_agreement(self, our_private_bytes: bytes, their_public_bytes: bytes) -> bytes:
        # In reality, server does not do this for E2EE. This is provided for test/mocking or if server acts as endpoint.
        priv = x25519.X25519PrivateKey.from_private_bytes(our_private_bytes)
        pub = x25519.X25519PublicKey.from_public_bytes(their_public_bytes)
        return priv.exchange(pub)

    def derive_session_material(self, shared_secret: bytes, salt: bytes = None) -> OpaqueSessionMaterial:
        # HKDF-SHA256
        if salt None:
            salt = b"\x00" * 32
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            info=b"SafeChat360_v4_SSSP"
        )
        derived = hkdf.derive(shared_secret)
        return OpaqueSessionMaterial(derived)
