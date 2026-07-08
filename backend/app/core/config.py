# Forwarding to the new modular config to maintain backward compatibility
from app.config import settings

# Export settings so existing imports like `from app.core.config import settings` work perfectly.
__all__ = ["settings"]
