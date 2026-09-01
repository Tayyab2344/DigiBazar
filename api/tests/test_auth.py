import time
from datetime import timedelta
import pytest
from httpx import AsyncClient
from jose import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token
from app.models.enums import UserRole
from app.models.user import User


# Helper test payloads
def make_customer_payload(email="JANE.DOE@example.com"):
    return {
        "first_name": "Jane",
        "last_name": "Doe",
        "email": email,
        "phone": "+92 300 1234567",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "address": {
            "address_line_1": "123 Main St",
            "address_line_2": "Apt 4B",
            "city": "Lahore",
            "province": "Punjab",
            "postal_code": "54000",
            "country": "Pakistan",
            "landmark": "Near Mall Road",
        },
    }


def make_company_payload(business_email="VENDOR@acme.com", owner_email="owner@acme.com"):
    return {
        "business_name": "Acme Corp",
        "business_email": business_email,
        "business_phone": "+92 300 9876543",
        "business_logo": "https://example.com/logo.png",
        "website": "https://acme.com",
        "business_type": "Retail",
        "address": {
            "address_line_1": "456 Commerce Ave",
            "address_line_2": "Suite 100",
            "city": "Karachi",
            "province": "Sindh",
            "postal_code": "75500",
            "country": "Pakistan",
        },
        "owner": {
            "first_name": "Acme",
            "last_name": "Admin",
            "email": owner_email,
            "phone": "+92 300 1112223",
        },
        "password": "CompanyPassword123!",
        "confirm_password": "CompanyPassword123!",
    }


# ============================================================================
# CUSTOMER REGISTRATION TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_customer_registration_success(client: AsyncClient):
    payload = make_customer_payload("JANE.DOE@example.com")
    response = await client.post("/api/v1/auth/register/customer", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "Jane"
    assert data["last_name"] == "Doe"
    assert data["email"] == "jane.doe@example.com"  # Normalized
    assert data["role"] == "CUSTOMER"
    assert data["is_active"] is True
    assert data["is_verified"] is True
    assert "password_hash" not in data
    assert "password" not in data


@pytest.mark.asyncio
async def test_customer_registration_duplicate_email(client: AsyncClient):
    payload = make_customer_payload("alice@example.com")
    res1 = await client.post("/api/v1/auth/register/customer", json=payload)
    assert res1.status_code == 201

    # Try duplicate with different casing
    payload["email"] = "ALICE@EXAMPLE.COM"
    res2 = await client.post("/api/v1/auth/register/customer", json=payload)
    assert res2.status_code == 400
    assert "already registered" in res2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_customer_registration_invalid_email(client: AsyncClient):
    payload = make_customer_payload("invalid-email-string")
    response = await client.post("/api/v1/auth/register/customer", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_customer_registration_password_mismatch(client: AsyncClient):
    payload = make_customer_payload("bob@example.com")
    payload["confirm_password"] = "DifferentPassword123!"
    response = await client.post("/api/v1/auth/register/customer", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_customer_registration_weak_password(client: AsyncClient):
    payload = make_customer_payload("bob@example.com")
    payload["password"] = "short"
    payload["confirm_password"] = "short"
    response = await client.post("/api/v1/auth/register/customer", json=payload)
    assert response.status_code == 422


# ============================================================================
# COMPANY REGISTRATION TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_company_registration_success(client: AsyncClient):
    payload = make_company_payload("VENDOR@acme.com", "owner@acme.com")
    response = await client.post("/api/v1/auth/register/company", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "owner@acme.com"
    assert data["role"] == "COMPANY"
    assert data["phone"] == "+92 300 1112223"
    assert "password_hash" not in data


@pytest.mark.asyncio
async def test_company_registration_required_fields(client: AsyncClient):
    # Missing business_name
    payload = make_company_payload("vendor2@acme.com", "owner2@acme.com")
    del payload["business_name"]
    response = await client.post("/api/v1/auth/register/company", json=payload)
    assert response.status_code == 422


# ============================================================================
# LOGIN TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_login_customer_success(client: AsyncClient):
    reg_payload = make_customer_payload("loginuser@example.com")
    await client.post("/api/v1/auth/register/customer", json=reg_payload)

    login_payload = {
        "email": "LOGINUSER@example.com",
        "password": "Password123!",
    }
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "loginuser@example.com"
    assert data["user"]["role"] == "CUSTOMER"


@pytest.mark.asyncio
async def test_login_company_success(client: AsyncClient):
    reg_payload = make_company_payload("company@vendor.com", "owner@company.com")
    await client.post("/api/v1/auth/register/company", json=reg_payload)

    login_payload = {
        "email": "owner@company.com",
        "password": "CompanyPassword123!",
    }
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "COMPANY"


@pytest.mark.asyncio
async def test_login_super_admin_success(client: AsyncClient):
    login_payload = {
        "email": settings.SUPER_ADMIN_EMAIL,
        "password": settings.SUPER_ADMIN_PASSWORD,
    }
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "SUPER_ADMIN"


@pytest.mark.asyncio
async def test_login_incorrect_password(client: AsyncClient):
    login_payload = {
        "email": settings.SUPER_ADMIN_EMAIL,
        "password": "WrongPassword123!",
    }
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_email(client: AsyncClient):
    login_payload = {
        "email": "nonexistent@example.com",
        "password": "Password123!",
    }
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_inactive_account(client: AsyncClient, db_session: AsyncSession):
    reg_payload = make_customer_payload("inactive@example.com")
    await client.post("/api/v1/auth/register/customer", json=reg_payload)

    # Deactivate account in DB
    result = await db_session.execute(select(User).where(User.email == "inactive@example.com"))
    user = result.scalar_one()
    user.is_active = False
    db_session.add(user)
    await db_session.commit()

    login_payload = {
        "email": "inactive@example.com",
        "password": "Password123!",
    }
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 400
    assert "inactive" in response.json()["detail"].lower()


# ============================================================================
# JWT & ME ENDPOINT TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_jwt_valid_token_me_endpoint(client: AsyncClient):
    reg_payload = make_customer_payload("me@example.com")
    await client.post("/api/v1/auth/register/customer", json=reg_payload)

    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "me@example.com", "password": "Password123!"},
    )
    token = login_res.json()["access_token"]

    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@example.com"
    assert data["role"] == "CUSTOMER"


@pytest.mark.asyncio
async def test_jwt_missing_token(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_jwt_invalid_token(client: AsyncClient):
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.jwt.token"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_jwt_expired_token(client: AsyncClient):
    expired_token = create_access_token(
        {"user_id": "00000000-0000-0000-0000-000000000000", "role": "CUSTOMER"},
        expires_delta=timedelta(minutes=-10),
    )
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401


# ============================================================================
# AUTHORIZATION & ROLE TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_authorization_role_modification_prevention(client: AsyncClient):
    payload = make_customer_payload("attacker@example.com")
    payload["role"] = "SUPER_ADMIN"
    response = await client.post("/api/v1/auth/register/customer", json=payload)
    assert response.status_code == 201
    assert response.json()["role"] == "CUSTOMER"


# ============================================================================
# PASSWORD CHANGE AND RESET TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_change_password_success(client: AsyncClient):
    reg_payload = make_customer_payload("pwdchange@example.com")
    reg_payload["password"] = "OldPassword123!"
    reg_payload["confirm_password"] = "OldPassword123!"
    await client.post("/api/v1/auth/register/customer", json=reg_payload)

    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "pwdchange@example.com", "password": "OldPassword123!"},
    )
    token = login_res.json()["access_token"]

    change_payload = {
        "current_password": "OldPassword123!",
        "new_password": "NewPassword123!",
        "confirm_new_password": "NewPassword123!",
    }
    change_res = await client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json=change_payload,
    )
    assert change_res.status_code == 200

    # Old password fails
    old_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "pwdchange@example.com", "password": "OldPassword123!"},
    )
    assert old_login.status_code == 401

    # New password succeeds
    new_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "pwdchange@example.com", "password": "NewPassword123!"},
    )
    assert new_login.status_code == 200


@pytest.mark.asyncio
async def test_change_password_incorrect_current_password(client: AsyncClient):
    reg_payload = make_customer_payload("pwdchange2@example.com")
    reg_payload["password"] = "OldPassword123!"
    reg_payload["confirm_password"] = "OldPassword123!"
    await client.post("/api/v1/auth/register/customer", json=reg_payload)

    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "pwdchange2@example.com", "password": "OldPassword123!"},
    )
    token = login_res.json()["access_token"]

    change_payload = {
        "current_password": "WrongOldPassword123!",
        "new_password": "NewPassword123!",
        "confirm_new_password": "NewPassword123!",
    }
    change_res = await client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json=change_payload,
    )
    assert change_res.status_code == 400
    assert "incorrect" in change_res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_forgot_and_reset_password_flow(client: AsyncClient):
    reg_payload = make_customer_payload("reset@example.com")
    await client.post("/api/v1/auth/register/customer", json=reg_payload)

    # Forgot password
    forgot_res = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "RESET@example.com"},
    )
    assert forgot_res.status_code == 200
    reset_token = forgot_res.json().get("reset_token")
    assert reset_token is not None

    # Reset password
    reset_payload = {
        "reset_token": reset_token,
        "new_password": "BrandNewPassword123!",
        "confirm_new_password": "BrandNewPassword123!",
    }
    reset_res = await client.post("/api/v1/auth/reset-password", json=reset_payload)
    assert reset_res.status_code == 200

    # Login with new password
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "reset@example.com", "password": "BrandNewPassword123!"},
    )
    assert login_res.status_code == 200


# ============================================================================
# SECURITY ASSERTION TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_password_hash_never_returned(client: AsyncClient):
    payload = make_customer_payload("secuser@example.com")
    reg_res = await client.post("/api/v1/auth/register/customer", json=payload)
    assert "password_hash" not in reg_res.text

    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "secuser@example.com", "password": "Password123!"},
    )
    assert "password_hash" not in login_res.text

    token = login_res.json()["access_token"]
    me_res = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert "password_hash" not in me_res.text


@pytest.mark.asyncio
async def test_sensitive_info_not_in_jwt_claims(client: AsyncClient):
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": settings.SUPER_ADMIN_EMAIL, "password": settings.SUPER_ADMIN_PASSWORD},
    )
    token = login_res.json()["access_token"]
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])

    assert "password" not in payload
    assert "password_hash" not in payload
    assert "user_id" in payload
    assert "role" in payload
