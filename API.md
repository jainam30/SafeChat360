# API Documentation

## Standard Response Format
All JSON responses follow this standard structure (except legacy overrides):
```json
{
    "success": true,
    "message": "Operation successful",
    "data": {},
    "meta": {},
    "errors": []
}
```

## Health Endpoints
- `GET /health`: Returns basic health status.
- `GET /ready`: Readiness probe.
- `GET /live`: Liveness probe.

## Core Modules
- **Auth**: `/api/auth/`
- **Chat**: `/api/chat/`
- **Users**: `/api/users/`

Detailed endpoint documentation can be found via the interactive Swagger UI at `/docs` when running the application.
