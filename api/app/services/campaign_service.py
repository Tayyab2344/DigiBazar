import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.influencer import (
    Influencer,
    Campaign,
    CampaignProduct,
    CampaignCategory,
    CampaignAttribution,
)
from app.models.coupon import Coupon
from app.models.order import Order
from app.models.enums import (
    CampaignStatus,
    CommissionType,
    AttributionStatus,
    DiscountType,
    DiscountScope,
)
from app.schemas.campaign_schemas import (
    CampaignCreateRequest,
    CampaignUpdateRequest,
    CampaignResponse,
    CampaignAnalyticsResponse,
    AttributionResponse,
    CommissionResponse,
)
from app.services.coupon_service import CouponService
from app.schemas.coupon_schemas import CouponCreateRequest


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class CampaignService:

    @staticmethod
    async def create_campaign(
        db: AsyncSession, company_id: uuid.UUID, payload: CampaignCreateRequest
    ) -> CampaignResponse:
        # Check influencer if provided
        influencer_id_val = None
        if payload.influencer_id:
            inf_res = await db.execute(
                select(Influencer).where(Influencer.id == payload.influencer_id)
            )
            influencer = inf_res.scalar_one_or_none()
            if not influencer:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Influencer not found.",
                )
            influencer_id_val = influencer.id

        # Normalize tracking code
        raw_code = payload.coupon_code or f"CAMPAIGN-{str(uuid.uuid4())[:8].upper()}"
        tracking_code = raw_code.strip().upper()

        # Check unique tracking code
        c_exist = await db.execute(select(Campaign).where(Campaign.tracking_code == tracking_code))
        if c_exist.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tracking code / coupon code '{tracking_code}' already exists.",
            )

        # Create linked Coupon if not present
        cp_res = await db.execute(select(Coupon).where(Coupon.code == tracking_code))
        coupon = cp_res.scalar_one_or_none()
        if not coupon:
            c_req = CouponCreateRequest(
                code=tracking_code,
                name=f"Campaign Coupon - {payload.name}",
                description=f"Influencer discount code for {payload.name}",
                discount_type=payload.discount_type,
                discount_value=payload.discount_value,
                scope=payload.scope,
                start_date=payload.start_date,
                end_date=payload.end_date,
                is_active=payload.is_active,
                product_ids=payload.product_ids,
                category_ids=payload.category_ids,
            )
            coupon_dto = await CouponService.create_coupon(
                db, company_id=company_id, payload=c_req, is_platform=False
            )
            coupon_id = coupon_dto.id
        else:
            coupon_id = coupon.id

        tracking_url = f"/c/{tracking_code}"

        campaign = Campaign(
            company_id=company_id,
            influencer_id=influencer_id_val,
            coupon_id=coupon_id,
            name=payload.name,
            description=payload.description,
            discount_type=payload.discount_type,
            discount_value=payload.discount_value,
            scope=payload.scope,
            commission_type=payload.commission_type,
            commission_value=payload.commission_value,
            budget=payload.budget or 0,
            tracking_code=tracking_code,
            tracking_url=tracking_url,
            start_date=payload.start_date,
            end_date=payload.end_date,
            is_active=payload.is_active,
            status=CampaignStatus.ACTIVE if payload.is_active else CampaignStatus.PAUSED,
        )
        db.add(campaign)
        await db.flush()

        # Update coupon's campaign_id reference
        res_cp = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
        cp_obj = res_cp.scalar_one_or_none()
        if cp_obj:
            cp_obj.campaign_id = campaign.id

        # Attach products/categories
        for pid in payload.product_ids or []:
            db.add(CampaignProduct(campaign_id=campaign.id, product_id=pid))

        for cid in payload.category_ids or []:
            db.add(CampaignCategory(campaign_id=campaign.id, category_id=cid))

        await db.commit()
        await db.refresh(campaign)

        return await CampaignService._build_response(db, campaign)

    @staticmethod
    async def get_campaign(db: AsyncSession, campaign_id: uuid.UUID) -> CampaignResponse:
        res = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
        campaign = res.scalar_one_or_none()
        if not campaign:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found.")
        return await CampaignService._build_response(db, campaign)

    @staticmethod
    async def list_campaigns(
        db: AsyncSession, company_id: Optional[uuid.UUID] = None, is_super_admin: bool = False
    ) -> List[CampaignResponse]:
        stmt = select(Campaign)
        if not is_super_admin and company_id:
            stmt = stmt.where(Campaign.company_id == company_id)
        stmt = stmt.order_by(Campaign.created_at.desc())

        res = await db.execute(stmt)
        campaigns = res.scalars().all()
        return [await CampaignService._build_response(db, c) for c in campaigns]

    @staticmethod
    async def update_campaign(
        db: AsyncSession,
        campaign_id: uuid.UUID,
        payload: CampaignUpdateRequest,
        company_id: Optional[uuid.UUID] = None,
        is_super_admin: bool = False,
    ) -> CampaignResponse:
        res = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
        campaign = res.scalar_one_or_none()
        if not campaign:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found.")

        if not is_super_admin and campaign.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify this campaign.",
            )

        data = payload.model_dump(exclude_unset=True)
        product_ids = data.pop("product_ids", None)
        category_ids = data.pop("category_ids", None)

        for key, value in data.items():
            if value is not None:
                setattr(campaign, key, value)

        if product_ids is not None:
            await db.execute(
                CampaignProduct.__table__.delete().where(CampaignProduct.campaign_id == campaign.id)
            )
            for pid in product_ids:
                db.add(CampaignProduct(campaign_id=campaign.id, product_id=pid))

        if category_ids is not None:
            await db.execute(
                CampaignCategory.__table__.delete().where(CampaignCategory.campaign_id == campaign.id)
            )
            for cid in category_ids:
                db.add(CampaignCategory(campaign_id=campaign.id, category_id=cid))

        await db.commit()
        await db.refresh(campaign)
        return await CampaignService._build_response(db, campaign)

    @staticmethod
    async def delete_campaign(
        db: AsyncSession, campaign_id: uuid.UUID, company_id: Optional[uuid.UUID] = None, is_super_admin: bool = False
    ) -> bool:
        res = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
        campaign = res.scalar_one_or_none()
        if not campaign:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found.")

        if not is_super_admin and campaign.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this campaign.",
            )

        await db.delete(campaign)
        await db.commit()
        return True

    @staticmethod
    async def track_click(
        db: AsyncSession, tracking_code: str, session_id: str, customer_id: Optional[uuid.UUID] = None
    ) -> AttributionResponse:
        normalized_code = tracking_code.strip().upper()
        res = await db.execute(select(Campaign).where(Campaign.tracking_code == normalized_code))
        campaign = res.scalar_one_or_none()

        if not campaign or not campaign.is_active or campaign.status != CampaignStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campaign tracking code is invalid or inactive.",
            )

        # Increment clicks
        campaign.clicks += 1

        # Check existing attribution
        now = utc_now()
        expires_at = now + timedelta(days=30)

        att_res = await db.execute(
            select(CampaignAttribution).where(
                and_(
                    CampaignAttribution.session_id == session_id,
                    CampaignAttribution.campaign_id == campaign.id,
                )
            )
        )
        attribution = att_res.scalar_one_or_none()

        if not attribution:
            attribution = CampaignAttribution(
                session_id=session_id,
                customer_id=customer_id,
                campaign_id=campaign.id,
                influencer_id=campaign.influencer_id,
                company_id=campaign.company_id,
                tracking_code=normalized_code,
                first_click_at=now,
                last_click_at=now,
                expires_at=expires_at,
                conversion_status=AttributionStatus.ATTRIBUTED,
            )
            db.add(attribution)
        else:
            attribution.last_click_at = now
            attribution.expires_at = expires_at
            if customer_id and not attribution.customer_id:
                attribution.customer_id = customer_id

        await db.commit()
        await db.refresh(attribution)

        return AttributionResponse.model_validate(attribution)

    @staticmethod
    async def record_conversion(
        db: AsyncSession,
        order: Order,
        session_id: Optional[str] = None,
        customer_id: Optional[uuid.UUID] = None,
    ) -> Optional[CommissionResponse]:
        now = utc_now()
        stmt = select(CampaignAttribution).where(
            and_(
                CampaignAttribution.company_id == order.company_id,
                CampaignAttribution.expires_at >= now,
                CampaignAttribution.conversion_status == AttributionStatus.ATTRIBUTED,
            )
        )

        if customer_id and session_id:
            stmt = stmt.where(
                or_(
                    CampaignAttribution.customer_id == customer_id,
                    CampaignAttribution.session_id == session_id,
                )
            )
        elif customer_id:
            stmt = stmt.where(CampaignAttribution.customer_id == customer_id)
        elif session_id:
            stmt = stmt.where(CampaignAttribution.session_id == session_id)
        else:
            return None

        stmt = stmt.order_by(CampaignAttribution.last_click_at.desc())
        res = await db.execute(stmt)
        attribution = res.scalar_one_or_none()

        if not attribution:
            return None

        c_res = await db.execute(select(Campaign).where(Campaign.id == attribution.campaign_id))
        campaign = c_res.scalar_one_or_none()
        if not campaign:
            return None

        # Calculate commission
        paid_amount = max(0, order.total)
        if campaign.commission_type == CommissionType.PERCENTAGE:
            commission = (paid_amount * campaign.commission_value) // 100
        else:  # FIXED
            commission = min(campaign.commission_value, paid_amount)

        commission = max(0, commission)

        # Update Campaign metrics
        campaign.orders += 1
        campaign.revenue += paid_amount
        campaign.commission_amount += commission

        # Update Attribution
        attribution.order_id = order.id
        attribution.conversion_status = AttributionStatus.CONVERTED

        await db.commit()

        return CommissionResponse(
            campaign_id=campaign.id,
            influencer_id=campaign.influencer_id,
            order_id=order.id,
            order_total=paid_amount,
            commission_type=campaign.commission_type,
            commission_value=campaign.commission_value,
            calculated_commission=commission,
        )

    @staticmethod
    async def get_campaign_analytics(
        db: AsyncSession, campaign_id: uuid.UUID, company_id: Optional[uuid.UUID] = None, is_super_admin: bool = False
    ) -> CampaignAnalyticsResponse:
        res = await db.execute(select(Campaign).where(Campaign.id == campaign_id))
        campaign = res.scalar_one_or_none()
        if not campaign:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Campaign not found.")

        if not is_super_admin and campaign.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view analytics for this campaign.",
            )

        clicks = campaign.clicks
        orders = campaign.orders
        revenue = campaign.revenue
        commission_amount = campaign.commission_amount

        # Calculate total discount cost for this campaign from CouponUsages
        discount_cost = 0
        if campaign.coupon_id:
            cu_res = await db.execute(
                select(func.sum(Coupon.discount_value * Coupon.usage_count)).where(Coupon.id == campaign.coupon_id)
            )
            # Estimate or calculate exact usages
            u_res = await db.execute(
                select(func.sum(Order.discount)).where(
                    and_(Order.company_id == campaign.company_id, Order.discount > 0)
                )
            )
            discount_cost = u_res.scalar() or 0

        conversion_rate = round((orders / max(1, clicks)) * 100, 2)
        average_order_value = revenue // max(1, orders)

        return CampaignAnalyticsResponse(
            campaign_id=campaign.id,
            name=campaign.name,
            clicks=clicks,
            orders=orders,
            revenue=revenue,
            discount_cost=discount_cost,
            commission_amount=commission_amount,
            conversion_rate=conversion_rate,
            average_order_value=average_order_value,
        )

    @staticmethod
    async def _build_response(db: AsyncSession, campaign: Campaign) -> CampaignResponse:
        p_res = await db.execute(
            select(CampaignProduct.product_id).where(CampaignProduct.campaign_id == campaign.id)
        )
        product_ids = list(p_res.scalars().all())

        c_res = await db.execute(
            select(CampaignCategory.category_id).where(CampaignCategory.campaign_id == campaign.id)
        )
        category_ids = list(c_res.scalars().all())

        coupon_code = None
        if campaign.coupon_id:
            cp_res = await db.execute(select(Coupon.code).where(Coupon.id == campaign.coupon_id))
            coupon_code = cp_res.scalar_one_or_none()

        inf_handle = None
        if campaign.influencer_id:
            inf_res = await db.execute(select(Influencer.handle).where(Influencer.id == campaign.influencer_id))
            inf_handle = inf_res.scalar_one_or_none()

        return CampaignResponse(
            id=campaign.id,
            company_id=campaign.company_id,
            influencer_id=campaign.influencer_id,
            influencer_handle=inf_handle or "Store Promo",
            coupon_id=campaign.coupon_id,
            coupon_code=coupon_code or campaign.tracking_code,
            name=campaign.name,
            description=campaign.description,
            discount_type=campaign.discount_type,
            discount_value=campaign.discount_value,
            scope=campaign.scope,
            commission_type=campaign.commission_type,
            commission_value=campaign.commission_value,
            tracking_code=campaign.tracking_code,
            tracking_url=campaign.tracking_url,
            budget=campaign.budget or 0,
            start_date=campaign.start_date,
            end_date=campaign.end_date,
            is_active=campaign.is_active,
            status=campaign.status,
            clicks=campaign.clicks,
            orders=campaign.orders,
            revenue=campaign.revenue,
            commission_amount=campaign.commission_amount,
            created_at=campaign.created_at,
            updated_at=campaign.updated_at,
            product_ids=product_ids,
            category_ids=category_ids,
        )
