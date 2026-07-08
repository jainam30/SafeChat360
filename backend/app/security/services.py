from typing import Optional, Dict
from fastapi import Request, Response
import logging

logger = logging.getLogger(__name__)

class SecurityHeadersService:
    def apply_headers(self, response: Response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"

class IPService:
    def get_client_ip(self, request: Request) -> Optional[str]:
        # Respect proxies (e.g., Render/Vercel)
        x_forwarded_for = request.headers.get("x-forwarded-for")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.client.host if request.client else None

class DeviceService:
    def get_device_info(self, request: Request) -> Dict[str, str]:
        user_agent = request.headers.get("user-agent", "Unknown")
        # In a real app, parse this with user_agents library
        return {
            "user_agent": user_agent,
            "platform": "Unknown",
            "browser": "Unknown"
        }

class RateLimitService:
    # Abstraction layer over slowapi/redis
    def is_rate_limited(self, key: str, max_requests: int, window_seconds: int) -> bool:
        # Placeholder
        return False

class TokenBlacklistService:
    def __init__(self, cache_service):
        self.cache = cache_service

    def blacklist_token(self, token: str, expires_in: int):
        self.cache.set(f"blacklist:{token}", True, ttl=expires_in)
        logger.info(f"Token blacklisted: {token[-6:]}")

    def is_blacklisted(self, token: str) -> bool:
        return self.cache.exists(f"blacklist:{token}")

class ThreatDetectionService:
    def analyze_login_attempt(self, ip: str, user_id: int) -> bool:
        # Placeholder for AI/rule-based threat detection (e.g., unusual IP)
        return False
