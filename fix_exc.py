import os

with open('backend/app/core/exceptions.py', 'r', encoding='utf-8') as f:
    content = f.read()

bad_custom = '''    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Internal Server Error",
            "data": {},
            "meta": {},
            "errors": []
        }
    )'''

good_custom = '''    headers = {"Access-Control-Allow-Origin": request.headers.get("origin") or "*", "Access-Control-Allow-Credentials": "true"}
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
    )'''

bad_api = '''    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "data": {},
            "meta": {},
            "errors": exc.errors
        }
    )'''

good_api = '''    headers = {"Access-Control-Allow-Origin": request.headers.get("origin") or "*", "Access-Control-Allow-Credentials": "true"}
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
    )'''

content = content.replace(bad_custom, good_custom).replace(bad_api, good_api)
with open('backend/app/core/exceptions.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed exception handlers CORS headers")
