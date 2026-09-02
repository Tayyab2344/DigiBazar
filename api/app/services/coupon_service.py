import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.coupon import Coupon, CouponProduct, CouponCategory, CouponUsage
from app.models.product import Product
from app.models.category import Category
from app.models.enums import DiscountType, DiscountScope
from app.schemas.coupon_schemas import (
    CouponCreateRequest,
    CouponUpdateRequest,
    CouponResponse,
    CouponValidationRequest,
    CouponValidationResponse,
    ItemDiscountBreakdown,
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class CouponService:

    @staticmethod
    async def create_coupon(
        db: AsyncSession, company_id: Optional[uuid.UUID], payload: CouponCreateRequest, is_platform: bool = False
    ) -> CouponResponse:
        normalized_code = payload.code.strip().upper()

        # Check for code uniqueness
        existing = await db.execute(select(Coupon).where(Coupon.code == normalized_code))
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Coupon code '{normalized_code}' already exists.",
            )

        # Validate product ownership if PRODUCTS scope
        product_ids = payload.product_ids or []
        if payload.scope == DiscountScope.PRODUCTS and product_ids:
            if company_id:
                p_res = await db.execute(
                    select(Product.id).where(
                        and_(Product.id.in_(product_ids), Product.company_id == company_id)
                    )
                )
                valid_p_ids = set(p_res.scalars().all())
                if len(valid_p_ids) != len(product_ids):
                    raise HTTPException(
                        status_code=status.HTTP,
                        detail="Selected products must belong to your store catalog.",
                    )

        # Validate category ownership if CATEGORIES scope
        category_ids = payload.category_ids or []
        if payload.scope == DiscountScope.CATEGORIES and category_ids:
            if company_id:
                c_res = await db.execute(
                    select(Category.id).where(
                        and_(
                            Category.id.in_(category_ids),
                            or_(Category.company_id == None, Category.company_id == company_id),
                        )
                    )
                )
                valid_c_ids = set(c_res.scalars().all())
                if len(valid_c_ids) != len(category_ids):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Selected categories must be marketplace or store categories available to your store.",
                    )

        coupon = Coupon(
            company_id=company_id if not is_platform else None,
            code=normalized_code,
            name=payload.name,
            description=payload.description,
            discount_type=payload.discount_type,
            discount_value=payload.discount_value,
            scope=payload.scope,
            minimum_order_amount=payload.minimum_order_amount,
            maximum_discount_amount=payload.maximum_discount_amount,
            usage_limit=payload.usage_limit,
            per_customer_limit=payload.per_customer_limit,
            start_date=payload.start_date,
            end_date=payload.end_date,
            is_active=payload.is_active,
            is_platform=is_platform,
        )
        db.add(coupon)
        await db.flush()

        # Attach products
        for pid in product_ids:
            db.add(CouponProduct(coupon_id=coupon.id, product_id=pid))

        # Attach categories
        for cid in category_ids:
            db.add(CouponCategory(coupon_id=coupon.id, category_id=cid))

        await db.commit()
        await db.refresh(coupon)

        return await CouponService._build_response(db, coupon)

    @staticmethod
    async def get_coupon(db: AsyncSession, coupon_id: uuid.UUID) -> CouponResponse:
        res = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
        coupon = res.scalar_one_or_none()
        if not coupon:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found.")
        return await CouponService._build_response(db, coupon)

    @staticmethod
    async def list_coupons(
        db: AsyncSession, company_id: Optional[uuid.UUID] = None, is_super_admin: bool = False
    ) -> List[CouponResponse]:
        stmt = select(Coupon)
        if not is_super_admin:
            if company_id:
                stmt = stmt.where(or_(Coupon.company_id == company_id, Coupon.is_platform == True))
            else:
                stmt = stmt.where(Coupon.is_platform == True)
        stmt = stmt.order_by(Coupon.created_at.desc())

        res = await db.execute(stmt)
        coupons = res.scalars().all()
        return [await CouponService._build_response(db, c) for c in coupons]

    @staticmethod
    async def update_coupon(
        db: AsyncSession,
        coupon_id: uuid.UUID,
        payload: CouponUpdateRequest,
        company_id: Optional[uuid.UUID] = None,
        is_super_admin: bool = False,
    ) -> CouponResponse:
        res = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
        coupon = res.scalar_one_or_none()
        if not coupon:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found.")

        if not is_super_admin and coupon.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify this coupon.",
            )

        data = payload.model_dump(exclude_unset=True)
        product_ids = data.pop("product_ids", None)
        category_ids = data.pop("category_ids", None)

        for key, value in data.items():
            if value is not None:
                setattr(coupon, key, value)

        if product_ids is not None:
            await db.execute(select(CouponProduct).where(CouponProduct.coupon_id == coupon.id))
            # Delete existing
            await db.execute(
                CouponProduct.__table__.delete().where(CouponProduct.coupon_id == coupon.id)
            )
            for pid in product_ids:
                db.add(CouponProduct(coupon_id=coupon.id, product_id=pid))

        if category_ids is not None:
            await db.execute(
                CouponCategory.__table__.delete().where(CouponCategory.coupon_id == coupon.id)
            )
            for cid in category_ids:
                db.add(CouponCategory(coupon_id=coupon.id, category_id=cid))

        await db.commit()
        await db.refresh(coupon)
        return await CouponService._build_response(db, coupon)

    @staticmethod
    async def delete_coupon(
        db: AsyncSession, coupon_id: uuid.UUID, company_id: Optional[uuid.UUID] = None, is_super_admin: bool = False
    ) -> bool:
        res = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
        coupon = res.scalar_one_or_none()
        if not coupon:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found.")

        if not is_super_admin and coupon.company_id != company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this coupon.",
            )

        await db.delete(coupon)
        await db.commit()
        return True

    @staticmethod
    async def set_active_status(
        db: AsyncSession, coupon_id: uuid.UUID, is_active: bool, company_id: Optional[uuid.UUID] = None, is_super_admin: bool = False
    ) -> CouponResponse:
        return await CouponService.update_coupon(
            db, coupon_id, CouponUpdateRequest(is_active=is_active), company_id, is_super_admin
        )

    @staticmethod
    async def validate_coupon(
        db: AsyncSession, payload: CouponValidationRequest, customer_id: Optional[uuid.UUID] = None
    ) -> CouponValidationResponse:
        normalized_code = payload.code.strip().upper()
        res = await db.execute(select(Coupon).where(Coupon.code == normalized_code))
        coupon = res.scalar_one_or_none()

        if not coupon or not coupon.is_active:
            return CouponValidationResponse(
                valid=False,
                message="Invalid or inactive coupon code.",
                code=normalized_code,
            )

        now = utc_now()
        if coupon.start_date and now < coupon.start_date:
            return CouponValidationResponse(
                valid=False,
                message="Coupon code is not active yet.",
                code=normalized_code,
            )
        if coupon.end_date and now > coupon.end_date:
            return CouponValidationResponse(
                valid=False,
                message="Coupon code has expired.",
                code=normalized_code,
            )

        if coupon.usage_limit > 0 and coupon.usage_count >= coupon.usage_limit:
            return CouponValidationResponse(
                valid=False,
                message="Coupon total usage limit has been reached.",
                code=normalized_code,
            )

        if customer_id and coupon.per_customer_limit > 0:
            c_count_res = await db.execute(
                select(func.count(CouponUsage.id)).where(
                    and_(CouponUsage.coupon_id == coupon.id, CouponUsage.user_id == customer_id)
                )
            )
            user_usages = c_count_res.scalar_one() or 0
            if user_usages >= coupon.per_customer_limit:
                return CouponValidationResponse(
                    valid=False,
                    message="You have reached the usage limit for this coupon code.",
                    code=normalized_code,
                )

        # Company ownership check
        if coupon.company_id and payload.company_id and coupon.company_id != payload.company_id:
            return CouponValidationResponse(
                valid=False,
                message="Coupon is not valid for this store.",
                code=normalized_code,
            )

        # Fetch product and category IDs attached to coupon
        p_res = await db.execute(select(CouponProduct.product_id).where(CouponProduct.coupon_id == coupon.id))
        coupon_product_ids = set(p_res.scalars().all())

        cat_res = await db.execute(select(CouponCategory.category_id).where(CouponCategory.coupon_id == coupon.id))
        coupon_category_ids = set(cat_res.scalars().all())

        # Evaluate cart item eligibility
        eligible_subtotal = 0
        item_breakdowns: List[ItemDiscountBreakdown] = []
        has_company_mismatch = False

        for item in payload.cart_items:
            # Check company match
            if coupon.company_id and item.company_id != coupon.company_id:
                has_company_mismatch = True
                item_breakdowns.append(
                    ItemDiscountBreakdown(
                        product_id=item.product_id,
                        original_price=item.price,
                        quantity=item.quantity,
                        eligible=False,
                        discount_amount=0,
                    )
                )
                continue

            is_eligible = False
            if coupon.scope == DiscountScope.STORE:
                is_eligible = True
            elif coupon.scope == DiscountScope.PRODUCTS:
                is_eligible = item.product_id in coupon_product_ids
            elif coupon.scope == DiscountScope.CATEGORIES:
                is_eligible = item.category_id in coupon_category_ids if item.category_id else False

            item_total = item.price * item.quantity
            if is_eligible:
                eligible_subtotal += item_total

            item_breakdowns.append(
                ItemDiscountBreakdown(
                    product_id=item.product_id,
                    original_price=item.price,
                    quantity=item.quantity,
                    eligible=is_eligible,
                    discount_amount=0,
                )
            )

        if eligible_subtotal <= 0:
            if has_company_mismatch:
                msg = "This coupon code belongs to a different store and cannot be applied to items in your cart."
            elif coupon.scope == DiscountScope.PRODUCTS:
                msg = "No items in your cart match the specific products eligible for this coupon."
            elif coupon.scope == DiscountScope.CATEGORIES:
                msg = "No items in your cart match the specific categories eligible for this coupon."
            else:
                msg = "No items in your cart are eligible for this coupon code."

            return CouponValidationResponse(
                valid=False,
                message=msg,
                code=normalized_code,
                item_breakdown=item_breakdowns,
            )

        if coupon.minimum_order_amount > 0 and eligible_subtotal < coupon.minimum_order_amount:
            min_rs = coupon.minimum_order_amount / 100
            return CouponValidationResponse(
                valid=False,
                message=f"Minimum order subtotal of Rs {min_rs:.2f} is required for this coupon.",
                code=normalized_code,
                item_breakdown=item_breakdowns,
            )

        # Calculate discount
        is_capped = False
        if coupon.discount_type == DiscountType.PERCENTAGE:
            calc_discount = (eligible_subtotal * coupon.discount_value) // 100
        else:  # FIXED or FIXED_AMOUNT
            calc_discount = min(coupon.discount_value, eligible_subtotal)

        if coupon.maximum_discount_amount > 0 and calc_discount > coupon.maximum_discount_amount:
            calc_discount = coupon.maximum_discount_amount
            is_capped = True

        calc_discount = max(0, min(calc_discount, eligible_subtotal))

        # Distribute discount proportionally across eligible items
        remaining_discount = calc_discount
        for i, item_b in enumerate(item_breakdowns):
            if item_b.eligible and eligible_subtotal > 0:
                item_total = item_b.original_price * item_b.quantity
                if i == len(item_breakdowns) - 1:
                    item_b.discount_amount = remaining_discount
                else:
                    item_d = (calc_discount * item_total) // eligible_subtotal
                    item_b.discount_amount = item_d
                    remaining_discount -= item_d

        final_subtotal = max(0, payload.order_subtotal - calc_discount)

        if is_capped:
            msg = f"Coupon applied! (Discount capped at maximum limit of Rs. {coupon.maximum_discount_amount / 100:.0f})"
        else:
            msg = "Coupon applied successfully."

        return CouponValidationResponse(
            valid=True,
            message=msg,
            coupon_id=coupon.id,
            code=coupon.code,
            discount_type=coupon.discount_type,
            discount_value=coupon.discount_value,
            scope=coupon.scope,
            total_discount=calc_discount,
            final_subtotal=final_subtotal,
            is_capped=is_capped,
            max_discount_cap=coupon.maximum_discount_amount if is_capped else None,
            item_breakdown=item_breakdowns,
        )

    @staticmethod
    async def record_coupon_usage(
        db: AsyncSession, coupon_id: uuid.UUID, user_id: uuid.UUID, order_id: uuid.UUID, discount_amount: int
    ) -> None:
        res = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
        coupon = res.scalar_one_or_none()
        if coupon:
            coupon.usage_count += 1
            usage = CouponUsage(
                coupon_id=coupon.id,
                user_id=user_id,
                order_id=order_id,
                discount_amount=discount_amount,
            )
            db.add(usage)
            await db.flush()

    @staticmethod
    async def _build_response(db: AsyncSession, coupon: Coupon) -> CouponResponse:
        p_res = await db.execute(select(CouponProduct.product_id).where(CouponProduct.coupon_id == coupon.id))
        product_ids = list(p_res.scalars().all())

        c_res = await db.execute(select(CouponCategory.category_id).where(CouponCategory.coupon_id == coupon.id))
        category_ids = list(c_res.scalars().all())

        return CouponResponse(
            id=coupon.id,
            company_id=coupon.company_id,
            campaign_id=coupon.campaign_id,
            code=coupon.code,
            name=coupon.name,
            description=coupon.description,
            discount_type=coupon.discount_type,
            discount_value=coupon.discount_value,
            scope=coupon.scope,
            minimum_order_amount=coupon.minimum_order_amount,
            maximum_discount_amount=coupon.maximum_discount_amount,
            usage_limit=coupon.usage_limit,
            usage_count=coupon.usage_count,
            per_customer_limit=coupon.per_customer_limit,
            start_date=coupon.start_date,
            end_date=coupon.end_date,
            is_active=coupon.is_active,
            is_platform=coupon.is_platform,
            created_at=coupon.created_at,
            updated_at=coupon.updated_at,
            product_ids=product_ids,
            category_ids=category_ids,
        )
