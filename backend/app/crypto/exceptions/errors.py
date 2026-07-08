class CryptoError(Exception):
    """Base exception for all cryptographic errors."""
    pass

class UnsupportedAlgorithmError(CryptoError):
    """Raised when an algorithm is not supported by the provider or policy."""
    pass

class KeySizeError(CryptoError):
    """Raised when a key size does not meet minimum policy requirements."""
    pass

class InvalidSignatureError(CryptoError):
    """Raised when signature verification fails."""
    pass

class InvalidKeyError(CryptoError):
    """Raised when a key is malformed or invalid."""
    pass

class SerializationError(CryptoError):
    """Raised when serialization or deserialization fails."""
    pass
