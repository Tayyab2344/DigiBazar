import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class CreateReviewRequest(BaseModel):
    product_id: uuid.UUID
    rating: int = Field(..., ge=1, le=5, description="Star rating from 1 to 5")
    comment: Optional[str] = Field(None, max_length=1000, description="Optional customer review text")


class ReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    company_id: uuid.UUID
    customer_id: uuid.UUID
    rating: int
    comment: Optional[str] = None
    is_verified_purchase: bool = True
    created_at: datetime


class ReviewEligibilityResponse(BaseModel):
    can_review: bool
    reason: Optional[str] = None
    has_reviewed: bool = False
    existing_rating: Optional[int] = None
    existing_comment: Optional[str] = None
