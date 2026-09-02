import pytest
from httpx import AsyncClient
from fastapi import status


@pytest.mark.asyncio
async def test_enhanced_product_creation_and_publishing(
    async_client: AsyncClient, company_headers: dict
):
    # 1. Fetch Categories
    cat_resp = await async_client.get("/api/v1/company/categories", headers=company_headers)
    assert cat_resp.status_code == status.HTTP_200_OK

    # 2. Generate slug & SKU
    slug_resp = await async_client.post(
        "/api/v1/company/products/generate-slug",
        json={"name": "Apple AirPods Pro 3"},
        headers=company_headers,
    )
    assert slug_resp.status_code == status.HTTP_200_OK
    assert "apple-airpods-pro-3-" in slug_resp.json()["slug"]

    sku_resp = await async_client.post(
        "/api/v1/company/products/generate-sku",
        json={"name": "Apple AirPods Pro 3"},
        headers=company_headers,
    )
    assert sku_resp.status_code == status.HTTP_200_OK
    assert "DB-APPLE-AIRPODS-PRO-" in sku_resp.json()["sku"]

    # 3. Create Draft Product
    draft_resp = await async_client.post(
        "/api/v1/company/products/draft",
        json={"name": "Draft Wireless Earbuds", "price": 19900},
        headers=company_headers,
    )
    assert draft_resp.status_code == status.HTTP_201_CREATED
    draft_data = draft_resp.json()
    assert draft_data["status"] == "draft"

    # 4. AI Content Assistance
    ai_resp = await async_client.post(
        "/api/v1/company/products/ai-assist",
        json={
            "product_name": "Apple AirPods Pro 3",
            "category_name": "Headphones",
            "content_type": "seo_title",
        },
        headers=company_headers,
    )
    assert ai_resp.status_code == status.HTTP_200_OK
    assert "DigiBazar" in ai_resp.json()["generated_text"]

    # 5. Submit Category Request
    req_resp = await async_client.post(
        "/api/v1/company/category-requests",
        json={
            "name": "Spatial Audio Wearables",
            "description": "Next-gen audio gear category",
            "reason": "Expanding catalog",
        },
        headers=company_headers,
    )
    assert req_resp.status_code == status.HTTP_201_CREATED
    assert req_resp.json()["status"] == "PENDING"


@pytest.mark.asyncio
async def test_image_upload_blob_and_content_type_fallback(
    async_client: AsyncClient, company_headers: dict
):
    # Upload image with blob filename but valid jpeg content-type
    files = {"file": ("blob", b"fake_image_bytes", "image/jpeg")}
    res = await async_client.post("/api/v1/upload/image", files=files, headers=company_headers)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert "url" in data
    assert "public_id" in data


@pytest.mark.asyncio
async def test_enhanced_product_creation_with_tags_and_invalid_category(
    async_client: AsyncClient, company_headers: dict
):
    payload = {
        "name": "Test Wireless Headphones",
        "price": 12000,
        "category_id": "00000000-0000-0000-0000-000000000000",  # Non-existent category
        "tags": ["audio", "bluetooth", "wireless"],
        "description": "High quality audio headphones",
    }
    res = await async_client.post("/api/v1/company/products/enhanced", json=payload, headers=company_headers)
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    assert data["name"] == "Test Wireless Headphones"
    assert "audio" in data["tags"]


@pytest.mark.asyncio
async def test_enhanced_product_creation_with_long_data_url(
    async_client: AsyncClient, company_headers: dict
):
    # Simulate a ~35KB base64 Data URL (which previously caused StringDataRightTruncationError)
    long_data_url = "data:image/jfif;base64," + ("A" * 35000)
    payload = {
        "name": "Test Product with Base64 Image",
        "price": 2500,
        "description": "Product testing long data URL storage in database",
        "images": [
            {
                "url": long_data_url,
                "alt_text": "Base64 Image Test",
                "sort_order": 0,
                "is_primary": True,
            }
        ],
    }
    res = await async_client.post("/api/v1/company/products/enhanced", json=payload, headers=company_headers)
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()
    assert data["name"] == "Test Product with Base64 Image"
    assert len(data["images"]) == 1
    assert data["images"][0]["url"].startswith("data:image/jfif;base64,")


