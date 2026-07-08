import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from .logger import logger
from .config import settings

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        start_time = time.time()
        
        # Log request start (optional, but good for debugging)
        client_ip = request.client.host if request.client else "Unknown"
        user_agent = request.headers.get("user-agent", "Unknown")
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        
        # Log completion
        logger.info(
            f"Request {request.method} {request.url.path} completed in {process_time:.4f}s",
            extra={
                "request_id": request_id,
                "execution_time": process_time,
                "client_ip": client_ip,
                "user_agent": user_agent,
                "method": request.method,
                "route": request.url.path,
                "status_code": response.status_code
            }
        )
        
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = str(process_time)
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Adjust CSP based on needs. Currently quite permissive for APIs.
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
        
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            
        return response
