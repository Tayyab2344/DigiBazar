import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.deps.auth import get_current_user
from app.deps.company import get_current_company_scope, get_current_company_optional
from app.models.user import User
from app.models.company import Company
from app.models.enums import UserRole, CampaignStatus
from app.schemas.campaign_schemas import (
    CampaignCreateRequest,
    CampaignUpdateRequest,
    CampaignResponse,
    CampaignAnalyticsResponse,
)
from app.services.campaign_service import CampaignService

router = APIRouter(prefix="/api/v1/campaigns", tags=["campaigns"])


@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    payload: CampaignCreateRequest,
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """Create an influencer campaign for the current company."""
    return await CampaignService.create_campaign(db, company_id=company.id, payload=payload)


@router.get("", response_model=List[CampaignResponse])
async def list_campaigns(
    user: User = Depends(get_current_user),
    company: Optional[Company] = Depends(get_current_company_optional),
    db: AsyncSession = Depends(get_db),
):
    """List influencer campaigns."""
    is_super = user.role == UserRole.SUPER_ADMIN
    company_id = company.id if company else None
    return await CampaignService.list_campaigns(db, company_id=company_id, is_super_admin=is_super)


@router.get("/{id}", response_model=CampaignResponse)
async def get_campaign(
    id: uuid.UUID,
    user: User = Depends(get_current_user),
    company: Optional[Company] = Depends(get_current_company_optional),
    db: AsyncSession = Depends(get_db),
):
    """Get campaign details."""
    campaign = await CampaignService.get_campaign(db, id)
    is_super = user.role == UserRole.SUPER_ADMIN
    if not is_super and campaign.company_id and (not company or campaign.company_id != company.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to campaign belonging to another store.",
        )
    return campaign


@router.patch("/{id}", response_model=CampaignResponse)
async def update_campaign(
    id: uuid.UUID,
    payload: CampaignUpdateRequest,
    user: User = Depends(get_current_user),
    company: Optional[Company] = Depends(get_current_company_optional),
    db: AsyncSession = Depends(get_db),
):
    """Update an influencer campaign."""
    is_super = user.role == UserRole.SUPER_ADMIN
    company_id = company.id if company else None
    return await CampaignService.update_campaign(
        db, campaign_id=id, payload=payload, company_id=company_id, is_super_admin=is_super
    )


@router.delete("/{id}")
async def delete_campaign(
    id: uuid.UUID,
    user: User = Depends(get_current_user),
    company: Optional[Company] = Depends(get_current_company_optional),
    db: AsyncSession = Depends(get_db),
):
    """Delete an influencer campaign."""
    is_super = user.role == UserRole.SUPER_ADMIN
    company_id = company.id if company else None
    await CampaignService.delete_campaign(
        db, campaign_id=id, company_id=company_id, is_super_admin=is_super
    )
    return {"message": "Campaign deleted successfully"}


@router.post("/{id}/activate", response_model=CampaignResponse)
async def activate_campaign(
    id: uuid.UUID,
    user: User = Depends(get_current_user),
    company: Optional[Company] = Depends(get_current_company_optional),
    db: AsyncSession = Depends(get_db),
):
    """Activate a campaign."""
    is_super = user.role == UserRole.SUPER_ADMIN
    company_id = company.id if company else None
    return await CampaignService.update_campaign(
        db,
        campaign_id=id,
        payload=CampaignUpdateRequest(is_active=True),
        company_id=company_id,
        is_super_admin=is_super,
    )


@router.post("/{id}/pause", response_model=CampaignResponse)
async def pause_campaign(
    id: uuid.UUID,
    user: User = Depends(get_current_user),
    company: Optional[Company] = Depends(get_current_company_optional),
    db: AsyncSession = Depends(get_db),
):
    """Pause a campaign."""
    is_super = user.role == UserRole.SUPER_ADMIN
    company_id = company.id if company else None
    return await CampaignService.update_campaign(
        db,
        campaign_id=id,
        payload=CampaignUpdateRequest(is_active=False),
        company_id=company_id,
        is_super_admin=is_super,
    )


@router.get("/{id}/analytics", response_model=CampaignAnalyticsResponse)
async def get_campaign_analytics(
    id: uuid.UUID,
    user: User = Depends(get_current_user),
    company: Optional[Company] = Depends(get_current_company_optional),
    db: AsyncSession = Depends(get_db),
):
    """Get performance analytics for a campaign."""
    is_super = user.role == UserRole.SUPER_ADMIN
    company_id = company.id if company else None
    return await CampaignService.get_campaign_analytics(
        db, campaign_id=id, company_id=company_id, is_super_admin=is_super
    )
