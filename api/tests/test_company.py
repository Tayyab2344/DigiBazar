import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import UserRole, CompanyStatus, ProductStatus, OrderStatus
from app.models.user import User
from app.models.company import Company
from app.models.product import Product
from app.models.coupon import Coupon
from app.core.security import hash_password, create_access_token


@pytest.mark.asyncio
async def test_company_isolation_and_authorization(client: AsyncClient, db_session: AsyncSession):
    """
    STRICT MULTI-TENANT ISOLATION TEST:
    Proves Company A cannot access Company B resources,
    and Customer cannot access company APIs.
    """
    # Create Customer User
    customer = User(
        first_name="John",
        last_name="Customer",
        email="customer@example.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.CUSTOMER,
        is_active=True,
    )
    
    # Create Company Owner A & Company A
    owner_a = User(
        first_name="Owner",
        last_name="CompanyA",
        email="ownera@example.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.COMPANY,
        is_active=True,
    )
    db_session.add_all([customer, owner_a])
    await db_session.commit()
    await db_session.refresh(owner_a)

    company_a = Company(
        owner_id=owner_a.id,
        name="Company A",
        slug="company-a",
        business_email="a@company.com",
        phone="+1234567890",
        status=CompanyStatus.ACTIVE,
    )

    # Create Company Owner B & Company B
    owner_b = User(
        first_name="Owner",
        last_name="CompanyB",
        email="ownerb@example.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.COMPANY,
        is_active=True,
    )
    db_session.add(company_a)
    db_session.add(owner_b)
    await db_session.commit()
    await db_session.refresh(owner_b)

    company_b = Company(
        owner_id=owner_b.id,
        name="Company B",
        slug="company-b",
        business_email="b@company.com",
        phone="+1987654321",
        status=CompanyStatus.ACTIVE,
    )
    db_session.add(company_b)
    await db_session.commit()
    await db_session.refresh(company_b)

    # Product belonging to Company B
    product_b = Product(
        company_id=company_b.id,
        name="Company B Exclusive Widget",
        slug="comp-b-widget",
        price=1999,  # integer cents
        stock=10,
        status=ProductStatus.ACTIVE,
    )
    db_session.add(product_b)
    await db_session.commit()
    await db_session.refresh(product_b)

    # Generate JWT tokens
    token_customer = create_access_token({"sub": str(customer.id), "user_id": str(customer.id), "role": "CUSTOMER"})
    token_a = create_access_token({"sub": str(owner_a.id), "user_id": str(owner_a.id), "role": "COMPANY"})
    token_b = create_access_token({"sub": str(owner_b.id), "user_id": str(owner_b.id), "role": "COMPANY"})

    # 1. Customer Attempt -> 403 Forbidden
    res = await client.get("/api/v1/company/profile", headers={"Authorization": f"Bearer {token_customer}"})
    assert res.status_code == 403

    # 2. Company A Profile -> Gets Company A
    res = await client.get("/api/v1/company/profile", headers={"Authorization": f"Bearer {token_a}"})
    assert res.status_code == 200
    assert res.json()["name"] == "Company A"

    # 3. Company A tries to get Company B's product -> 404 Not Found (Tenant Scoped)
    res = await client.get(f"/api/v1/company/products/{product_b.id}", headers={"Authorization": f"Bearer {token_a}"})
    assert res.status_code == 404

    # 4. Company A tries to update Company B's product -> 404 Not Found
    res = await client.patch(
        f"/api/v1/company/products/{product_b.id}",
        json={"name": "Hacked Name"},
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res.status_code == 404

    # 5. Company B accesses own product -> 200 OK
    res = await client.get(f"/api/v1/company/products/{product_b.id}", headers={"Authorization": f"Bearer {token_b}"})
    assert res.status_code == 200
    assert res.json()["name"] == "Company B Exclusive Widget"


@pytest.mark.asyncio
async def test_company_product_crud_and_inventory(client: AsyncClient, db_session: AsyncSession):
    """Test product creation, stock updates, integer-cents pricing, and inventory audit logs."""
    owner = User(
        first_name="Seller",
        last_name="One",
        email="seller1@example.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.COMPANY,
        is_active=True,
    )
    db_session.add(owner)
    await db_session.commit()
    await db_session.refresh(owner)

    company = Company(
        owner_id=owner.id,
        name="Storefront One",
        slug="storefront-one",
        business_email="store1@example.com",
        phone="+1111111111",
        status=CompanyStatus.ACTIVE,
    )
    db_session.add(company)
    await db_session.commit()

    token = create_access_token({"sub": str(owner.id), "user_id": str(owner.id), "role": "COMPANY"})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Product
    res = await client.post(
        "/api/v1/company/products",
        json={
            "name": "Wireless Mechanical Keyboard",
            "price": 12999,  # $129.99 in integer cents
            "stock": 25,
        },
        headers=headers,
    )
    assert res.status_code == 201
    prod = res.json()
    prod_id = prod["id"]
    assert prod["price"] == 12999
    assert prod["stock"] == 25

    # 2. Update Inventory Stock
    res = await client.patch(
        f"/api/v1/company/inventory/{prod_id}",
        json={"product_id": prod_id, "stock": 40, "reason": "Restocked 15 units"},
        headers=headers,
    )
    assert res.status_code == 200
    assert res.json()["stock"] == 40

    # 3. Check Inventory Movements Audit Log
    res = await client.get("/api/v1/company/inventory/movements", headers=headers)
    assert res.status_code == 200
    movements = res.json()["items"]
    assert len(movements) >= 2  # initial creation + stock adjustment


@pytest.mark.asyncio
async def test_company_coupons_and_dashboard(client: AsyncClient, db_session: AsyncSession):
    """Test coupon creation, uniqueness, and dashboard metrics aggregation."""
    owner = User(
        first_name="Coupon",
        last_name="Seller",
        email="couponseller@example.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.COMPANY,
        is_active=True,
    )
    db_session.add(owner)
    await db_session.commit()

    company = Company(
        owner_id=owner.id,
        name="Coupon Company",
        slug="coupon-company",
        business_email="cc@example.com",
        phone="+2222222222",
        status=CompanyStatus.ACTIVE,
    )
    db_session.add(company)
    await db_session.commit()

    token = create_access_token({"sub": str(owner.id), "user_id": str(owner.id), "role": "COMPANY"})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Coupon
    res = await client.post(
        "/api/v1/company/coupons",
        json={
            "code": "VENDOR20",
            "discount_type": "percentage",
            "discount_value": 20,
            "minimum_order": 5000,
        },
        headers=headers,
    )
    assert res.status_code == 201
    assert res.json()["code"] == "VENDOR20"

    # 2. Attempt Duplicate Coupon Code -> 409 Conflict
    res = await client.post(
        "/api/v1/company/coupons",
        json={
            "code": "VENDOR20",
            "discount_type": "fixed",
            "discount_value": 500,
        },
        headers=headers,
    )
    assert res.status_code == 409

    # 3. Get Company Dashboard Stats
    res = await client.get("/api/v1/company/dashboard", headers=headers)
    assert res.status_code == 200
    stats = res.json()
    assert "gross_revenue" in stats
    assert "platform_commission" in stats


@pytest.mark.asyncio
async def test_delete_company_product(client: AsyncClient, db_session: AsyncSession):
    """
    Test deleting owned product and cross-tenant guard when attempting to delete another company's product.
    """
    owner_a = User(
        first_name="Owner",
        last_name="DelA",
        email="del_a@example.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.COMPANY,
        is_active=True,
    )
    owner_b = User(
        first_name="Owner",
        last_name="DelB",
        email="del_b@example.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.COMPANY,
        is_active=True,
    )
    db_session.add_all([owner_a, owner_b])
    await db_session.commit()

    company_a = Company(
        owner_id=owner_a.id,
        name="Company Del A",
        slug="comp-del-a",
        business_email="dela@example.com",
        phone="+1234567890",
        status=CompanyStatus.ACTIVE,
    )
    company_b = Company(
        owner_id=owner_b.id,
        name="Company Del B",
        slug="comp-del-b",
        business_email="delb@example.com",
        phone="+1987654321",
        status=CompanyStatus.ACTIVE,
    )

    db_session.add_all([company_a, company_b])
    await db_session.commit()

    product_a = Product(
        company_id=company_a.id,
        name="Product A",
        slug="prod-a-delete",
        price=1000,
        stock=5,
        status=ProductStatus.ACTIVE,
    )
    db_session.add(product_a)
    await db_session.commit()

    token_a = create_access_token({"sub": str(owner_a.id), "user_id": str(owner_a.id), "role": "COMPANY"})
    token_b = create_access_token({"sub": str(owner_b.id), "user_id": str(owner_b.id), "role": "COMPANY"})

    # 1. Company B attempts to delete Company A's product -> 404 Not Found (Cross-tenant guard)
    res_b = await client.delete(f"/api/v1/company/products/{product_a.id}", headers={"Authorization": f"Bearer {token_b}"})
    assert res_b.status_code == 404

    # 2. Company A deletes its own product -> 200 OK
    res_a = await client.delete(f"/api/v1/company/products/{product_a.id}", headers={"Authorization": f"Bearer {token_a}"})
    assert res_a.status_code == 200
    assert res_a.json()["message"] == "Product deleted successfully"

