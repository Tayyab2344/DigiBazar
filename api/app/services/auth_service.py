import uuid
import re
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    verify_password_async,
    create_access_token,
    create_reset_token,
    verify_reset_token,
)
from app.models import UserRole, BusinessType, CompanyStatus, User, Address, Company
from app.schemas.auth import (
    CustomerRegisterRequest,
    CompanyRegisterRequest,
    LoginRequest,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserProfileUpdateRequest,
    UserResponse,
    LoginResponse,
    MessageResponse,
)


class AuthService:
    @staticmethod
    async def register_customer(db: AsyncSession, data: CustomerRegisterRequest) -> User:
        """Register a new customer account with primary delivery address."""
        normalized_email = data.email.strip().lower()

        # Check for duplicate email
        result = await db.execute(select(User).where(User.email == normalized_email))
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered",
            )

        # 1. Create Address record
        address_obj = Address(
            address_line_1=data.address.address_line_1.strip(),
            address_line_2=data.address.address_line_2.strip() if data.address.address_line_2 else None,
            city=data.address.city.strip(),
            province=data.address.province.strip(),
            postal_code=data.address.postal_code.strip(),
            country=data.address.country.strip(),
            landmark=data.address.landmark.strip() if data.address.landmark else None,
        )
        db.add(address_obj)
        await db.flush()

        # 2. Create User record
        hashed_pwd = hash_password(data.password)
        new_user = User(
            first_name=data.first_name.strip(),
            last_name=data.last_name.strip(),
            email=normalized_email,
            phone=data.phone.strip() if data.phone else None,
            password_hash=hashed_pwd,
            role=UserRole.CUSTOMER,
            address_id=address_obj.id,
            is_active=True,
            is_verified=True,
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return new_user

    @staticmethod
    async def register_company(db: AsyncSession, data: CompanyRegisterRequest) -> User:
        """Register a new company (vendor) account with business address, owner user, and company record."""
        owner_email = data.owner.email.strip().lower()
        business_email = data.business_email.strip().lower()

        # Check for duplicate email in User table
        result = await db.execute(
            select(User).where((User.email == owner_email) | (User.email == business_email))
        )
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists",
            )

        # 1. Create Business Address record
        address_obj = Address(
            address_line_1=data.address.address_line_1.strip(),
            address_line_2=data.address.address_line_2.strip() if data.address.address_line_2 else None,
            city=data.address.city.strip(),
            province=data.address.province.strip(),
            postal_code=data.address.postal_code.strip(),
            country=data.address.country.strip(),
            landmark=data.address.landmark.strip() if data.address.landmark else None,
        )
        db.add(address_obj)
        await db.flush()

        # 2. Create Owner User record
        hashed_pwd = hash_password(data.password)
        owner_user = User(
            first_name=data.owner.first_name.strip(),
            last_name=data.owner.last_name.strip(),
            email=owner_email,
            phone=data.owner.phone.strip(),
            password_hash=hashed_pwd,
            role=UserRole.COMPANY,
            address_id=address_obj.id,
            is_active=True,
            is_verified=True,
        )
        db.add(owner_user)
        await db.flush()

        # 3. Create Company record
        raw_slug = re.sub(r"[^a-z0-9]+", "-", data.business_name.lower()).strip("-")
        company_slug = f"{raw_slug}-{str(uuid.uuid4())[:6]}"

        try:
            b_type = BusinessType(data.business_type)
        except ValueError:
            b_type = BusinessType.RETAIL

        company_obj = Company(
            owner_id=owner_user.id,
            address_id=address_obj.id,
            name=data.business_name.strip(),
            slug=company_slug,
            business_email=business_email,
            phone=data.business_phone.strip(),
            logo_url=data.business_logo.strip() if data.business_logo else None,
            website=data.website.strip() if data.website else None,
            business_type=b_type,
            status=CompanyStatus.PENDING,
        )
        db.add(company_obj)
        await db.flush()

        # Link company_id to owner user
        owner_user.company_id = company_obj.id

        await db.commit()
        await db.refresh(owner_user)
        return owner_user

    @staticmethod
    async def login(db: AsyncSession, data: LoginRequest) -> LoginResponse:
        """Authenticate user and return JWT access token."""
        normalized_email = data.email.strip().lower()

        result = await db.execute(select(User).where(User.email == normalized_email))
        user = result.scalar_one_or_none()

        if not user or not await verify_password_async(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is inactive",
            )

        token_payload = {
            "user_id": str(user.id),
            "sub": str(user.id),
            "role": user.role.value,
            "company_id": str(user.company_id) if user.company_id else None,
        }
        access_token = create_access_token(token_payload)

        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
        )

    @staticmethod
    async def change_password(
        db: AsyncSession, user: User, data: ChangePasswordRequest
    ) -> MessageResponse:
        """Change authenticated user password."""
        if not verify_password(data.current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect current password",
            )

        user.password_hash = hash_password(data.new_password)
        db.add(user)
        await db.commit()
        await db.refresh(user)

        return MessageResponse(message="Password changed successfully")

    @staticmethod
    async def forgot_password(
        db: AsyncSession, data: ForgotPasswordRequest
    ) -> MessageResponse:
        """Generate password reset token for valid user email."""
        normalized_email = data.email.strip().lower()

        result = await db.execute(select(User).where(User.email == normalized_email))
        user = result.scalar_one_or_none()

        if user and user.is_active:
            reset_token = create_reset_token(user.email)
            return MessageResponse(
                message="Password reset token generated successfully",
                reset_token=reset_token,
            )

        return MessageResponse(
            message="If an account exists with this email, a password reset token has been generated"
        )

    @staticmethod
    async def reset_password(
        db: AsyncSession, data: ResetPasswordRequest
    ) -> MessageResponse:
        """Reset password using reset token."""
        email = verify_reset_token(data.reset_token)
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account not found or inactive",
            )

        user.password_hash = hash_password(data.new_password)
        db.add(user)
        await db.commit()
        await db.refresh(user)

        return MessageResponse(message="Password reset successfully")

    @staticmethod
    async def update_profile(
        db: AsyncSession, user: User, data: UserProfileUpdateRequest
    ) -> User:
        """Update current user profile and default delivery address."""
        if data.first_name is not None:
            user.first_name = data.first_name.strip()
        if data.last_name is not None:
            user.last_name = data.last_name.strip()
        if data.phone is not None:
            user.phone = data.phone.strip()

        if data.address is not None:
            if user.address_id and user.address:
                user.address.address_line_1 = data.address.address_line_1.strip()
                user.address.address_line_2 = data.address.address_line_2.strip() if data.address.address_line_2 else None
                user.address.city = data.address.city.strip()
                user.address.province = data.address.province.strip()
                user.address.postal_code = data.address.postal_code.strip()
                user.address.country = data.address.country.strip()
                user.address.landmark = data.address.landmark.strip() if data.address.landmark else None
            else:
                new_addr = Address(
                    address_line_1=data.address.address_line_1.strip(),
                    address_line_2=data.address.address_line_2.strip() if data.address.address_line_2 else None,
                    city=data.address.city.strip(),
                    province=data.address.province.strip(),
                    postal_code=data.address.postal_code.strip(),
                    country=data.address.country.strip(),
                    landmark=data.address.landmark.strip() if data.address.landmark else None,
                )
                db.add(new_addr)
                await db.flush()
                user.address_id = new_addr.id
                user.address = new_addr

        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    def create_token(data: dict) -> str:
        """Helper to create access token."""
        return create_access_token(data)

    @staticmethod
    async def seed_super_admin(db: AsyncSession) -> Optional[User]:
        """Seed initial Super Admin account if not present."""
        admin_email = settings.SUPER_ADMIN_EMAIL.strip().lower()
        result = await db.execute(select(User).where(User.email == admin_email))
        admin = result.scalar_one_or_none()

        if not admin:
            admin = User(
                first_name=settings.SUPER_ADMIN_FIRST_NAME,
                last_name=settings.SUPER_ADMIN_LAST_NAME,
                email=admin_email,
                phone=settings.SUPER_ADMIN_PHONE,
                password_hash=hash_password(settings.SUPER_ADMIN_PASSWORD),
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                is_verified=True,
            )
            db.add(admin)
            await db.commit()
            await db.refresh(admin)
        return admin
