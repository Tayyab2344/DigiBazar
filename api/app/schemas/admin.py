import uuid
from datetime import datetime
from typing import Generic, List, Optional, TypeVar, Any
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from app.models.enums import (
    UserRole,
    BusinessType,
    CompanyStatus,
    ProductStatus,
    OrderStatus,
    PaymentStatus,
    PayoutStatus,
    DiscountType,
    InfluencerStatus,
    CampaignStatus,
    ReportStatus,
    TargetType,
    CMSStatus,
    NotificationTarget,
    NotificationStatus,
    AdminRole,
)

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


# ==========================================
# DASHBOARD SCHEMAS
# ==========================================

class RecentOrderRead(BaseModel):
    id: uuid.UUID
    customer_email: str
    company_name: str
    total: int  # integer cents
    order_status: OrderStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecentCompanyRead(BaseModel):
    id: uuid.UUID
    name: str
    business_email: str
    status: CompanyStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecentCustomerRead(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    email: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecentProductRead(BaseModel):
    id: uuid.UUID
    name: str
    price: int  # integer cents
    status: ProductStatus
    company_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardStatsResponse(BaseModel):
    total_customers: int
    total_companies: int
    active_companies: int
    pending_companies: int
    suspended_companies: int
    total_products: int
    active_products: int
    total_orders: int
    pending_orders: int
    completed_orders: int
    cancelled_orders: int
    total_revenue: int  # integer cents
    total_gmv: int  # integer cents
    platform_commission: int  # integer cents
    total_coupons: int
    active_coupons: int
    total_influencers: int
    active_campaigns: int
    pending_refunds: int
    pending_payouts: int

    recent_orders: List[RecentOrderRead]
    recent_companies: List[RecentCompanyRead]
    recent_customers: List[RecentCustomerRead]
    recent_products: List[RecentProductRead]


# ==========================================
# COMPANY MANAGEMENT SCHEMAS
# ==========================================

class CompanyOwnerInfo(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None


class CompanyAdminRead(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    slug: str
    business_email: str
    phone: str
    logo_url: Optional[str] = None
    website: Optional[str] = None
    business_type: BusinessType
    status: CompanyStatus
    is_verified: bool = True
    owner: Optional[CompanyOwnerInfo] = None
    product_count: int = 0
    order_count: int = 0
    revenue: int = 0  # integer cents
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompanyAdminUpdate(BaseModel):
    name: Optional[str] = None
    business_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    business_type: Optional[BusinessType] = None
    logo_url: Optional[str] = None


class CompanyStatusUpdate(BaseModel):
    status: Optional[CompanyStatus] = None
    reason: Optional[str] = None


# ==========================================
# CUSTOMER MANAGEMENT SCHEMAS
# ==========================================

class CustomerAdminRead(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    is_verified: bool
    total_orders: int = 0
    total_spending: int = 0  # integer cents
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerAdminUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    is_verified: Optional[bool] = None


class CustomerStatusUpdate(BaseModel):
    is_active: bool
    reason: Optional[str] = None


# ==========================================
# PRODUCT MANAGEMENT SCHEMAS
# ==========================================

class ProductAdminRead(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    company_name: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    category_name: Optional[str] = None
    name: str
    slug: str
    description: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    price: int  # integer cents
    stock: int
    status: ProductStatus
    rejection_reason: Optional[str] = None
    rating: float
    review_count: int
    sales_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductAdminCreate(BaseModel):
    company_id: uuid.UUID
    category_id: Optional[uuid.UUID] = None
    name: str
    slug: str
    description: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    price: int  # integer cents
    stock: int = 0
    status: ProductStatus = ProductStatus.ACTIVE


class ProductAdminUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    price: Optional[int] = None
    stock: Optional[int] = None
    images: Optional[List[str]] = None


class ProductModerationRequest(BaseModel):
    status: ProductStatus
    reason: Optional[str] = None


# ==========================================
# CATEGORY SCHEMAS
# ==========================================

class CategoryCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    is_active: bool = True
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class CategoryRead(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    is_active: bool
    sort_order: int
    product_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# ORDER & PAYMENT SCHEMAS
# ==========================================

class OrderAdminRead(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    company_id: uuid.UUID
    company_name: Optional[str] = None
    items: List[Any] = Field(default_factory=list)
    subtotal: int
    discount: int
    shipping: int
    tax: int
    total: int
    payment_status: PaymentStatus
    order_status: OrderStatus
    payment_reference: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderStatusUpdate(BaseModel):
    order_status: OrderStatus
    reason: Optional[str] = None


class OrderStatusHistoryRead(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    previous_status: OrderStatus
    new_status: OrderStatus
    changed_by: Optional[uuid.UUID] = None
    reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentAdminRead(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    customer_id: uuid.UUID
    company_id: uuid.UUID
    amount: int
    currency: str
    stripe_payment_reference: Optional[str] = None
    status: PaymentStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RefundCreate(BaseModel):
    amount: int  # integer cents
    reason: str


class RefundAdminRead(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    payment_id: uuid.UUID
    amount: int
    reason: str
    processed_by: Optional[uuid.UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PayoutAdminRead(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    company_name: Optional[str] = None
    gross_sales: int
    platform_commission: int
    refunds: int
    net_payable: int
    status: PayoutStatus
    payout_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PayoutActionRequest(BaseModel):
    reason: Optional[str] = None


# ==========================================
# COUPON SCHEMAS
# ==========================================

class CouponAdminCreate(BaseModel):
    code: str
    discount_type: DiscountType
    discount_value: int  # integer cents or percentage
    minimum_order: int = 0
    maximum_discount: int = 0
    usage_limit: int = 0
    per_user_limit: int = 1
    start_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    is_platform: bool = True
    company_id: Optional[uuid.UUID] = None
    applicable_categories: List[str] = Field(default_factory=list)
    applicable_products: List[str] = Field(default_factory=list)
    applicable_companies: List[str] = Field(default_factory=list)
    is_active: bool = True


class CouponAdminUpdate(BaseModel):
    discount_type: Optional[DiscountType] = None
    discount_value: Optional[int] = None
    minimum_order: Optional[int] = None
    maximum_discount: Optional[int] = None
    usage_limit: Optional[int] = None
    per_user_limit: Optional[int] = None
    start_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    is_active: Optional[bool] = None


class CouponAdminRead(BaseModel):
    id: uuid.UUID
    code: str
    discount_type: DiscountType
    discount_value: int
    minimum_order: int
    maximum_discount: int
    usage_limit: int
    per_user_limit: int
    usage_count: int
    start_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    is_platform: bool
    company_id: Optional[uuid.UUID] = None
    applicable_categories: List[str] = Field(default_factory=list)
    applicable_products: List[str] = Field(default_factory=list)
    applicable_companies: List[str] = Field(default_factory=list)
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# INFLUENCER & CAMPAIGN SCHEMAS
# ==========================================

class InfluencerAdminRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    platform: str
    handle: str
    followers_count: int
    status: InfluencerStatus
    campaign_count: int = 0
    total_revenue: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CampaignAdminRead(BaseModel):
    id: uuid.UUID
    name: str
    company_id: uuid.UUID
    company_name: Optional[str] = None
    influencer_id: uuid.UUID
    influencer_handle: Optional[str] = None
    coupon_id: Optional[uuid.UUID] = None
    clicks_count: int
    orders_count: int
    total_revenue: int
    commission_amount: int
    conversion_rate: float = 0.0
    status: CampaignStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# REVIEW & REPORT SCHEMAS
# ==========================================

class ReviewAdminRead(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: Optional[str] = None
    company_id: uuid.UUID
    company_name: Optional[str] = None
    customer_id: uuid.UUID
    customer_name: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    is_verified_purchase: bool
    is_hidden: bool
    is_reported: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReportAdminRead(BaseModel):
    id: uuid.UUID
    reporter_id: uuid.UUID
    reporter_name: Optional[str] = None
    target_type: TargetType
    target_id: str
    reason: str
    description: Optional[str] = None
    status: ReportStatus
    assigned_admin_id: Optional[uuid.UUID] = None
    resolution: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ReportResolveRequest(BaseModel):
    status: ReportStatus
    resolution: str


# ==========================================
# CMS & BANNER SCHEMAS
# ==========================================

class CMSPageCreate(BaseModel):
    title: str
    slug: str
    content: str
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    status: CMSStatus = CMSStatus.DRAFT


class CMSPageUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    status: Optional[CMSStatus] = None


class CMSPageRead(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    content: str
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    status: CMSStatus
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CMSSectionCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    image_url: Optional[str] = None
    cta_text: Optional[str] = None
    cta_url: Optional[str] = None
    section_type: str
    display_order: int = 0
    is_active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class CMSSectionUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    image_url: Optional[str] = None
    cta_text: Optional[str] = None
    cta_url: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class CMSSectionRead(BaseModel):
    id: uuid.UUID
    title: str
    subtitle: Optional[str] = None
    image_url: Optional[str] = None
    cta_text: Optional[str] = None
    cta_url: Optional[str] = None
    section_type: str
    display_order: int
    is_active: bool
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BannerCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    image_url: str
    cta_text: Optional[str] = None
    cta_url: Optional[str] = None
    position: str = "homepage_hero"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: bool = True


class BannerUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    image_url: Optional[str] = None
    cta_text: Optional[str] = None
    cta_url: Optional[str] = None
    position: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None


class BannerRead(BaseModel):
    id: uuid.UUID
    title: str
    subtitle: Optional[str] = None
    image_url: str
    cta_text: Optional[str] = None
    cta_url: Optional[str] = None
    position: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# NOTIFICATION SCHEMAS
# ==========================================

class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str = "info"
    target_type: NotificationTarget
    target_ids: List[str] = Field(default_factory=list)
    scheduled_at: Optional[datetime] = None


class NotificationRead(BaseModel):
    id: uuid.UUID
    title: str
    message: str
    type: str
    target_type: NotificationTarget
    target_ids: List[str] = Field(default_factory=list)
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    status: NotificationStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# ANALYTICS & AUDIT LOG SCHEMAS
# ==========================================

class AnalyticsTimeSeriesItem(BaseModel):
    date: str
    value: int


class AnalyticsOverviewResponse(BaseModel):
    period: str
    revenue: int
    orders: int
    new_customers: int
    new_companies: int
    chart_data: List[AnalyticsTimeSeriesItem] = Field(default_factory=list)


class AuditLogRead(BaseModel):
    id: uuid.UUID
    admin_user_id: Optional[uuid.UUID] = None
    action: str
    resource_type: str
    resource_id: str
    previous_value: Optional[Any] = None
    new_value: Optional[Any] = None
    reason: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# SETTINGS & ADMIN USER SCHEMAS
# ==========================================

class PlatformSettingsRead(BaseModel):
    general: Any
    commerce: Any
    marketplace: Any


class PlatformSettingsUpdate(BaseModel):
    general: Optional[Any] = None
    commerce: Optional[Any] = None
    marketplace: Optional[Any] = None


class AdminUserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.SUPER_ADMIN


class AdminUserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None


class AdminUserRead(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
