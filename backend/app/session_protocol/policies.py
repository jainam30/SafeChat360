SUPPORTED_VERSIONS = ["3.0"]

class SessionPolicies:
    @staticmethod
    def is_version_supported(version: str) -> bool:
        return version in SUPPORTED_VERSIONS

    @staticmethod
    def validate_downgrade(requested_version: str, current_version: str) -> bool:
        """Reject downgrade attacks."""
        if requested_version != current_version:
            # Example logic. Currently only 3.0 supported.
            return False
        return True
