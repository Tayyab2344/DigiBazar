import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.deps.auth import get_current_user
from app.models.user import User
from app.schemas.review_schemas import (
    CreateReviewRequest,
    ReviewRead,
    ReviewEligibilityResponse,
)
from app.services.review_service import ReviewService

router = APIRouter(prefix="/api/v1/reviews", tags=["Customer Reviews"])


@router.post("", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
async def submit_review(
    payload: CreateReviewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit or update a product review.
    Enforces strict verified purchase check: customer must have a DELIVERED order containing this product.
    """
    return await ReviewService.create_review(db, current_user, payload)


@router.get("/eligibility/{product_id}", response_model=ReviewEligibilityResponse)
async def check_review_eligibility(
    product_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Check if current logged-in customer is eligible to write a review for a specific product.
    """
    return await ReviewService.check_eligibility(db, current_user, product_id)
