from .algorithms.registry import AlgorithmRegistry, KeyAgreementAlgorithm, SignatureAlgorithm

class CryptoPolicyService:
    """
    Enforces policies on cryptographic algorithms and key sizes.
    """
    def __init__(self):
        self.registry = AlgorithmRegistry()

    def get_approved_algorithms(self) -> AlgorithmRegistry:
        return self.registry

    def is_algorithm_approved(self, algo_name: str) -> bool:
        # Example validation
        valid = [
            e.value for e in KeyAgreementAlgorithm
        ] + [
            e.value for e in SignatureAlgorithm
        ]
        return algo_name in valid

    def enforce_minimum_key_size(self, size_bytes: int, algo: str) -> None:
        if algo == "AES" and size_bytes < 32:
            raise ValueError(f"Key size {size_bytes} is insufficient for {algo}. Minimum is 32.")
        if algo == "RSA" and size_bytes < 256: # 2048 bit
            raise ValueError(f"Key size {size_bytes} is insufficient for {algo}.")

    def check_deprecation(self, algo_name: str) -> bool:
        # E.g., SHA-1 would return True
        deprecated = ["SHA-1", "MD5", "DES"]
        return algo_name in deprecated
