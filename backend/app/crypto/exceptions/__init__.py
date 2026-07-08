class CryptoException(Exception):
    """Base exception for all cryptographic errors."""
    pass

class InvalidKeyException(CryptoException):
    pass

class DecryptionFailedException(CryptoException):
    pass

class SignatureVerificationException(CryptoException):
    pass

class UnsupportedAlgorithmException(CryptoException):
    pass
