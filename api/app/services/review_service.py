import uuid
from typing import Optional
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.review import Review
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.models.enums import OrderStatus
from app.schemas.review_schemas import CreateReviewRequest, ReviewEligibilityResponse


class ReviewService:

    @staticmethod
    async def check_eligibility(
        db: AsyncSession, customer: User, product_id: uuid.UUID
    ) -> ReviewEligibilityResponse:
        # 1. Check if user has an existing review for this product
        existing_rev_res = await db.execute(
            select(Review).where(
                and_(
                    Review.product_id == product_id,
                    Review.customer_id == customer.id,
                )
            )
        )
        existing_review = existing_rev_res.scalar_one_or_none()

        # 2. Query delivered orders for this customer
        orders_res = await db.execute(
            select(Order).where(
                and_(
                    Order.customer_id == customer.id,
                    Order.order_status == OrderStatus.DELIVERED,
                )
            )
        )
        delivered_orders = orders_res.scalars().all()

        target_product_id_str = str(product_id)
        has_delivered_order = False
        for order in delivered_orders:
            if order.items:
                for item in order.items:
                    if item.get("product_id") == target_product_id_str:
                        has_delivered_order = True
                        break
            if has_delivered_order:
                break

        if not has_delivered_order:
            return ReviewEligibilityResponse(
                can_review=False,
                reason="Only customers who have purchased and received this product (Delivered Order) can submit a review.",
                has_reviewed=bool(existing_review),
                existing_rating=existing_review.rating if existing_review else None,
                existing_comment=existing_review.comment if existing_review else None,
            )

        return ReviewEligibilityResponse(
            can_review=True,
            reason=None,
            has_reviewed=bool(existing_review),
            existing_rating=existing_review.rating if existing_review else None,
            existing_comment=existing_review.comment if existing_review else None,
        )

    @staticmethod
    async def create_review(
        db: AsyncSession, customer: User, payload: CreateReviewRequest
    ) -> Review:
        # 1. Validate Product exists
        prod_res = await db.execute(select(Product).where(Product.id == payload.product_id))
        product = prod_res.scalar_one_or_none()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found.",
            )

        # 2. Check delivered orders for this customer & product
        orders_res = await db.execute(
            select(Order).where(
                and_(
                    Order.customer_id == customer.id,
                    Order.order_status == OrderStatus.DELIVERED,
                )
            )
        )
        delivered_orders = orders_res.scalars().all()

        matching_order: Optional[Order] = None
        target_product_id_str = str(payload.product_id)
        for order in delivered_orders:
            if order.items:
                for item in order.items:
                    if item.get("product_id") == target_product_id_str:
                        matching_order = order
                        break
            if matching_order:
                break

        if not matching_order:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only customers who have purchased and received this product (Delivered Order) can submit a review.",
            )

        # 3. Check if review already exists
        rev_res = await db.execute(
            select(Review).where(
                and_(
                    Review.product_id == payload.product_id,
                    Review.customer_id == customer.id,
                )
            )
        )
        existing_review = rev_res.scalar_one_or_none()

        if existing_review:
            existing_review.rating = payload.rating
            existing_review.comment = payload.comment
            review = existing_review
        else:
            review = Review(
                product_id=payload.product_id,
                company_id=matching_order.company_id,
                customer_id=customer.id,
                rating=payload.rating,
                comment=payload.comment,
                is_verified_purchase=True,
                is_hidden=False,
            )
            db.add(review)

        await db.flush()

        # 4. Recalculate average rating and review_count on Product
        stats_res = await db.execute(
            select(
                func.coalesce(func.avg(Review.rating), 0.0).label("avg_rating"),
                func.count(Review.id).label("total_reviews"),
            ).where(
                and_(
                    Review.product_id == payload.product_id,
                    Review.is_hidden == False,
                )
            )
        )
        stats = stats_res.one()
        product.rating = float(stats.avg_rating)
        product.review_count = int(stats.total_reviews)

        await db.commit()
        await db.refresh(review)
        return review
