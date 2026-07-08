from enum import Enum
from pydantic import BaseModel

class KeyAgreementAlgorithm(str, Enum):
    X25519 = "X25519"
    P256 = "P-256"

class SignatureAlgorithm(str, Enum):
    ED25519 = "Ed25519"
    ECDSA_P256 = "ECDSA-P256"

class AuthenticatedEncryptionAlgorithm(str, Enum):
    AES_256_GCM = "AES-256-GCM"
    CHACHA20_POLY1305 = "ChaCha20-Poly1305"

class HashAlgorithm(str, Enum):
    SHA256 = "SHA-256"
    SHA512 = "SHA-512"

class KDFAlgorithm(str, Enum):
    HKDF_SHA256 = "HKDF-SHA-256"

class AlgorithmRegistry(BaseModel):
    """
    Describes the supported cryptographic algorithms for the application.
    """
    key_agreement: KeyAgreementAlgorithm = KeyAgreementAlgorithm.X25519
    signature: SignatureAlgorithm = SignatureAlgorithm.ED25519
    aead: AuthenticatedEncryptionAlgorithm = AuthenticatedEncryptionAlgorithm.AES_256_GCM
    hash_algo: HashAlgorithm = HashAlgorithm.SHA256
    kdf: KDFAlgorithm = KDFAlgorithm.HKDF_SHA256
