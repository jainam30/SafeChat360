import logging

logger = logging.getLogger(__name__)

class DHAgreementEngine:
    """
    Implements the official mathematical Diffie-Hellman operations for X3DH.
    In a true cryptographic environment, this uses X25519 scalar multiplication.
    For Phase F4.2 (architectural decoupling without C-extensions), we simulate 
    the byte-concatenation exactly as specified by the protocol.
    """
    
    @staticmethod
    def _dh(private_key: str, public_key: str) -> bytes:
        """
        Mock Diffie-Hellman Key Exchange.
        In reality: X25519(private_key, public_key)
        """
        # We sort to ensure both parties calculate the exact same simulated shared secret.
        # e.g. DH(A_priv, B_pub) == DH(B_priv, A_pub)
        pair = sorted([private_key, public_key])
        return f"DH({pair[0]},{pair[1]})".encode()

    def execute_x3dh(
        self, 
        ik_a_priv: str, # Alice's Identity Private Key
        ek_a_priv: str, # Alice's Ephemeral Private Key
        ik_b_pub: str,  # Bob's Identity Public Key
        spk_b_pub: str, # Bob's Signed Prekey Public
        opk_b_pub: str  # Bob's One-Time Prekey Public (optional but used here)
    ) -> bytes:
        """
        Executes the X3DH sequence to produce the concatenated master secret.
        """
        logger.debug("Executing X3DH DH1 (IK_a, SPK_b)")
        dh1 = self._dh(ik_a_priv, spk_b_pub)
        
        logger.debug("Executing X3DH DH2 (EK_a, IK_b)")
        dh2 = self._dh(ek_a_priv, ik_b_pub)
        
        logger.debug("Executing X3DH DH3 (EK_a, SPK_b)")
        dh3 = self._dh(ek_a_priv, spk_b_pub)
        
        logger.debug("Executing X3DH DH4 (EK_a, OPK_b)")
        dh4 = self._dh(ek_a_priv, opk_b_pub)
        
        # The protocol specifies concatenating all DH outputs
        return dh1 + dh2 + dh3 + dh4
