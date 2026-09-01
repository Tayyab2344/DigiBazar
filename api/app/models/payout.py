import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, Enum as SQLEnum, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import UUID
from app.core.database import Base
from app.models.enums import PayoutStatus


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Payout(Base):
    __tablename__ = "payouts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=False
    )
    gross_sales: Mapped[int] = mapped_column(Integer, nullable=False)  # Integer cents
    platform_commission: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # Integer cents
    refunds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # Integer cents
    net_payable: Mapped[int] = mapped_column(Integer, nullable=False)  # Integer cents
    status: Mapped[PayoutStatus] = mapped_column(
        SQLEnum(PayoutStatus, name="payoutstatus", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=PayoutStatus.PENDING,
    )
    payout_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    def __repr__(self) -> str:
        return f"<Payout id={self.id} company_id={self.company_id} net_payable={self.net_payable} status={self.status}>"
