from fastapi import APIRouter, Depends
from starlette.requests import Request
from app.limiter import limiter
from app.schemas.auth import RegisterRequest, LoginRequest, VerifyRequest, TokenResponse
from app.services.auth import AuthService
from app.deps import get_auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=dict)
@limiter.limit("5/minute")
async def register(
    request: Request, 
    req: RegisterRequest, 
    service: AuthService = Depends(get_auth_service)
):
    return await service.register(req)

@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request: Request, 
    req: LoginRequest, 
    service: AuthService = Depends(get_auth_service)
):
    return await service.login(req)

@router.post("/verify-identity", response_model=TokenResponse)
@limiter.limit("5/minute")
async def verify_identity(
    request: Request, 
    req: VerifyRequest, 
    service: AuthService = Depends(get_auth_service)
):
    return await service.verify_identity(req)
