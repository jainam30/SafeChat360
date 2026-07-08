# Backend Service Guide

## Technologies
- **Framework**: FastAPI
- **ORM**: SQLModel / SQLAlchemy
- **Authentication**: Passlib (Bcrypt), python-jose (JWT)
- **Rate Limiting**: slowapi
- **Realtime**: WebSockets

## Startup Flow
1. `uvicorn` loads `app.main:app`
2. `core.config` parses environment variables.
3. Custom Exception handlers and Middlewares are registered.
4. `lifespan` event runs:
   - Database tables are created if not present.
   - Firebase Admin is initialized.
5. Routers are included and server starts listening.

## Configuration
Configuration is managed centrally in `app.core.config.py`. 
Environment variables include `DATABASE_URL`, `SECRET_KEY`, `FIREBASE_CREDENTIALS_PATH`, etc.
See `.env.example` for details.
