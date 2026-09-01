import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, Enum as SQLEnum, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import UUID
from app.core.database import Base
from app.models.enums import TargetType, ReportStatus


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    reporter_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    target_type: Mapped[TargetType] = mapped_column(
        SQLEnum(TargetType, name="targettype", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    target_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[ReportStatus] = mapped_column(
        SQLEnum(ReportStatus, name="reportstatus", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=ReportStatus.OPEN,
    )
    assigned_admin_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    resolution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<Report id={self.id} target={self.target_type}:{self.target_id} status={self.status}>"
