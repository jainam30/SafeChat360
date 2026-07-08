from typing import Any, Optional

def success_response(data: Any = None, message: str = "Success", meta: Optional[dict] = None) -> dict:
    return {
        "success": True,
        "message": message,
        "data": data if data is not None else {},
        "meta": meta if meta is not None else {},
        "errors": []
    }

def error_response(message: str, errors: list = None) -> dict:
    return {
        "success": False,
        "message": message,
        "data": {},
        "meta": {},
        "errors": errors if errors is not None else []
    }
