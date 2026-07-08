class PreKeyPolicies:
    """
    Configuration policies for Pre-Key lifecycle management.
    """
    
    # Maximum number of One-Time Pre-Keys a device can upload at once
    MAX_BATCH_UPLOAD_SIZE = 100
    
    # Target pool size per device
    TARGET_POOL_SIZE = 100
    
    # Low-watermark threshold. If available keys drop below this, trigger a replenishment event.
    LOW_WATERMARK_THRESHOLD = 20
    
    # How long a reserved key stays in the RESERVED state before timing out and returning to ACTIVE
    RESERVATION_TIMEOUT_MINUTES = 5
    
    # How long a Signed Pre-Key is considered valid before it should be rotated
    SPK_ROTATION_DAYS = 30
    
    # Grace period to keep an old SPK available for delayed messages
    SPK_GRACE_PERIOD_DAYS = 14
