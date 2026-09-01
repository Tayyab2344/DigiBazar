import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Header, Cookie, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.deps.auth import get_current_user_optional
from app.models.user import User
from app.schemas.campaign_schemas import AttributionResponse
from app.services.campaign_service import CampaignService

router = APIRouter(prefix="/api/v1/c", tags=["tracking"])


@router.get("/{tracking_code}", response_model=AttributionResponse)
async def process_tracking_link(
    tracking_code: str,
    response: Response,
    session_id: Optional[str] = Cookie(None, alias="digibazar_session_id"),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Process an influencer campaign tracking link click, record 30-day attribution, set cookie, and return metadata."""
    effective_session_id = session_id or x_session_id or f"sess_{uuid.uuid4().hex}"

    # Set secure attribution cookie (expires in 30 days)
    response.set_cookie(
        key="digibazar_session_id",
        value=effective_session_id,
        max_age=30 * 24 * 3600,
        httponly=True,
        samesite="lax",
    )

    customer_id = user.id if user else None
    attribution = await CampaignService.track_click(
        db=db,
        tracking_code=tracking_code,
        session_id=effective_session_id,
        customer_id=customer_id,
    )

    response.set_cookie(
        key="digibazar_attribution_code",
        value=tracking_code.upper(),
        max_age=30 * 24 * 3600,
        httponly=False,
        samesite="lax",
    )

    return attribution
