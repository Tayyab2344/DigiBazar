import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import UserRole, CompanyStatus, ProductStatus
from app.models.user import User
from app.models.company import Company
from app.models.product import Product
from app.core.security import hash_password, create_access_token


@pytest.mark.asyncio
async def test_checkout_order_creation_and_vendor_isolation(client: AsyncClient, db_session: AsyncSession):
    """
    TEST MULTI-VENDOR ORDER CHECKOUT & ISOLATION:
    1. Customer creates an order during checkout.
    2. Backend creates Order entity scoped to Company A.
    3. Company A can see the order on /company/orders.
    4. Company B cannot see Company A's order.
    """
    # Customer
    customer = User(
        first_name="Order",
        last_name="Buyer",
        email="buyer@example.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.CUSTOMER,
        is_active=True,
    )
    # Owner A
    owner_a = User(
        first_name="Vendor",
        last_name="Alpha",
        email="vendor_a@example.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.COMPANY,
        is_active=True,
    )
    # Owner B
    owner_b = User(
        first_name="Vendor",
        last_name="Beta",
        email="vendor_b@example.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.COMPANY,
        is_active=True,
    )
    db_session.add_all([customer, owner_a, owner_b])
    await db_session.commit()

    company_a = Company(
        owner_id=owner_a.id,
        name="Company Alpha",
        slug="comp-alpha",
        business_email="alpha@example.com",
        phone="+123456789",
        status=CompanyStatus.ACTIVE,
    )
    company_b = Company(
        owner_id=owner_b.id,
        name="Company Beta",
        slug="comp-beta",
        business_email="beta@example.com",
        phone="+987654321",
        status=CompanyStatus.ACTIVE,
    )
    db_session.add_all([company_a, company_b])
    await db_session.commit()

    product_a = Product(
        company_id=company_a.id,
        name="Alpha Wireless Speaker",
        slug="alpha-speaker",
        price=5000,
        stock=10,
        status=ProductStatus.ACTIVE,
    )
    db_session.add(product_a)
    await db_session.commit()

    token_customer = create_access_token({"sub": str(customer.id), "user_id": str(customer.id), "role": "CUSTOMER"})
    token_vendor_a = create_access_token({"sub": str(owner_a.id), "user_id": str(owner_a.id), "role": "COMPANY"})
    token_vendor_b = create_access_token({"sub": str(owner_b.id), "user_id": str(owner_b.id), "role": "COMPANY"})

    # 1. Customer submits checkout
    checkout_payload = {
        "shipping_address": {
            "full_name": "Order Buyer",
            "phone": "+92 300 1234567",
            "address": "123 Main Street",
            "city": "Lahore",
            "postal_code": "54000",
        },
        "payment_method": "cod",
        "shipping_method": "standard",
        "items": [
            {
                "product_id": str(product_a.id),
                "company_id": str(company_a.id),
                "name": "Alpha Wireless Speaker",
                "price": 5000,
                "quantity": 2,
            }
        ],
    }

    res = await client.post(
        "/api/v1/orders/checkout",
        json=checkout_payload,
        headers={"Authorization": f"Bearer {token_customer}"},
    )
    assert res.status_code == 201
    data = res.json()
    assert len(data["order_ids"]) == 1
    assert data["total_amount"] == 10000

    # 2. Company A lists orders -> sees the order
    res_a = await client.get(
        "/api/v1/company/orders",
        headers={"Authorization": f"Bearer {token_vendor_a}"},
    )
    assert res_a.status_code == 200
    orders_a = res_a.json()["items"]
    assert len(orders_a) == 1
    assert orders_a[0]["total"] == 10000

    # 3. Company B lists orders -> 0 orders (tenant isolation)
    res_b = await client.get(
        "/api/v1/company/orders",
        headers={"Authorization": f"Bearer {token_vendor_b}"},
    )
    assert res_b.status_code == 200
    orders_b = res_b.json()["items"]
    assert len(orders_b) == 0

    # 4. Customer submits Stripe Card checkout
    card_checkout_payload = {
        "shipping_address": {
            "full_name": "Order Buyer",
            "phone": "+92 300 1234567",
            "address": "123 Main Street",
            "city": "Lahore",
            "postal_code": "54000",
        },
        "payment_method": "card",
        "shipping_method": "express",
        "items": [
            {
                "product_id": str(product_a.id),
                "company_id": str(company_a.id),
                "name": "Alpha Wireless Speaker",
                "price": 5000,
                "quantity": 1,
            }
        ],
    }

    res_card = await client.post(
        "/api/v1/orders/checkout",
        json=card_checkout_payload,
        headers={"Authorization": f"Bearer {token_customer}"},
    )
    assert res_card.status_code == 201
    data_card = res_card.json()
    assert len(data_card["order_ids"]) == 1
    order_id = data_card["order_ids"][0]
    assert data_card["total_amount"] == 30000

    # 5. Company A fetches single order details -> 200 OK
    res_detail_a = await client.get(
        f"/api/v1/company/orders/{order_id}",
        headers={"Authorization": f"Bearer {token_vendor_a}"},
    )
    assert res_detail_a.status_code == 200
    assert res_detail_a.json()["id"] == order_id
    assert res_detail_a.json()["total"] == 30000

    # 6. Company B fetches Company A's order -> 404 Not Found (tenant isolation)
    res_detail_b = await client.get(
        f"/api/v1/company/orders/{order_id}",
        headers={"Authorization": f"Bearer {token_vendor_b}"},
    )
    assert res_detail_b.status_code == 404

    # 7. Company A updates order status to 'confirmed'
    res_status = await client.patch(
        f"/api/v1/company/orders/{order_id}/status",
        json={"status": "confirmed", "notes": "Order confirmed by vendor"},
        headers={"Authorization": f"Bearer {token_vendor_a}"},
    )
    assert res_status.status_code == 200
    assert res_status.json()["order_status"] == "confirmed"

    # 8. Customer fetches my-orders -> sees active order with status 'confirmed'
    res_my_orders = await client.get(
        "/api/v1/orders/my-orders",
        headers={"Authorization": f"Bearer {token_customer}"},
    )
    assert res_my_orders.status_code == 200
    my_orders = res_my_orders.json()
    assert len(my_orders) == 2
    # 9. Company A fetches customers -> customer appears in directory
    res_company_cust = await client.get(
        "/api/v1/company/customers",
        headers={"Authorization": f"Bearer {token_vendor_a}"},
    )
    assert res_company_cust.status_code == 200
    cust_list = res_company_cust.json()
    assert len(cust_list) == 1
    assert cust_list[0]["orders_count"] == 2
    assert cust_list[0]["total_spent"] == 40000
    assert cust_list[0]["email"] == "buyer@example.com"

