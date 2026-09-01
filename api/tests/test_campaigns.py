import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.company import Company
from app.models.influencer import Influencer, Campaign
from app.models.enums import UserRole, CompanyStatus, InfluencerStatus
from app.core.security import hash_password, create_access_token


@pytest.mark.asyncio
async def test_influencer_campaign_tracking_and_analytics(client: AsyncClient, db_session: AsyncSession):
    # Setup company
    owner = User(
        first_name="Camp", last_name="Owner", email="campowner@example.com",
        password_hash=hash_password("Pass123!"), role=UserRole.COMPANY, is_active=True
    )
    db_session.add(owner)
    await db_session.commit()

    company = Company(
        owner_id=owner.id, name="Campaign Store", slug="campaign-store",
        business_email="camp@store.com", phone="+1999999999", status=CompanyStatus.ACTIVE
    )
    db_session.add(company)
    await db_session.commit()

    # Setup Influencer user
    inf_user = User(
        first_name="Ali", last_name="Khan", email="alikhan@influencer.com",
        password_hash=hash_password("Pass123!"), role=UserRole.CUSTOMER, is_active=True
    )
    db_session.add(inf_user)
    await db_session.commit()

    influencer = Influencer(
        user_id=inf_user.id, platform="Instagram", handle="@alikhan_official",
        followers_count=150000, status=InfluencerStatus.APPROVED
    )
    db_session.add(influencer)
    await db_session.commit()

    token = create_access_token({"sub": str(owner.id), "user_id": str(owner.id), "role": "COMPANY"})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Influencer Campaign (15% discount, 5% commission)
    payload = {
        "influencer_id": str(influencer.id),
        "name": "Summer Tech Campaign",
        "description": "Ali Khan Summer Special Promo",
        "discount_type": "PERCENTAGE",
        "discount_value": 15,
        "scope": "STORE",
        "commission_type": "PERCENTAGE",
        "commission_value": 5,
        "coupon_code": "ALI15",
        "is_active": True,
    }
    c_res = await client.post("/api/v1/campaigns", json=payload, headers=headers)
    assert c_res.status_code == 201
    c_data = c_res.json()
    assert c_data["tracking_code"] == "ALI15"
    assert c_data["tracking_url"] == "/c/ALI15"

    # 2. Process tracking link click (/api/v1/c/ALI15)
    t_res = await client.get("/api/v1/c/ALI15")
    assert t_res.status_code == 200
    att_data = t_res.json()
    assert att_data["tracking_code"] == "ALI15"
    assert att_data["conversion_status"] == "ATTRIBUTED"

    # 3. Get campaign analytics
    a_res = await client.get(f"/api/v1/campaigns/{c_data['id']}/analytics", headers=headers)
    assert a_res.status_code == 200
    an_data = a_res.json()
    assert an_data["clicks"] == 1
    assert an_data["orders"] == 0
