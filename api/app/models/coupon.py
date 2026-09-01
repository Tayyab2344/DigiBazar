import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Integer, Boolean, Enum as SQLEnum, DateTime, ForeignKey, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import UUID
from app.core.database import Base
from app.models.enums import DiscountType, DiscountScope


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class CouponProduct(Base):
    __tablename__ = "coupon_products"

    coupon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("coupons.id", ondelete="CASCADE"), primary_key=True
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), primary_key=True
    )


class CouponCategory(Base):
    __tablename__ = "coupon_categories"

    coupon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("coupons.id", ondelete="CASCADE"), primary_key=True
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True
    )


class CouponUsage(Base):
    __tablename__ = "coupon_usages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    coupon_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("coupons.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), index=True, nullable=False
    )
    discount_amount: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )


class Coupon(Base):
    __tablename__ = "coupons"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    company_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=True
    )
    campaign_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="SET NULL"), index=True, nullable=True
    )
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False, default="Coupon")
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    discount_type: Mapped[DiscountType] = mapped_column(
        SQLEnum(DiscountType, name="discounttype", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=DiscountType.PERCENTAGE,
    )
    discount_value: Mapped[int] = mapped_column(Integer, nullable=False, default=0)  # % or cents
    scope: Mapped[DiscountScope] = mapped_column(
        SQLEnum(DiscountScope, name="discountscope", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=DiscountScope.STORE,
    )

    minimum_order_amount: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # cents
    maximum_discount_amount: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # cents (0 = no max cap)
    usage_limit: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # 0 = unlimited
    usage_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    per_customer_limit: Mapped[int] = mapped_column(Integer, default=1, nullable=False)  # 0 = unlimited

    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_platform: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    # Relationships
    products: Mapped[List["Product"]] = relationship(
        "Product", secondary="coupon_products", backref="coupons"
    )
    categories: Mapped[List["Category"]] = relationship(
        "Category", secondary="coupon_categories", backref="coupons"
    )

    def __repr__(self) -> str:
        return f"<Coupon id={self.id} code={self.code} scope={self.scope}>"
