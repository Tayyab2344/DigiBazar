import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.models.enums import DiscountType, DiscountScope


class CouponProductItem(BaseModel):
    id: uuid.UUID
    name: str


class CouponCategoryItem(BaseModel):
    id: uuid.UUID
    name: str


class CouponCreateRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    discount_type: DiscountType = DiscountType.PERCENTAGE
    discount_value: int = Field(..., ge=0)  # % e.g. 15 or cents e.g. 500
    scope: DiscountScope = DiscountScope.STORE
    minimum_order_amount: int = Field(0, ge=0)  # cents
    maximum_discount_amount: int = Field(0, ge=0)  # cents (0 = uncapped)
    usage_limit: int = Field(0, ge=0)  # 0 = unlimited
    per_customer_limit: int = Field(1, ge=0)  # 0 = unlimited
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: bool = True
    product_ids: Optional[List[uuid.UUID]] = Field(default_factory=list)
    category_ids: Optional[List[uuid.UUID]] = Field(default_factory=list)


class CouponUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    discount_type: Optional[DiscountType] = None
    discount_value: Optional[int] = Field(None, ge=0)
    scope: Optional[DiscountScope] = None
    minimum_order_amount: Optional[int] = Field(None, ge=0)
    maximum_discount_amount: Optional[int] = Field(None, ge=0)
    usage_limit: Optional[int] = Field(None, ge=0)
    per_customer_limit: Optional[int] = Field(None, ge=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    product_ids: Optional[List[uuid.UUID]] = None
    category_ids: Optional[List[uuid.UUID]] = None


class CouponResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: Optional[uuid.UUID] = None
    campaign_id: Optional[uuid.UUID] = None
    code: str
    name: str
    description: Optional[str] = None
    discount_type: DiscountType
    discount_value: int
    scope: DiscountScope
    minimum_order_amount: int
    maximum_discount_amount: int
    usage_limit: int
    usage_count: int
    per_customer_limit: int
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: bool
    is_platform: bool
    created_at: datetime
    updated_at: datetime
    product_ids: List[uuid.UUID] = Field(default_factory=list)
    category_ids: List[uuid.UUID] = Field(default_factory=list)


class CartItemValidation(BaseModel):
    product_id: uuid.UUID
    company_id: uuid.UUID
    category_id: Optional[uuid.UUID] = None
    price: int  # cents
    quantity: int = 1


class CouponValidationRequest(BaseModel):
    code: str
    company_id: Optional[uuid.UUID] = None
    cart_items: List[CartItemValidation]
    order_subtotal: int  # cents


class ItemDiscountBreakdown(BaseModel):
    product_id: uuid.UUID
    original_price: int
    quantity: int
    eligible: bool
    discount_amount: int


class CouponValidationResponse(BaseModel):
    valid: bool
    message: str
    coupon_id: Optional[uuid.UUID] = None
    code: Optional[str] = None
    discount_type: Optional[DiscountType] = None
    discount_value: Optional[int] = None
    scope: Optional[DiscountScope] = None
    total_discount: int = 0  # cents
    final_subtotal: int = 0  # cents
    item_breakdown: List[ItemDiscountBreakdown] = Field(default_factory=list)
