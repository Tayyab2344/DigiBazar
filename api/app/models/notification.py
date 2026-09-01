import uuid
from datetime import datetime, timezone
from typing import Optional, List, Any
from sqlalchemy import String, Text, Enum as SQLEnum, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import UUID
from app.core.database import Base
from app.models.enums import NotificationTarget, NotificationStatus


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class NotificationRecord(Base):
    __tablename__ = "notification_records"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="info", nullable=False)
    target_type: Mapped[NotificationTarget] = mapped_column(
        SQLEnum(NotificationTarget, name="notificationtarget", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    target_ids: Mapped[Optional[List[Any]]] = mapped_column(JSON, default=list, nullable=True)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[NotificationStatus] = mapped_column(
        SQLEnum(NotificationStatus, name="notificationstatus", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=NotificationStatus.PENDING,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
