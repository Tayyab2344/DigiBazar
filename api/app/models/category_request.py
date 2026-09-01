import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, Enum as SQLEnum, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import UUID

from app.core.database import Base
from app.models.enums import CategoryRequestStatus


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class CategoryRequest(Base):
    __tablename__ = "category_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[CategoryRequestStatus] = mapped_column(
        SQLEnum(CategoryRequestStatus, name="categoryrequeststatus", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=CategoryRequestStatus.PENDING,
        index=True,
    )
    admin_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    def __repr__(self) -> str:
        return f"<CategoryRequest id={self.id} name={self.name} status={self.status}>"
