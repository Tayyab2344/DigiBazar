import uuid
import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.company import Company
from app.models.product import Product
from app.models.category import Category
from app.models.enums import UserRole, CompanyStatus, ProductStatus, DiscountScope, DiscountType
from app.core.security import hash_password, create_access_token


@pytest.mark.asyncio
async def test_create_and_validate_store_coupon(client: AsyncClient, db_session: AsyncSession):
    # Setup company
    owner = User(
        first_name="Store", last_name="Owner", email="storeowner@example.com",
        password_hash=hash_password("Pass123!"), role=UserRole.COMPANY, is_active=True
    )
    db_session.add(owner)
    await db_session.commit()

    company = Company(
        owner_id=owner.id, name="Coupon Test Store", slug="coupon-test-store",
        business_email="coupon@store.com", phone="+1999999999", status=CompanyStatus.ACTIVE
    )
    db_session.add(company)
    await db_session.commit()

    token = create_access_token({"sub": str(owner.id), "user_id": str(owner.id), "role": "COMPANY"})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create STORE scoped coupon (15% off)
    payload = {
        "code": "SUMMER15",
        "name": "Summer 15% Off",
        "description": "Storewide summer sale",
        "discount_type": "PERCENTAGE",
        "discount_value": 15,
        "scope": "STORE",
        "minimum_order_amount": 100000,  # Rs 1,000.00
        "maximum_discount_amount": 500000,  # Rs 5,000.00 max
        "usage_limit": 100,
        "per_customer_limit": 2,
        "is_active": True,
    }
    res = await client.post("/api/v1/coupons", json=payload, headers=headers)
    assert res.status_code == 201
    coupon_data = res.json()
    assert coupon_data["code"] == "SUMMER15"
    assert coupon_data["scope"] == "STORE"

    # 2. Validate coupon code for cart
    val_payload = {
        "code": "summer15",  # case-insensitive check
        "company_id": str(company.id),
        "cart_items": [
            {
                "product_id": str(uuid.uuid4()),
                "company_id": str(company.id),
                "price": 200000,  # Rs 2,000.00
                "quantity": 1,
            }
        ],
        "order_subtotal": 200000,
    }
    val_res = await client.post("/api/v1/coupons/validate", json=val_payload)
    assert val_res.status_code == 200
    v_data = val_res.json()
    assert v_data["valid"] is True
    # 15% of 200000 = 30000 cents
    assert v_data["total_discount"] == 30000
    assert v_data["final_subtotal"] == 170000


@pytest.mark.asyncio
async def test_product_specific_coupon_eligibility(client: AsyncClient, db_session: AsyncSession):
    owner = User(
        first_name="Prod", last_name="Owner", email="prodowner@example.com",
        password_hash=hash_password("Pass123!"), role=UserRole.COMPANY, is_active=True
    )
    db_session.add(owner)
    await db_session.commit()

    company = Company(
        owner_id=owner.id, name="Prod Store", slug="prod-store",
        business_email="prod@store.com", phone="+1999999999", status=CompanyStatus.ACTIVE
    )
    db_session.add(company)
    await db_session.commit()

    # Create Product A & Product B
    prod_a = Product(name="Headphones", slug="headphones", company_id=company.id, price=10000, stock=50, status=ProductStatus.ACTIVE)
    prod_b = Product(name="Mouse", slug="mouse", company_id=company.id, price=5000, stock=50, status=ProductStatus.ACTIVE)
    db_session.add_all([prod_a, prod_b])
    await db_session.commit()

    token = create_access_token({"sub": str(owner.id), "user_id": str(owner.id), "role": "COMPANY"})
    headers = {"Authorization": f"Bearer {token}"}

    # Create Coupon ONLY for Product A (Rs 500 fixed off)
    c_payload = {
        "code": "AUDIO500",
        "name": "Headphones Rs 500 Off",
        "discount_type": "FIXED_AMOUNT",
        "discount_value": 50000,  # Rs 500.00
        "scope": "PRODUCTS",
        "product_ids": [str(prod_a.id)],
        "is_active": True,
    }
    c_res = await client.post("/api/v1/coupons", json=c_payload, headers=headers)
    assert c_res.status_code == 201

    # Cart with Product B (ineligible)
    val_ineligible = {
        "code": "AUDIO500",
        "company_id": str(company.id),
        "cart_items": [
            {
                "product_id": str(prod_b.id),
                "company_id": str(company.id),
                "price": 5000,
                "quantity": 1,
            }
        ],
        "order_subtotal": 5000,
    }
    res1 = await client.post("/api/v1/coupons/validate", json=val_ineligible)
    assert res1.status_code == 200
    assert res1.json()["valid"] is False

    # Cart with Product A (eligible)
    val_eligible = {
        "code": "AUDIO500",
        "company_id": str(company.id),
        "cart_items": [
            {
                "product_id": str(prod_a.id),
                "company_id": str(company.id),
                "price": 100000,
                "quantity": 1,
            }
        ],
        "order_subtotal": 100000,
    }
    res2 = await client.post("/api/v1/coupons/validate", json=val_eligible)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["valid"] is True
    assert data2["total_discount"] == 50000
