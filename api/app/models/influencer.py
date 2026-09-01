import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Integer, Boolean, Enum as SQLEnum, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import UUID
from app.core.database import Base
from app.models.enums import (
    InfluencerStatus,
    CampaignStatus,
    DiscountType,
    DiscountScope,
    CommissionType,
    AttributionStatus,
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Influencer(Base):
    __tablename__ = "influencers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    handle: Mapped[str] = mapped_column(String(100), nullable=False)
    followers_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[InfluencerStatus] = mapped_column(
        SQLEnum(InfluencerStatus, name="influencerstatus", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=InfluencerStatus.APPROVED,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )


class CampaignProduct(Base):
    __tablename__ = "campaign_products"

    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE"), primary_key=True
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), primary_key=True
    )


class CampaignCategory(Base):
    __tablename__ = "campaign_categories"

    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE"), primary_key=True
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True
    )


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=False
    )
    influencer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("influencers.id", ondelete="CASCADE"), index=True, nullable=False
    )
    coupon_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("coupons.id", ondelete="SET NULL"), index=True, nullable=True
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    discount_type: Mapped[DiscountType] = mapped_column(
        SQLEnum(DiscountType, name="discounttype", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=DiscountType.PERCENTAGE,
    )
    discount_value: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    scope: Mapped[DiscountScope] = mapped_column(
        SQLEnum(DiscountScope, name="discountscope", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=DiscountScope.STORE,
    )

    commission_type: Mapped[CommissionType] = mapped_column(
        SQLEnum(CommissionType, name="commissiontype", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=CommissionType.PERCENTAGE,
    )
    commission_value: Mapped[int] = mapped_column(Integer, nullable=False, default=0)  # % or fixed cents

    tracking_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    tracking_url: Mapped[str] = mapped_column(String(255), nullable=False)

    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    clicks: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    orders: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    revenue: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # cents
    commission_amount: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # cents

    status: Mapped[CampaignStatus] = mapped_column(
        SQLEnum(CampaignStatus, name="campaignstatus", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=CampaignStatus.ACTIVE,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    # Relationships
    products: Mapped[List["Product"]] = relationship(
        "Product", secondary="campaign_products", backref="campaigns"
    )
    categories: Mapped[List["Category"]] = relationship(
        "Category", secondary="campaign_categories", backref="campaigns"
    )


class CampaignAttribution(Base):
    __tablename__ = "campaign_attributions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    customer_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True
    )
    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="CASCADE"), index=True, nullable=False
    )
    influencer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("influencers.id", ondelete="CASCADE"), index=True, nullable=False
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=False
    )
    tracking_code: Mapped[str] = mapped_column(String(50), index=True, nullable=False)

    first_click_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    last_click_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    order_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="SET NULL"), index=True, nullable=True
    )
    conversion_status: Mapped[AttributionStatus] = mapped_column(
        SQLEnum(AttributionStatus, name="attributionstatus", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=AttributionStatus.ATTRIBUTED,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
