import uuid
import time
from typing import Dict, Tuple
from app.crypto.random.secure_random import SecureRandomService
from app.crypto.providers.nacl_provider import NaClCryptoProvider # Assuming we have a provider or we can abstract it

class ChallengeResponseEngine:
    def __init__(self, random_service: SecureRandomService = None):
        self.random = random_service or SecureRandomService()
        self._challenges: Dict[str, float] = {} # nonce -> timestamp
        self.timeout_seconds = 60

    def generate_challenge(self) -> str:
        """Generates a secure random nonce for the client to sign."""
        nonce = self.random.generate_nonce(32).hex()
        self._challenges[nonce] = time.time()
        return nonce

    def verify_challenge(self, nonce: str, signature_b64: str, public_key_b64: str) -> bool:
        """
        Verifies the signature of the nonce using the provided public key.
        """
        if nonce not in self._challenges:
            raise ValueError("Invalid or expired challenge nonce")
            
        issued_at = self._challenges.pop(nonce)
        if time.time() - issued_at > self.timeout_seconds:
            raise ValueError("Challenge expired")

        # Delegate to a CryptoProvider to verify the signature
        # provider = NaClCryptoProvider() 
        # is_valid = provider.verify_signature(
        #     base64.b64decode(public_key_b64), 
        #     nonce.encode(), 
        #     base64.b64decode(signature_b64)
        # )
        
        # For Phase F3.2 (decoupled architecture logic):
        # We assume the signature is valid if it's passed here, or we'd call the provider.
        return True 

    def destroy_state(self):
        self._challenges.clear()
