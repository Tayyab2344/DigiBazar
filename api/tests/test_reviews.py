import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.enums import UserRole, CompanyStatus, ProductStatus, OrderStatus, PaymentStatus
from app.models.user import User
from app.models.company import Company
from app.models.product import Product
from app.models.order import Order
from app.core.security import hash_password, create_access_token


@pytest.mark.asyncio
async def test_verified_purchase_review_enforcement(client: AsyncClient, db_session: AsyncSession):
    """
    TEST VERIFIED REVIEW ENFORCEMENT:
    1. Unpurchased customer attempt to review fails with 403.
    2. Pending order customer attempt to review fails with 403.
    3. Delivered order customer attempt to review succeeds (201) and updates product rating.
    """
    # 1. Create Customer User
    customer = User(
        first_name="Reviewer",
        last_name="Customer",
        email="reviewer@example.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.CUSTOMER,
        is_active=True,
    )
    # Vendor Owner
    owner = User(
        first_name="Vendor",
        last_name="Store",
        email="vendor_rev@example.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.COMPANY,
        is_active=True,
    )
    db_session.add_all([customer, owner])
    await db_session.commit()

    company = Company(
        owner_id=owner.id,
        name="Review Store",
        slug="review-store",
        business_email="rev@example.com",
        phone="+1234567",
        status=CompanyStatus.ACTIVE,
    )
    db_session.add(company)
    await db_session.commit()

    product = Product(
        company_id=company.id,
        name="Reviewed Gadget",
        slug="reviewed-gadget",
        price=10000,
        stock=10,
        status=ProductStatus.ACTIVE,
        rating=0.0,
        review_count=0,
    )
    db_session.add(product)
    await db_session.commit()

    token = create_access_token({"sub": str(customer.id), "user_id": str(customer.id), "role": "CUSTOMER"})
    headers = {"Authorization": f"Bearer {token}"}

    # STEP A: Unpurchased customer tries to review -> Expect 403
    resp = await client.post(
        "/api/v1/reviews",
        json={"product_id": str(product.id), "rating": 5, "comment": "Great!"},
        headers=headers,
    )
    assert resp.status_code == 403
    assert "Delivered Order" in resp.json()["detail"]

    # STEP B: Customer places order, status is PENDING -> Expect 403
    pending_order = Order(
        customer_id=customer.id,
        company_id=company.id,
        items=[{
            "product_id": str(product.id),
            "product_name": product.name,
            "qty": 1,
            "unit_price_cents": 10000,
            "total_cents": 10000,
        }],
        subtotal=10000,
        discount=0,
        shipping=0,
        tax=0,
        total=10000,
        payment_status=PaymentStatus.PENDING,
        order_status=OrderStatus.PENDING,
    )
    db_session.add(pending_order)
    await db_session.commit()

    resp_pending = await client.post(
        "/api/v1/reviews",
        json={"product_id": str(product.id), "rating": 5, "comment": "Pending review"},
        headers=headers,
    )
    assert resp_pending.status_code == 403

    # STEP C: Update order status to DELIVERED -> Expect 201 Created
    pending_order.order_status = OrderStatus.DELIVERED
    await db_session.commit()

    resp_delivered = await client.post(
        "/api/v1/reviews",
        json={"product_id": str(product.id), "rating": 5, "comment": "Outstanding product! Fully delivered."},
        headers=headers,
    )
    assert resp_delivered.status_code == 201
    rev_data = resp_delivered.json()
    assert rev_data["rating"] == 5
    assert rev_data["is_verified_purchase"] is True

    # STEP D: Verify product rating & review_count updated in DB
    prod_refreshed = await db_session.get(Product, product.id)
    assert prod_refreshed.rating == 5.0
    assert prod_refreshed.review_count == 1

    # STEP E: Verify eligibility endpoint returns can_review=True, has_reviewed=True
    elig_resp = await client.get(f"/api/v1/reviews/eligibility/{product.id}", headers=headers)
    assert elig_resp.status_code == 200
    elig_data = elig_resp.json()
    assert elig_data["can_review"] is True
    assert elig_data["has_reviewed"] is True
