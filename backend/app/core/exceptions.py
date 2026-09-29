from fastapi import Request, status
from fastapi.responses import JSONResponse
from .logger import logger

class APIException(Exception):
    def __init__(self, message: str = None, status_code: int = status.HTTP_400_BAD_REQUEST, errors: list = None, detail: str = None):
        # Support both `APIException("msg", 404)` and `APIException(detail="msg", status_code=404)`
        # call styles, which are both used across the codebase.
        self.message = message or detail or "Request failed"
        self.status_code = status_code
        self.errors = errors or []

async def custom_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
    headers = {"Access-Control-Allow-Origin": request.headers.get("origin") or "*", "Access-Control-Allow-Credentials": "true"}
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Internal Server Error",
            "data": {},
            "meta": {},
            "errors": []
        },
        headers=headers
    )

async def api_exception_handler(request: Request, exc: APIException):
    headers = {"Access-Control-Allow-Origin": request.headers.get("origin") or "*", "Access-Control-Allow-Credentials": "true"}
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "data": {},
            "meta": {},
            "errors": exc.errors
        },
        headers=headers
    )
