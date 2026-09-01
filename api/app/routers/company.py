import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.deps.company import get_current_company_scope, get_current_company_optional
from app.models.company import Company
from app.models.category import Category
from app.schemas.admin import CategoryCreate
from app.schemas.company import (
    CompanyProfileRead,
    CompanyProfileUpdate,
    CompanyDashboardStats,
    CompanyProductCreate,
    CompanyProductUpdate,
    CompanyProductRead,
    InventoryUpdate,
    InventoryMovementRead,
    CompanyOrderRead,
    CompanyOrderStatusUpdate,
    CompanyCustomerRead,
    CompanyCouponCreate,
    CompanyCouponRead,
    CompanyCampaignCreate,
    CompanyCampaignRead,
    CompanyReviewRead,
    CompanySettingsRead,
    CompanySettingsUpdate,
    CompanyPaginatedResponse,
)
from app.schemas.product_schemas import (
    CategoryRead,
    CategoryCreate,
    CategoryUpdate,
    CategoryRequestCreate,
    CategoryRequestRead,
    ProductCreate,
    ProductUpdate,
    ProductDraftCreate,
    EnhancedCompanyProductRead,
    AIContentRequest,
    AIContentResponse,
)
from app.services.company_service import CompanyService

router = APIRouter(prefix="/api/v1/company", tags=["company"])


# ===========================================
# COMPANY PROFILE
# ===========================================

@router.get("/profile", response_model=CompanyProfileRead)
async def get_company_profile(
    company: Company = Depends(get_current_company_scope),
):
    """Return the authenticated company profile."""
    return company


@router.put("/profile", response_model=CompanyProfileRead)
@router.patch("/profile", response_model=CompanyProfileRead)
async def update_company_profile(
    data: CompanyProfileUpdate,
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """Update the authenticated company profile."""
    updated = await CompanyService.update_profile(db, company, data)
    return updated


# ===========================================
# CATEGORIES & CATEGORY REQUESTS
# ===========================================

@router.get("/categories", response_model=List[CategoryRead])
async def list_company_categories(
    search: Optional[str] = Query(None),
    company: Optional[Company] = Depends(get_current_company_optional),
    db: AsyncSession = Depends(get_db),
):
    """Fetch global marketplace active category tree + company specific categories."""
    company_id = company.id if company else None
    categories = await CompanyService.list_categories_tree(db, company_id=company_id, search=search)
    return categories


@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_company_category(
    payload: CategoryCreate,
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """Allow vendor/company to create a marketplace category directly for their company."""
    # Ensure unique slug
    base_slug = payload.slug or payload.name.lower().replace(" ", "-")
    unique_slug = f"{base_slug}-{str(company.id)[:8]}"

    category = Category(
        name=payload.name,
        slug=unique_slug,
        description=payload.description,
        image_url=payload.image_url,
        parent_id=payload.parent_id,
        company_id=company.id,
        is_active=payload.is_active,
        sort_order=payload.sort_order,
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)

    # Return validated CategoryRead
    return CategoryRead(
        id=category.id,
        name=category.name,
        slug=category.slug,
        description=category.description,
        image_url=category.image_url,
        parent_id=category.parent_id,
        company_id=category.company_id,
        is_active=category.is_active,
        sort_order=category.sort_order,
        children=[],
    )


@router.put("/categories/{category_id}", response_model=CategoryRead)
async def update_company_category(
    category_id: uuid.UUID,
    payload: CategoryUpdate,
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """Update a category belonging to this store."""
    return await CompanyService.update_store_category(
        db, company, category_id, payload.model_dump(exclude_unset=True)
    )


@router.delete("/categories/{category_id}")
async def delete_company_category(
    category_id: uuid.UUID,
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """Delete a store-owned category if no products are assigned."""
    await CompanyService.delete_store_category(db, company, category_id)
    return {"message": "Store category deleted successfully"}


@router.get("/categories/{category_id}/products", response_model=CompanyPaginatedResponse[EnhancedCompanyProductRead])
async def list_company_category_products(
    category_id: uuid.UUID,
    search: Optional[str] = Query(None),
    status: Optional[ProductStatus] = Query(None),
    sort_by: Optional[str] = Query("created_at_desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """List products in a category assigned for this store."""
    result = await CompanyService.list_company_products(
        db=db,
        company=company,
        search=search,
        status=status,
        category_id=category_id,
        sort_by=sort_by,
        page=page,
        page_size=page_size,
    )
    return result


@router.post("/category-requests", response_model=CategoryRequestRead, status_code=status.HTTP_201_CREATED)
async def create_category_request(
    data: CategoryRequestCreate,
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """Submit a request for a new marketplace category."""
    req = await CompanyService.create_category_request(db, company, data)
    return req


@router.get("/category-requests", response_model=List[CategoryRequestRead])
async def list_company_category_requests(
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """List category requests submitted by this company."""
    requests = await CompanyService.list_category_requests(db, company.id)
    return requests


# ===========================================
# DASHBOARD METRICS
# ===========================================

@router.get("/dashboard", response_model=CompanyDashboardStats)
async def get_company_dashboard_stats(
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """Return operational KPIs and metrics for the vendor dashboard."""
    stats_data = await CompanyService.get_dashboard_stats(db, company)
    return stats_data


# ===========================================
# ENHANCED PRODUCT CREATION & MANAGEMENT
# ===========================================

@router.post("/products/enhanced", response_model=EnhancedCompanyProductRead, status_code=status.HTTP_201_CREATED)
async def create_enhanced_product(
    data: ProductCreate,
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """Create a new product with full nested sub-entities, pricing & SKU generation."""
    product = await CompanyService.create_enhanced_product(db, company, data)
    return product


@router.post("/products/draft", response_model=EnhancedCompanyProductRead, status_code=status.HTTP_201_CREATED)
async def save_product_draft(
    data: ProductDraftCreate,
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """Save an incomplete product draft without strict publish validation."""
    draft = await CompanyService.create_product_draft(db, company, data)
    return draft


@router.get("/products/{product_id}/enhanced", response_model=EnhancedCompanyProductRead)
async def get_enhanced_product(
    product_id: uuid.UUID,
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """Fetch complete product structure including variants, images, attributes, SEO, and tags."""
    product = await CompanyService.get_enhanced_product(db, company, product_id)
    return product


@router.put("/products/{product_id}/enhanced", response_model=EnhancedCompanyProductRead)
async def update_enhanced_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """Update product details and re-sync child entities."""
    product = await CompanyService.update_enhanced_product(db, company, product_id, data)
    return product


@router.post("/products/{product_id}/publish", response_model=EnhancedCompanyProductRead)
async def publish_product(
    product_id: uuid.UUID,
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """Validate all required publishing rules server-side and set status to ACTIVE."""
    published = await CompanyService.validate_and_publish_product(db, company, product_id)
    return published


@router.post("/products/generate-slug")
async def generate_product_slug(
    payload: Dict[str, str],
    db: AsyncSession = Depends(get_db),
):
    """Generate a unique human-readable slug string from a product name."""
    name = payload.get("name", "product")
    slug = await CompanyService.generate_unique_slug(db, name)
    return {"slug": slug}


@router.post("/products/generate-sku")
async def generate_product_sku(
    payload: Dict[str, str],
    db: AsyncSession = Depends(get_db),
):
    """Generate an automatic unique SKU string from a product name."""
    name = payload.get("name", "item")
    sku = await CompanyService.generate_unique_sku(db, name)
    return {"sku": sku}


@router.post("/products/ai-assist", response_model=AIContentResponse)
async def generate_ai_content_assistant(
    data: AIContentRequest,
):
    """Generate AI text content for product description, SEO title, meta description, or tags."""
    content = await CompanyService.generate_ai_content(data)
    return content


# ===========================================
# LEGACY PRODUCTS COMPATIBILITY
# ===========================================

@router.get("/products", response_model=CompanyPaginatedResponse[CompanyProductRead])
async def list_company_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """List products owned by this company."""
    items, total = await CompanyService.list_products(db, company, page=page, page_size=page_size, search=search)
    return CompanyPaginatedResponse(
        items=[CompanyProductRead.model_validate(p) for p in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/products", response_model=CompanyProductRead, status_code=status.HTTP_201_CREATED)
async def create_company_product(
    data: CompanyProductCreate,
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """Legacy product creation."""
    product = await CompanyService.create_product(db, company, data)
    return CompanyProductRead.model_validate(product)


@router.get("/products/{product_id}", response_model=CompanyProductRead)
async def get_company_product(
    product_id: uuid.UUID,
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """Get single product detail."""
    product = await CompanyService.get_product(db, company, product_id)
    return CompanyProductRead.model_validate(product)


@router.patch("/products/{product_id}", response_model=CompanyProductRead)
async def update_company_product(
    product_id: uuid.UUID,
    data: CompanyProductUpdate,
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """Update existing product."""
    product = await CompanyService.update_product(db, company, product_id, data)
    return CompanyProductRead.model_validate(product)


@router.delete("/products/{product_id}")
async def delete_company_product(
    product_id: uuid.UUID,
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """Delete a product owned by the authenticated company."""
    await CompanyService.delete_product(db, company, product_id)
    return {"message": "Product deleted successfully"}



# ===========================================
# INVENTORY
# ===========================================

@router.get("/inventory/movements", response_model=CompanyPaginatedResponse[InventoryMovementRead])
async def list_inventory_movements(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """List inventory audit movement log."""
    movements = await CompanyService.list_inventory_movements(db, company)
    return CompanyPaginatedResponse(
        items=[InventoryMovementRead.model_validate(m) for m in movements],
        total=len(movements),
        page=page,
        page_size=page_size,
    )


@router.patch("/inventory/{product_id}", response_model=CompanyProductRead)
async def update_inventory(
    product_id: uuid.UUID,
    data: InventoryUpdate,
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """Adjust product stock quantity with audit logging."""
    existing_product = await CompanyService.get_product(db, company, product_id)
    qty = getattr(data, "quantity_change", None)
    if qty is None:
        qty = data.stock - existing_product.stock
    product = await CompanyService.update_inventory(db, company, product_id, qty, data.reason or "Stock Audit Adjustment")
    return CompanyProductRead.model_validate(product)


# ===========================================
# ORDERS
# ===========================================

@router.get("/orders", response_model=CompanyPaginatedResponse[CompanyOrderRead])
async def list_company_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None),
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """List orders containing products from this company."""
    items, total = await CompanyService.list_orders(db, company, page=page, page_size=page_size)
    return CompanyPaginatedResponse(
        items=[CompanyOrderRead.model_validate(o) for o in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/orders/{order_id}", response_model=CompanyOrderRead)
async def get_company_order(
    order_id: uuid.UUID,
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve single order details for this vendor company."""
    order = await CompanyService.get_order(db, company, order_id)
    return CompanyOrderRead.model_validate(order)


@router.patch("/orders/{order_id}/status", response_model=CompanyOrderRead)
async def update_order_status(
    order_id: uuid.UUID,
    data: CompanyOrderStatusUpdate,
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """Update order fulfillment status."""
    order = await CompanyService.update_order_status(db, company, order_id, data)
    return CompanyOrderRead.model_validate(order)


# ===========================================
# CUSTOMERS & COUPONS & CAMPAIGNS & REVIEWS
# ===========================================

@router.get("/customers", response_model=List[CompanyCustomerRead])
async def list_company_customers(
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """List unique buyers for this company."""
    customers = await CompanyService.list_customers(db, company)
    return [CompanyCustomerRead.model_validate(c) for c in customers]


@router.get("/coupons", response_model=List[CompanyCouponRead])
async def list_company_coupons(
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """List discount coupons created by this company."""
    coupons = await CompanyService.list_coupons(db, company)
    return [CompanyCouponRead.model_validate(c) for c in coupons]


@router.post("/coupons", response_model=CompanyCouponRead, status_code=status.HTTP_201_CREATED)
async def create_company_coupon(
    data: CompanyCouponCreate,
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """Create a new company-scoped coupon."""
    coupon = await CompanyService.create_coupon(db, company, data)
    return CompanyCouponRead.model_validate(coupon)


@router.get("/campaigns", response_model=List[CompanyCampaignRead])
async def list_company_campaigns(
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """List marketing campaigns for this company."""
    campaigns = await CompanyService.list_campaigns(db, company)
    return [CompanyCampaignRead.model_validate(c) for c in campaigns]


@router.post("/campaigns", response_model=CompanyCampaignRead, status_code=status.HTTP_201_CREATED)
async def create_company_campaign(
    data: CompanyCampaignCreate,
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """Create a new influencer marketing campaign."""
    campaign = await CompanyService.create_campaign(db, company, data)
    return CompanyCampaignRead.model_validate(campaign)


@router.get("/reviews", response_model=List[CompanyReviewRead])
async def list_company_reviews(
    company: Company = Depends(get_current_company_scope),
    db: AsyncSession = Depends(get_db),
):
    """List customer reviews for products owned by this company."""
    reviews = await CompanyService.list_reviews(db, company)
    return [CompanyReviewRead.model_validate(r) for r in reviews]
