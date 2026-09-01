import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.company import Company
from app.models.product import Product
from app.models.enums import UserRole, CompanyStatus, ProductStatus
from app.core.security import hash_password, create_access_token


@pytest.mark.asyncio
async def test_cross_tenant_coupon_isolation(client: AsyncClient, db_session: AsyncSession):
    # Setup Company A & Company B
    owner_a = User(
        first_name="Vendor", last_name="A", email="vendora@example.com",
        password_hash=hash_password("Pass123!"), role=UserRole.COMPANY, is_active=True
    )
    owner_b = User(
        first_name="Vendor", last_name="B", email="vendorb@example.com",
        password_hash=hash_password("Pass123!"), role=UserRole.COMPANY, is_active=True
    )
    db_session.add_all([owner_a, owner_b])
    await db_session.commit()

    comp_a = Company(owner_id=owner_a.id, name="Company A", slug="company-a", business_email="a@store.com", phone="+1999999999", status=CompanyStatus.ACTIVE)
    comp_b = Company(owner_id=owner_b.id, name="Company B", slug="company-b", business_email="b@store.com", phone="+1999999999", status=CompanyStatus.ACTIVE)
    db_session.add_all([comp_a, comp_b])
    await db_session.commit()

    token_a = create_access_token({"sub": str(owner_a.id), "user_id": str(owner_a.id), "role": "COMPANY"})
    token_b = create_access_token({"sub": str(owner_b.id), "user_id": str(owner_b.id), "role": "COMPANY"})
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Company A creates coupon A
    res_a = await client.post("/api/v1/coupons", json={
        "code": "STOREA10", "name": "Company A 10% Off", "discount_type": "PERCENTAGE",
        "discount_value": 10, "scope": "STORE", "is_active": True
    }, headers=headers_a)
    assert res_a.status_code == 201
    coupon_a = res_a.json()

    # Company B attempts to delete Company A's coupon -> MUST return 403 Forbidden
    del_res = await client.delete(f"/api/v1/coupons/{coupon_a['id']}", headers=headers_b)
    assert del_res.status_code == 403

    # Company B attempts to modify Company A's coupon -> MUST return 403 Forbidden
    mod_res = await client.patch(f"/api/v1/coupons/{coupon_a['id']}", json={"name": "Hacked Name"}, headers=headers_b)
    assert mod_res.status_code == 403

    # Validate coupon A against Company B's store -> MUST fail with not valid message
    val_res = await client.post("/api/v1/coupons/validate", json={
        "code": "STOREA10",
        "company_id": str(comp_b.id),
        "cart_items": [{
            "product_id": str(uuid.uuid4()),
            "company_id": str(comp_b.id),
            "price": 10000,
            "quantity": 1
        }],
        "order_subtotal": 10000
    })
    assert val_res.status_code == 200
    assert val_res.json()["valid"] is False
    assert "not valid for this store" in val_res.json()["message"]
