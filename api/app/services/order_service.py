import uuid
from typing import List, Dict
from collections import defaultdict
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.order import Order, OrderStatusHistory
from app.models.payment import Payment
from app.models.product import Product
from app.models.inventory_movement import InventoryMovement
from app.models.user import User
from app.models.enums import OrderStatus, PaymentStatus, InventoryMovementType
from app.core.config import settings
from app.schemas.order_schemas import CheckoutRequest, CheckoutResponse


class OrderService:

    @staticmethod
    async def create_checkout_orders(
        db: AsyncSession, customer: User, payload: CheckoutRequest
    ) -> CheckoutResponse:
        if not payload.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Checkout items list cannot be empty.",
            )

        # 1. Group checkout items by company_id
        company_items_map: Dict[uuid.UUID, List] = defaultdict(list)
        for item in payload.items:
            company_items_map[item.company_id].append(item)

        created_order_ids: List[str] = []
        overall_total = 0

        # Shipping cost allocation
        shipping_per_order = 25000 if payload.shipping_method == "express" else 0

        from app.services.coupon_service import CouponService
        from app.services.campaign_service import CampaignService
        from app.schemas.coupon_schemas import CouponValidationRequest, CartItemValidation

        for company_id, items in company_items_map.items():
            subtotal = 0
            order_items_json = []

            for item in items:
                # Validate product exists
                res = await db.execute(
                    select(Product).where(and_(Product.id == item.product_id, Product.company_id == company_id))
                )
                product = res.scalar_one_or_none()
                if not product:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Product '{item.name}' not found for vendor company.",
                    )

                item_total = item.price * item.quantity
                subtotal += item_total

                order_items_json.append({
                    "id": str(uuid.uuid4()),
                    "product_id": str(item.product_id),
                    "product_name": item.name,
                    "qty": item.quantity,
                    "unit_price_cents": item.price,
                    "discount_cents": 0,
                    "total_cents": item_total,
                    "image": item.image,
                    "variant_id": str(item.variant_id) if item.variant_id else None,
                })

                # Deduct inventory stock if tracking
                if product.track_inventory:
                    if product.stock <= 0:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Product '{product.name}' is currently out of stock.",
                        )
                    if product.stock < item.quantity:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Only {product.stock} unit(s) available for product '{product.name}' (Requested: {item.quantity}).",
                        )
                    prev_stock = product.stock
                    new_stock = prev_stock - item.quantity
                    product.stock = new_stock

                    # Inventory Audit Log
                    movement = InventoryMovement(
                        company_id=company_id,
                        product_id=product.id,
                        variant_id=item.variant_id,
                        movement_type=InventoryMovementType.SALE,
                        quantity=-item.quantity,
                        previous_stock=prev_stock,
                        new_stock=new_stock,
                        reason="Checkout Order Purchase",
                    )
                    db.add(movement)

            # Evaluate Coupon Discount if coupon_code supplied
            order_discount = 0
            validated_coupon_id = None
            if payload.coupon_code:
                cart_validations = [
                    CartItemValidation(
                        product_id=it.product_id,
                        company_id=it.company_id,
                        category_id=getattr(it, "category_id", None),
                        price=it.price,
                        quantity=it.quantity,
                    )
                    for it in items
                ]
                val_req = CouponValidationRequest(
                    code=payload.coupon_code,
                    company_id=company_id,
                    cart_items=cart_validations,
                    order_subtotal=subtotal,
                )
                val_res = await CouponService.validate_coupon(db, val_req, customer_id=customer.id)
                if val_res.valid:
                    order_discount = val_res.total_discount
                    validated_coupon_id = val_res.coupon_id

            total = max(0, subtotal - order_discount + shipping_per_order)
            overall_total += total

            # Payment status & Stripe reference
            is_card = payload.payment_method == "card"
            pay_status = PaymentStatus.PAID if is_card else PaymentStatus.PENDING
            stripe_ref = f"pi_stripe_{uuid.uuid4().hex[:16]}" if is_card else f"PAY-{uuid.uuid4().hex[:8].upper()}"

            # Create Order entity
            order = Order(
                customer_id=customer.id,
                company_id=company_id,
                items=order_items_json,
                subtotal=subtotal,
                discount=order_discount,
                shipping=shipping_per_order,
                tax=0,
                total=total,
                payment_status=pay_status,
                order_status=OrderStatus.PENDING,
                payment_reference=stripe_ref,
            )
            db.add(order)
            await db.flush()

            # If order is PAID, record coupon usage & campaign conversion
            if pay_status == PaymentStatus.PAID:
                if validated_coupon_id:
                    await CouponService.record_coupon_usage(
                        db, coupon_id=validated_coupon_id, user_id=customer.id, order_id=order.id, discount_amount=order_discount
                    )
                await CampaignService.record_conversion(
                    db, order=order, session_id=payload.session_id, customer_id=customer.id
                )

            # Create Payment record if card payment
            if is_card:
                payment = Payment(
                    order_id=order.id,
                    customer_id=customer.id,
                    company_id=company_id,
                    amount=total,
                    currency="PKR",
                    stripe_payment_reference=stripe_ref,
                    status=PaymentStatus.PAID,
                )
                db.add(payment)

            # Record Status History
            history = OrderStatusHistory(
                order_id=order.id,
                previous_status=OrderStatus.PENDING,
                new_status=OrderStatus.PENDING,
                changed_by=customer.id,
                reason="Order Placed by Customer",
            )
            db.add(history)

            created_order_ids.append(str(order.id))

        await db.commit()

        return CheckoutResponse(
            order_ids=created_order_ids,
            total_amount=overall_total,
            message="Checkout orders successfully created.",
        )

    @staticmethod
    async def get_customer_orders(db: AsyncSession, customer: User) -> List[CustomerOrderRead]:
        from app.models.company import Company
        from app.schemas.order_schemas import CustomerOrderRead

        stmt = (
            select(Order, Company.name.label("company_name"))
            .outerjoin(Company, Order.company_id == Company.id)
            .where(Order.customer_id == customer.id)
            .order_by(Order.created_at.desc())
        )
        res = await db.execute(stmt)
        rows = res.all()

        results = []
        for order, company_name in rows:
            dto = CustomerOrderRead(
                id=order.id,
                company_id=order.company_id,
                company_name=company_name or "Vendor Store",
                items=order.items or [],
                subtotal=order.subtotal,
                discount=order.discount,
                shipping=order.shipping,
                tax=order.tax,
                total=order.total,
                payment_status=order.payment_status.value if hasattr(order.payment_status, "value") else str(order.payment_status),
                order_status=order.order_status.value if hasattr(order.order_status, "value") else str(order.order_status),
                payment_reference=order.payment_reference,
                created_at=order.created_at,
                updated_at=order.updated_at,
            )
            results.append(dto)
        return results
