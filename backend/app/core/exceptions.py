from fastapi import Request, status
from fastapi.responses import JSONResponse
from .logger import logger

class APIException(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, errors: list = None):
        self.message = message
        self.status_code = status_code
        self.errors = errors or []

async def custom_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Internal Server Error",
            "data": {},
            "meta": {},
            "errors": []
        }
    )

async def api_exception_handler(request: Request, exc: APIException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "data": {},
            "meta": {},
            "errors": exc.errors
        }
    )
