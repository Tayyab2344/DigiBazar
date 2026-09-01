import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any, Generic, TypeVar
from pydantic import BaseModel, ConfigDict, EmailStr, Field, AliasChoices, field_validator

from app.models.enums import (
    BusinessType,
    CompanyStatus,
    VerificationStatus,
    StoreStatus,
    ProductStatus,
    OrderStatus,
    PaymentStatus,
    PayoutStatus,
    DiscountType,
    CampaignStatus,
    InventoryMovementType,
)

T = TypeVar("T")


# ===========================================
# GENERIC PAGINATED RESPONSE
# ===========================================

class CompanyPaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int = 1


# ===========================================
# COMPANY PROFILE SCHEMAS
# ===========================================

class CompanyProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    legal_name: Optional[str] = None
    slug: str
    business_email: str
    phone: str
    logo_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    tax_identifier: Optional[str] = None
    registration_number: Optional[str] = None
    business_type: BusinessType
    status: CompanyStatus
    verification_status: VerificationStatus
    store_status: StoreStatus
    created_at: datetime
    updated_at: datetime


class CompanyProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    legal_name: Optional[str] = Field(None, max_length=255)
    business_email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    logo_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    tax_identifier: Optional[str] = None
    registration_number: Optional[str] = None
    business_type: Optional[BusinessType] = None
    store_status: Optional[StoreStatus] = None


# ===========================================
# DASHBOARD SCHEMAS
# ===========================================

class CompanyDashboardStats(BaseModel):
    total_sales: int = Field(..., description="Integer cents")
    total_orders: int
    total_products: int
    active_products: int
    low_stock_products: int
    out_of_stock_products: int
    total_customers: int
    total_reviews: int
    average_rating: float
    coupon_sales: int = Field(..., description="Integer cents")
    campaign_sales: int = Field(..., description="Integer cents")
    pending_orders: int
    processing_orders: int
    shipped_orders: int
    delivered_orders: int
    cancelled_orders: int
    refunded_orders: int
    gross_revenue: int = Field(..., description="Integer cents")
    refunds: int = Field(..., description="Integer cents")
    discounts: int = Field(..., description="Integer cents")
    platform_commission: int = Field(..., description="Integer cents")
    net_revenue: int = Field(..., description="Integer cents")
    pending_payout: int = Field(..., description="Integer cents")
    paid_payout: int = Field(..., description="Integer cents")


# ===========================================
# PRODUCT SCHEMAS
# ===========================================

class CompanyProductCreate(BaseModel):
    category_id: Optional[uuid.UUID] = None
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    price: int = Field(..., ge=0, description="Price in integer cents")
    stock: int = Field(0, ge=0)
    images: List[str] = []


class CompanyProductUpdate(BaseModel):
    category_id: Optional[uuid.UUID] = None
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    price: Optional[int] = Field(None, ge=0, description="Price in integer cents")
    stock: Optional[int] = Field(None, ge=0)
    status: Optional[ProductStatus] = None
    images: Optional[List[str]] = None


class CompanyProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID
    category_id: Optional[uuid.UUID] = None
    name: str
    slug: str
    sku: Optional[str] = None
    brand: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: int = Field(..., description="Integer cents")
    sale_price: Optional[int] = None
    cost_price: Optional[int] = None
    stock: int
    low_stock_threshold: Optional[int] = 5
    status: ProductStatus
    images: List[str] = []
    rating: float
    review_count: int
    sales_count: int
    created_at: datetime
    updated_at: datetime


# ===========================================
# INVENTORY SCHEMAS
# ===========================================

class InventoryUpdate(BaseModel):
    product_id: uuid.UUID
    stock: int = Field(..., ge=0)
    reason: Optional[str] = None


class InventoryMovementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID
    product_id: uuid.UUID
    variant_id: Optional[uuid.UUID] = None
    movement_type: InventoryMovementType
    quantity: int
    previous_stock: int
    new_stock: int
    reason: Optional[str] = None
    reference_id: Optional[str] = None
    created_at: datetime


# ===========================================
# ORDER SCHEMAS
# ===========================================

class CompanyOrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    product_name: Optional[str] = None
    qty: int
    unit_price_cents: int
    discount_cents: int
    total_cents: int


class CompanyOrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    customer_id: uuid.UUID
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    items: List[CompanyOrderItemRead] = []
    subtotal: int = Field(..., description="Integer cents")
    discount: int = Field(..., description="Integer cents")
    shipping: int = Field(..., description="Integer cents")
    tax: int = Field(..., description="Integer cents")
    total: int = Field(..., description="Integer cents")
    payment_status: PaymentStatus
    order_status: OrderStatus
    created_at: datetime
    updated_at: datetime


class CompanyOrderStatusUpdate(BaseModel):
    status: Optional[OrderStatus] = Field(None, validation_alias=AliasChoices("status", "order_status"))
    order_status: Optional[OrderStatus] = Field(None, validation_alias=AliasChoices("status", "order_status"))
    notes: Optional[str] = None
    reason: Optional[str] = None


# ===========================================
# CUSTOMER SCHEMAS
# ===========================================

class CompanyCustomerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    orders_count: int = Field(..., validation_alias=AliasChoices("orders_count", "total_orders"))
    total_orders: int = Field(..., validation_alias=AliasChoices("total_orders", "orders_count"))
    total_spent: int = Field(..., validation_alias=AliasChoices("total_spent", "total_spending"))
    total_spending: int = Field(..., validation_alias=AliasChoices("total_spending", "total_spent"))
    first_order_at: Optional[datetime] = None
    last_order_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


# ===========================================
# COUPON SCHEMAS
# ===========================================

class CompanyCouponCreate(BaseModel):
    code: str = Field(..., min_length=3, max_length=50)
    discount_type: DiscountType
    discount_value: int = Field(..., ge=1, description="Percentage (1-100) or Fixed integer cents")
    minimum_order: Optional[int] = Field(0, ge=0, description="Integer cents")
    maximum_discount: Optional[int] = Field(0, ge=0, description="Integer cents")
    usage_limit: Optional[int] = Field(0, ge=0)
    per_user_limit: Optional[int] = Field(1, ge=1)
    expiry_date: Optional[datetime] = None

    @field_validator("discount_type", mode="before")
    @classmethod
    def parse_discount_type(cls, v):
        if isinstance(v, str):
            v_upper = v.upper()
            if v_upper == "PERCENTAGE":
                return DiscountType.PERCENTAGE
            elif v_upper in ("FIXED", "FIXED_AMOUNT"):
                return DiscountType.FIXED
        return v


class CompanyCouponRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID
    code: str
    discount_type: DiscountType
    discount_value: int
    minimum_order: int = Field(0, validation_alias=AliasChoices("minimum_order", "minimum_order_amount"))
    maximum_discount: int = Field(0, validation_alias=AliasChoices("maximum_discount", "maximum_discount_amount"))
    usage_limit: int = Field(0)
    usage_count: int = Field(0)
    expiry_date: Optional[datetime] = Field(None, validation_alias=AliasChoices("expiry_date", "end_date"))
    is_active: bool
    created_at: datetime


# ===========================================
# CAMPAIGN SCHEMAS
# ===========================================

class CompanyCampaignCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    influencer_handle: str
    budget: Optional[int] = Field(0, ge=0, description="Integer cents")
    commission_rate: float = Field(0.0, ge=0.0, le=100.0)
    coupon_code: Optional[str] = None


class CompanyCampaignRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID
    name: str
    influencer_handle: Optional[str] = None
    clicks_count: int
    orders_count: int
    total_revenue: int = Field(..., description="Integer cents")
    commission_amount: int = Field(..., description="Integer cents")
    conversion_rate: float
    status: CampaignStatus
    created_at: datetime


# ===========================================
# REVIEW SCHEMAS
# ===========================================

class CompanyReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    product_name: Optional[str] = None
    customer_name: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    is_verified_purchase: bool
    created_at: datetime


# ===========================================
# SETTINGS SCHEMAS
# ===========================================

class CompanySettingsRead(BaseModel):
    store_name: str
    support_email: str
    support_phone: Optional[str] = None
    return_policy: Optional[str] = None
    shipping_policy: Optional[str] = None
    default_currency: str = "PKR"


class CompanySettingsUpdate(BaseModel):
    support_email: Optional[EmailStr] = None
    support_phone: Optional[str] = None
    return_policy: Optional[str] = None
    shipping_policy: Optional[str] = None
