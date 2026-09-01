import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Enum as SQLEnum, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import UUID

from app.core.database import Base
from app.models.enums import BusinessType, CompanyStatus, VerificationStatus, StoreStatus


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    address_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("addresses.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    legal_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    business_email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    logo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cover_image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    tax_identifier: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    registration_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    business_type: Mapped[BusinessType] = mapped_column(
        SQLEnum(BusinessType, name="businesstype", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=BusinessType.RETAIL,
    )
    status: Mapped[CompanyStatus] = mapped_column(
        SQLEnum(CompanyStatus, name="companystatus", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=CompanyStatus.PENDING,
        index=True,
    )
    verification_status: Mapped[VerificationStatus] = mapped_column(
        SQLEnum(VerificationStatus, name="verificationstatus", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=VerificationStatus.PENDING,
    )
    store_status: Mapped[StoreStatus] = mapped_column(
        SQLEnum(StoreStatus, name="storestatus", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=StoreStatus.OPEN,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    def __repr__(self) -> str:
        return f"<Company id={self.id} name={self.name} status={self.status}>"
