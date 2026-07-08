import base64

class CryptoSerializer:
    """
    Handles serialization of cryptographic primitives.
    Always uses versioned formats to support future upgrades.
    """
    VERSION_1 = b'\x01'

    @staticmethod
    def serialize_public_key(public_bytes: bytes) -> str:
        """Versioned serialization of a public key."""
        payload = CryptoSerializer.VERSION_1 + public_bytes
        return base64.b64encode(payload).decode('utf-8')

    @staticmethod
    def deserialize_public_key(encoded: str) -> bytes:
        payload = base64.b64decode(encoded.encode('utf-8'))
        version = payload[0:1]
        if version != CryptoSerializer.VERSION_1:
            raise ValueError(f"Unsupported key version: {version}")
        return payload[1:]

    @staticmethod
    def serialize_signature(signature_bytes: bytes) -> str:
        return base64.b64encode(signature_bytes).decode('utf-8')

    @staticmethod
    def serialize_cipher_metadata(nonce: bytes, tag: bytes) -> dict:
        return {
            "v": 1,
            "n": base64.b64encode(nonce).decode('utf-8'),
            "t": base64.b64encode(tag).decode('utf-8')
        }
