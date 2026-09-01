import uuid
from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field


class PublicCategoryRead(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    product_count: int = 0


class PublicCompanyRead(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    logo_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    description: Optional[str] = None
    rating: float = 4.8
    review_count: int = 120
    is_verified: bool = True
    product_count: int = 0
    sales_count: int = 0


class PublicProductImageRead(BaseModel):
    id: uuid.UUID
    url: str
    alt_text: Optional[str] = None
    is_primary: bool = False
    sort_order: int = 0


class PublicVariantRead(BaseModel):
    id: uuid.UUID
    sku: str
    price: int  # Integer cents
    sale_price: Optional[int] = None
    stock: int
    attributes: Dict[str, str]  # e.g., {"Color": "Black", "Size": "M"}
    image_url: Optional[str] = None
    is_active: bool = True


class PublicAttributeRead(BaseModel):
    name: str
    value: str
    is_variation: bool = False


class PublicProductCardRead(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    brand: Optional[str] = None
    price: int  # Integer cents
    sale_price: Optional[int] = None
    discount_percentage: int = 0
    rating: float = 0.0
    review_count: int = 0
    sales_count: int = 0
    stock: int = 0
    is_free_delivery: bool = True
    badge: Optional[str] = None  # BEST SELLER, NEW, SALE, LIMITED STOCK
    primary_image: Optional[str] = None
    hover_image: Optional[str] = None
    company_id: uuid.UUID
    company_name: str
    company_slug: str
    company_is_verified: bool = True
    category_name: Optional[str] = None
    category_slug: Optional[str] = None
    created_at: datetime


class ProductDetailRead(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    sku: Optional[str] = None
    brand: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    price: int  # Integer cents
    sale_price: Optional[int] = None
    discount_percentage: int = 0
    stock: int = 0
    rating: float = 0.0
    review_count: int = 0
    sales_count: int = 0
    is_free_delivery: bool = True
    badge: Optional[str] = None
    images: List[PublicProductImageRead] = []
    variants: List[PublicVariantRead] = []
    attributes: List[PublicAttributeRead] = []
    tags: List[str] = []
    company: PublicCompanyRead
    category: Optional[PublicCategoryRead] = None
    specifications: Dict[str, str] = {}
    warranty_info: str = "1 Year Brand Warranty"
    return_info: str = "14 Days Easy Returns"
    shipping_info: str = "Standard Delivery (2-4 Days)"


class ReviewRead(BaseModel):
    id: uuid.UUID
    rating: int
    comment: Optional[str] = None
    customer_name: str
    is_verified_purchase: bool = True
    created_at: datetime


class ReviewSummary(BaseModel):
    average_rating: float
    total_reviews: int
    rating_breakdown: Dict[int, int]  # {5: 180, 4: 32, 3: 12, 2: 5, 1: 5}


class HeroSlideRead(BaseModel):
    id: str
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    desktop_image: str
    mobile_image: Optional[str] = None
    side_image: Optional[str] = None
    button_text: str = "Shop Now"
    button_url: str = "/search"
    badge_text: Optional[str] = None
    bg_gradient: Optional[str] = None


class SearchSuggestionItem(BaseModel):
    id: str
    type: str  # "product", "category", "company"
    title: str
    subtitle: Optional[str] = None
    url: str
    image_url: Optional[str] = None


class SearchSuggestionResponse(BaseModel):
    products: List[SearchSuggestionItem] = []
    categories: List[SearchSuggestionItem] = []
    companies: List[SearchSuggestionItem] = []


class PaginatedProductsResponse(BaseModel):
    items: List[PublicProductCardRead]
    total: int
    page: int
    limit: int
    pages: int


class HomepageResponse(BaseModel):
    hero_slides: List[HeroSlideRead]
    categories: List[PublicCategoryRead]
    flash_deals: List[PublicProductCardRead]
    flash_deals_end_time: str
    featured_products: List[PublicProductCardRead]
    popular_products: List[PublicProductCardRead]
    top_companies: List[PublicCompanyRead]
    new_arrivals: List[PublicProductCardRead]
