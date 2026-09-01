import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.deps.auth import get_current_user, get_current_user_optional
from app.deps.company import get_current_company_scope, get_current_company_optional
from app.models.user import User
from app.models.company import Company
from app.models.enums import UserRole
from app.schemas.coupon_schemas import (
    CouponCreateRequest,
    CouponUpdateRequest,
    CouponResponse,
    CouponValidationRequest,
    CouponValidationResponse,
)
from app.services.coupon_service import CouponService

router = APIRouter(prefix="/api/v1/coupons", tags=["coupons"])


@router.post("", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
async def create_coupon(
    payload: CouponCreateRequest,
    user: User = Depends(get_current_user),
    company: Optional[Company] = Depends(get_current_company_optional),
    db: AsyncSession = Depends(get_db),
):
    """Create a new company-scoped coupon (or platform coupon if SUPER_ADMIN)."""
    is_super = user.role == UserRole.SUPER_ADMIN
    if not is_super and not company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vendor company access required to create a store coupon.",
        )

    company_id = company.id if company else None
    return await CouponService.create_coupon(
        db, company_id=company_id, payload=payload, is_platform=is_super and company_id is None
    )


@router.get("", response_model=List[CouponResponse])
async def list_coupons(
    user: User = Depends(get_current_user),
    company: Optional[Company] = Depends(get_current_company_optional),
    db: AsyncSession = Depends(get_db),
):
    """List coupons for the vendor company (or all coupons if SUPER_ADMIN)."""
    is_super = user.role == UserRole.SUPER_ADMIN
    company_id = company.id if company else None
    return await CouponService.list_coupons(db, company_id=company_id, is_super_admin=is_super)


@router.get("/{id}", response_model=CouponResponse)
async def get_coupon(
    id: uuid.UUID,
    user: User = Depends(get_current_user),
    company: Optional[Company] = Depends(get_current_company_optional),
    db: AsyncSession = Depends(get_db),
):
    """Get details of a specific coupon."""
    coupon = await CouponService.get_coupon(db, id)
    is_super = user.role == UserRole.SUPER_ADMIN
    if not is_super and coupon.company_id and (not company or coupon.company_id != company.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to coupon belonging to another store.",
        )
    return coupon


@router.patch("/{id}", response_model=CouponResponse)
async def update_coupon(
    id: uuid.UUID,
    payload: CouponUpdateRequest,
    user: User = Depends(get_current_user),
    company: Optional[Company] = Depends(get_current_company_optional),
    db: AsyncSession = Depends(get_db),
):
    """Update a coupon belonging to the company."""
    is_super = user.role == UserRole.SUPER_ADMIN
    company_id = company.id if company else None
    return await CouponService.update_coupon(
        db, coupon_id=id, payload=payload, company_id=company_id, is_super_admin=is_super
    )


@router.delete("/{id}")
async def delete_coupon(
    id: uuid.UUID,
    user: User = Depends(get_current_user),
    company: Optional[Company] = Depends(get_current_company_optional),
    db: AsyncSession = Depends(get_db),
):
    """Delete a coupon belonging to the company."""
    is_super = user.role == UserRole.SUPER_ADMIN
    company_id = company.id if company else None
    await CouponService.delete_coupon(
        db, coupon_id=id, company_id=company_id, is_super_admin=is_super
    )
    return {"message": "Coupon deleted successfully"}


@router.post("/{id}/activate", response_model=CouponResponse)
async def activate_coupon(
    id: uuid.UUID,
    user: User = Depends(get_current_user),
    company: Optional[Company] = Depends(get_current_company_optional),
    db: AsyncSession = Depends(get_db),
):
    """Activate a coupon."""
    is_super = user.role == UserRole.SUPER_ADMIN
    company_id = company.id if company else None
    return await CouponService.set_active_status(
        db, coupon_id=id, is_active=True, company_id=company_id, is_super_admin=is_super
    )


@router.post("/{id}/pause", response_model=CouponResponse)
async def pause_coupon(
    id: uuid.UUID,
    user: User = Depends(get_current_user),
    company: Optional[Company] = Depends(get_current_company_optional),
    db: AsyncSession = Depends(get_db),
):
    """Pause a coupon."""
    is_super = user.role == UserRole.SUPER_ADMIN
    company_id = company.id if company else None
    return await CouponService.set_active_status(
        db, coupon_id=id, is_active=False, company_id=company_id, is_super_admin=is_super
    )


@router.post("/validate", response_model=CouponValidationResponse)
async def validate_coupon(
    payload: CouponValidationRequest,
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Public / Customer endpoint to validate a coupon code for a cart."""
    customer_id = user.id if user else None
    return await CouponService.validate_coupon(db, payload, customer_id=customer_id)
