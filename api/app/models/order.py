import uuid
from datetime import datetime, timezone
from typing import Optional, Any, List
from sqlalchemy import String, Integer, Enum as SQLEnum, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import UUID
from app.core.database import Base
from app.models.enums import OrderStatus, PaymentStatus


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=False
    )
    items: Mapped[Optional[List[Any]]] = mapped_column(JSON, default=list, nullable=True)
    subtotal: Mapped[int] = mapped_column(Integer, nullable=False)  # Integer cents
    discount: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    shipping: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tax: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total: Mapped[int] = mapped_column(Integer, nullable=False)
    payment_status: Mapped[PaymentStatus] = mapped_column(
        SQLEnum(PaymentStatus, name="paymentstatus", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=PaymentStatus.PENDING,
    )
    order_status: Mapped[OrderStatus] = mapped_column(
        SQLEnum(OrderStatus, name="orderstatus", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=OrderStatus.PENDING,
    )
    payment_reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    def __repr__(self) -> str:
        return f"<Order id={self.id} total={self.total} status={self.order_status}>"


class OrderStatusHistory(Base):
    __tablename__ = "order_status_histories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), index=True, nullable=False
    )
    previous_status: Mapped[OrderStatus] = mapped_column(
        SQLEnum(OrderStatus, name="orderstatus", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    new_status: Mapped[OrderStatus] = mapped_column(
        SQLEnum(OrderStatus, name="orderstatus", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    changed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
