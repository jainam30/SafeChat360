import re
from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from .logger import logger
from app.core.config import settings

_ALLOWED_ORIGIN_REGEX = re.compile(r"^https://(safe-chat360|safechat360)(-[a-zA-Z0-9_-]+)?\.vercel\.app$")

def _get_cors_headers(request: Request) -> dict:
    origin = request.headers.get("origin")
    if not origin:
        return {}
    allowed = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
    if origin in allowed or _ALLOWED_ORIGIN_REGEX.match(origin):
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true"
        }
    return {}

class APIException(Exception):
    def __init__(self, message: str = None, status_code: int = status.HTTP_400_BAD_REQUEST, errors: list = None, detail: str = None):
        # Support both `APIException("msg", 404)` and `APIException(detail="msg", status_code=404)`
        # call styles, which are both used across the codebase.
        self.message = message or detail or "Request failed"
        self.detail = self.message
        self.status_code = status_code
        self.errors = errors or []

async def custom_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
    headers = _get_cors_headers(request)
        
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Internal Server Error",
            "detail": "Internal Server Error",
            "data": {},
            "meta": {},
            "errors": []
        },
        headers=headers
    )

async def api_exception_handler(request: Request, exc: APIException):
    headers = _get_cors_headers(request)

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "detail": exc.message,
            "data": {},
            "meta": {},
            "errors": exc.errors
        },
        headers=headers
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Ensure FastAPI query/body validation errors return HTTP 422, not 500."""
    headers = _get_cors_headers(request)
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " -> ".join(str(loc) for loc in error.get("loc", [])),
            "message": error.get("msg", "Validation error"),
            "type": error.get("type", "value_error")
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Validation error",
            "detail": "One or more request parameters are invalid.",
            "data": {},
            "meta": {},
            "errors": errors
        },
        headers=headers
    )
