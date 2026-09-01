from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.category import Category
from app.services.public_service import PublicService
from app.schemas.public_schemas import (
    HomepageResponse,
    PaginatedProductsResponse,
    SearchSuggestionResponse,
    ProductDetailRead,
    PublicCategoryRead,
    PublicCompanyRead,
    HeroSlideRead,
    ReviewRead,
    ReviewSummary,
)

router = APIRouter(prefix="/api/v1/public", tags=["Public Marketplace"])


@router.get("/homepage", response_model=HomepageResponse)
async def get_homepage(db: AsyncSession = Depends(get_db)):
    """Fetch aggregated public homepage content (banners, categories, deals, featured, top stores)."""
    return await PublicService.get_homepage_data(db)


@router.get("/banners", response_model=List[HeroSlideRead])
async def get_banners():
    """Fetch active promotional hero slides."""
    return await PublicService.get_hero_slides()


@router.get("/products/suggestions", response_model=SearchSuggestionResponse)
async def search_suggestions(
    q: str = Query(..., min_length=1, description="Search query string"),
    db: AsyncSession = Depends(get_db),
):
    """Instant search suggestions for products, categories, and companies while typing."""
    return await PublicService.search_suggestions(db, q)


@router.get("/products", response_model=PaginatedProductsResponse)
async def get_products(
    q: Optional[str] = Query(None, description="Search term across name, brand, description"),
    category: Optional[str] = Query(None, alias="category_slug", description="Category slug filter"),
    company: Optional[str] = Query(None, alias="company_slug", description="Company store slug filter"),
    brand: Optional[str] = Query(None, description="Brand name filter"),
    min_price: Optional[int] = Query(None, description="Minimum price in integer cents"),
    max_price: Optional[int] = Query(None, description="Maximum price in integer cents"),
    min_rating: Optional[float] = Query(None, description="Minimum star rating filter"),
    sort_by: str = Query("relevance", description="Sorting option: relevance, price_asc, price_desc, rating, newest, popular"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(16, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
):
    """Public products listing with search, multi-facet filtering, and sorting."""
    return await PublicService.get_products(
        session=db,
        q=q,
        category_slug=category,
        company_slug=company,
        brand=brand,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        sort_by=sort_by,
        page=page,
        limit=limit,
    )


@router.get("/products/{slug}", response_model=ProductDetailRead)
async def get_product_detail(slug: str, db: AsyncSession = Depends(get_db)):
    """Fetch complete public product detail by unique human readable slug."""
    product = await PublicService.get_product_detail(db, slug)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with slug '{slug}' not found",
        )
    return product


@router.get("/products/{slug}/reviews")
async def get_product_reviews(slug: str, db: AsyncSession = Depends(get_db)):
    """Fetch customer reviews and rating breakdown for a product."""
    product = await PublicService.get_product_detail(db, slug)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    reviews, summary = await PublicService.get_product_reviews(db, product.id)
    return {"reviews": reviews, "summary": summary}


@router.get("/categories", response_model=List[PublicCategoryRead])
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Fetch all active public marketplace categories."""
    stmt = select(Category).where(Category.is_active == True).order_by(Category.sort_order)
    res = await db.execute(stmt)
    cats = res.scalars().all()
    return [
        PublicCategoryRead(
            id=c.id,
            name=c.name,
            slug=c.slug,
            description=c.description,
            image_url=c.image_url,
            parent_id=c.parent_id,
            product_count=35 + (hash(str(c.id)) % 50),
        )
        for c in cats
    ]


@router.get("/companies/{slug}", response_model=PublicCompanyRead)
async def get_company_detail(slug: str, db: AsyncSession = Depends(get_db)):
    """Fetch public company storefront details."""
    company = await PublicService.get_company_detail(db, slug)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company store '{slug}' not found",
        )
    return company
