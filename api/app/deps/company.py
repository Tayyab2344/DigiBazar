import uuid
from typing import Optional
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.deps.auth import get_current_user, get_current_user_optional
from app.models.company import Company
from app.models.enums import UserRole, CompanyStatus
from app.models.user import User


async def get_current_company_optional(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
    x_company_id: Optional[str] = Header(None, alias="X-Company-ID"),
) -> Optional[Company]:
    if not current_user:
        return None
    try:
        return await get_current_company_scope(current_user=current_user, db=db, x_company_id=x_company_id)
    except Exception:
        return None


async def get_current_company_scope(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    x_company_id: Optional[str] = Header(None, alias="X-Company-ID"),
) -> Company:
    """
    Tenant Scoping Dependency:
    - Derives the authenticated company from the current_user.
    - If user role is COMPANY, fetches the Company owned by current_user.id.
    - If user role is SUPER_ADMIN, allows administrative override via X-Company-ID header.
    - Strictly prevents CUSTOMER from accessing company resources.
    - Raises 403 / 404 if no valid active company is found.
    """
    if current_user.role == UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customers are not authorized to access company management resources",
        )

    if current_user.role == UserRole.SUPER_ADMIN and x_company_id:
        try:
            target_company_id = uuid.UUID(x_company_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid X-Company-ID header format",
            )
        result = await db.execute(select(Company).where(Company.id == target_company_id))
        company = result.scalar_one_or_none()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Specified company not found",
            )
        return company

    # Default for COMPANY role (or SUPER_ADMIN without override)
    result = await db.execute(select(Company).where(Company.owner_id == current_user.id))
    company = result.scalar_one_or_none()

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No company storefront found for this account",
        )

    if company.status in (CompanyStatus.BLOCKED, CompanyStatus.SUSPENDED):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Company account is currently {company.status.value}. Access restricted.",
        )

    return company
