import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.company import Company
from app.models.category import Category
from app.models.product import Product
from app.models.order import Order
from app.models.payment import Payment
from app.models.enums import (
    UserRole,
    BusinessType,
    CompanyStatus,
    ProductStatus,
    OrderStatus,
    PaymentStatus,
)
from app.core.security import create_access_token, get_password_hash


@pytest.mark.asyncio
async def test_unauthenticated_admin_access_fails(client: AsyncClient):
    response = await client.get("/api/v1/admin/dashboard")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


@pytest.mark.asyncio
async def test_customer_admin_access_forbidden(client: AsyncClient, db_session: AsyncSession):
    # Create customer user
    customer = User(
        email="cust_test@example.com",
        password_hash=get_password_hash("password123"),
        first_name="Test",
        last_name="Customer",
        role=UserRole.CUSTOMER,
        is_active=True,
        is_verified=True,
    )
    db_session.add(customer)
    await db_session.commit()
    await db_session.refresh(customer)

    token = create_access_token({"sub": str(customer.id), "role": customer.role.value})
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.get("/api/v1/admin/dashboard", headers=headers)
    assert response.status_code == 403
    assert "is not authorized" in response.json()["detail"]


@pytest.mark.asyncio
async def test_super_admin_dashboard_success(client: AsyncClient, db_session: AsyncSession):
    # Create super admin user
    super_admin = User(
        email="admin_test@example.com",
        password_hash=get_password_hash("password123"),
        first_name="Super",
        last_name="Admin",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
        is_verified=True,
    )
    db_session.add(super_admin)
    await db_session.commit()
    await db_session.refresh(super_admin)

    token = create_access_token({"sub": str(super_admin.id), "role": super_admin.role.value})
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.get("/api/v1/admin/dashboard", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_customers" in data
    assert "total_companies" in data
    assert "total_revenue" in data
    assert "recent_orders" in data


@pytest.mark.asyncio
async def test_company_moderation_flow(client: AsyncClient, db_session: AsyncSession):
    # Create super admin
    admin = User(
        email="admin_mod@example.com",
        password_hash=get_password_hash("password123"),
        first_name="Admin",
        last_name="Mod",
        role=UserRole.SUPER_ADMIN,
    )
    db_session.add(admin)
    await db_session.flush()

    # Create company owner
    owner = User(
        email="owner_mod@example.com",
        password_hash=get_password_hash("password123"),
        first_name="Owner",
        last_name="Vendor",
        role=UserRole.COMPANY,
    )
    db_session.add(owner)
    await db_session.flush()

    company = Company(
        owner_id=owner.id,
        name="Test Vendor Hub",
        slug="test-vendor-hub",
        business_email="vendor@test.com",
        phone="+1234567890",
        business_type=BusinessType.RETAIL,
        status=CompanyStatus.PENDING,
    )
    db_session.add(company)
    await db_session.commit()
    await db_session.refresh(company)

    token = create_access_token({"sub": str(admin.id), "role": admin.role.value})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Approve company
    resp = await client.post(f"/api/v1/admin/companies/{company.id}/approve", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "active"

    # 2. Suspend company
    resp = await client.post(f"/api/v1/admin/companies/{company.id}/suspend", headers=headers, json={"reason": "Policy violation"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "suspended"

    # 3. Block company
    resp = await client.post(f"/api/v1/admin/companies/{company.id}/block", headers=headers, json={"reason": "Fraudulent activities"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "blocked"

    # 4. Activate company back
    resp = await client.post(f"/api/v1/admin/companies/{company.id}/activate", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "active"


@pytest.mark.asyncio
async def test_category_crud_flow(client: AsyncClient, db_session: AsyncSession):
    admin = User(
        email="admin_cat@example.com",
        password_hash=get_password_hash("password123"),
        first_name="Admin",
        last_name="Cat",
        role=UserRole.SUPER_ADMIN,
    )
    db_session.add(admin)
    await db_session.commit()

    token = create_access_token({"sub": str(admin.id), "role": admin.role.value})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Category
    cat_payload = {
        "name": "Electronics",
        "slug": "electronics",
        "description": "Gadgets and tech",
        "is_active": True,
        "sort_order": 1,
    }
    resp = await client.post("/api/v1/admin/categories", headers=headers, json=cat_payload)
    assert resp.status_code == 200
    cat_id = resp.json()["id"]
    assert resp.json()["name"] == "Electronics"

    # 2. List Categories
    resp = await client.get("/api/v1/admin/categories", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

    # 3. Delete Category
    resp = await client.delete(f"/api/v1/admin/categories/{cat_id}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["message"] == "Category deleted successfully"


@pytest.mark.asyncio
async def test_refund_limit_enforcement(client: AsyncClient, db_session: AsyncSession):
    admin = User(
        email="admin_ref@example.com",
        password_hash=get_password_hash("password123"),
        first_name="Admin",
        last_name="Ref",
        role=UserRole.SUPER_ADMIN,
    )
    cust = User(
        email="cust_ref@example.com",
        password_hash=get_password_hash("password123"),
        first_name="Cust",
        last_name="Ref",
        role=UserRole.CUSTOMER,
    )
    comp_owner = User(
        email="comp_ref_owner@example.com",
        password_hash=get_password_hash("password123"),
        first_name="Comp",
        last_name="Owner",
        role=UserRole.COMPANY,
    )
    db_session.add_all([admin, cust, comp_owner])
    await db_session.flush()

    company = Company(
        owner_id=comp_owner.id,
        name="Refund Store",
        slug="refund-store",
        business_email="refund@store.com",
        phone="+111222333",
        business_type=BusinessType.RETAIL,
        status=CompanyStatus.ACTIVE,
    )
    db_session.add(company)
    await db_session.flush()

    order = Order(
        customer_id=cust.id,
        company_id=company.id,
        subtotal=5000,
        discount=0,
        shipping=500,
        tax=0,
        total=5500,
        payment_status=PaymentStatus.PAID,
        order_status=OrderStatus.DELIVERED,
    )
    db_session.add(order)
    await db_session.flush()

    payment = Payment(
        order_id=order.id,
        customer_id=cust.id,
        company_id=company.id,
        amount=5500,
        status=PaymentStatus.PAID,
    )
    db_session.add(payment)
    await db_session.commit()

    token = create_access_token({"sub": str(admin.id), "role": admin.role.value})
    headers = {"Authorization": f"Bearer {token}"}

    # Invalid refund exceeding total (e.g. 10,000 cents)
    resp = await client.post(
        f"/api/v1/admin/orders/{order.id}/refund",
        headers=headers,
        json={"amount": 10000, "reason": "Excessive amount"},
    )
    assert resp.status_code == 400
    assert "Invalid refund amount" in resp.json()["detail"]

    # Valid full refund (5,500 cents)
    resp = await client.post(
        f"/api/v1/admin/orders/{order.id}/refund",
        headers=headers,
        json={"amount": 5500, "reason": "Defective item returned"},
    )
    assert resp.status_code == 200
    assert resp.json()["amount"] == 5500
