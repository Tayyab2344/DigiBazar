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
