from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.deps.auth import get_current_user
from app.models.user import User
from app.schemas.auth import (
    CustomerRegisterRequest,
    CompanyRegisterRequest,
    LoginRequest,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserResponse,
    LoginResponse,
    MessageResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post(
    "/register/customer",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new customer account",
)
async def register_customer(
    data: CustomerRegisterRequest, db: AsyncSession = Depends(get_db)
) -> UserResponse:
    user = await AuthService.register_customer(db, data)
    return UserResponse.model_validate(user)


@router.post(
    "/register/company",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new company (vendor) account",
)
async def register_company(
    data: CompanyRegisterRequest, db: AsyncSession = Depends(get_db)
) -> UserResponse:
    user = await AuthService.register_company(db, data)
    return UserResponse.model_validate(user)


@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and return JWT access token",
)
async def login(
    data: LoginRequest, db: AsyncSession = Depends(get_db)
) -> LoginResponse:
    return await AuthService.login(db, data)


@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Logout current user",
)
async def logout(current_user: User = Depends(get_current_user)) -> MessageResponse:
    return MessageResponse(message="Successfully logged out")


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get authenticated current user profile",
)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.post(
    "/change-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Change current user password",
)
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    return await AuthService.change_password(db, current_user, data)


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Request a password reset link/token",
)
async def forgot_password(
    data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)
) -> MessageResponse:
    return await AuthService.forgot_password(db, data)


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Reset password using reset token",
)
async def reset_password(
    data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)
) -> MessageResponse:
    return await AuthService.reset_password(db, data)
