import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import Any
from app.models.enums import DiscountType, DiscountScope, CommissionType, CampaignStatus, AttributionStatus


class CampaignCreateRequest(BaseModel):
    influencer_id: Optional[uuid.UUID] = None
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    discount_type: DiscountType = DiscountType.PERCENTAGE
    discount_value: int = Field(15, ge=0)  # % or cents
    scope: DiscountScope = DiscountScope.STORE
    commission_type: CommissionType = CommissionType.PERCENTAGE
    commission_value: int = Field(10, ge=0)  # % e.g. 10
    commission_rate: Optional[int] = None
    coupon_code: Optional[str] = Field(None, max_length=50)
    budget: Optional[int] = Field(0, ge=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: bool = True
    product_ids: Optional[List[uuid.UUID]] = Field(default_factory=list)
    category_ids: Optional[List[uuid.UUID]] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def handle_commission_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "commission_rate" in data and ("commission_value" not in data or data.get("commission_value") is None):
                data["commission_value"] = data["commission_rate"]
        return data


class CampaignUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    discount_type: Optional[DiscountType] = None
    discount_value: Optional[int] = Field(None, ge=0)
    scope: Optional[DiscountScope] = None
    commission_type: Optional[CommissionType] = None
    commission_value: Optional[int] = Field(None, ge=0)
    budget: Optional[int] = Field(None, ge=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    product_ids: Optional[List[uuid.UUID]] = None
    category_ids: Optional[List[uuid.UUID]] = None


class CampaignResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID
    influencer_id: Optional[uuid.UUID] = None
    influencer_handle: Optional[str] = None
    coupon_id: Optional[uuid.UUID] = None
    coupon_code: Optional[str] = None
    name: str
    description: Optional[str] = None
    discount_type: DiscountType
    discount_value: int
    scope: DiscountScope
    commission_type: CommissionType
    commission_value: int
    tracking_code: str
    tracking_url: str
    budget: int = 0
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: bool
    status: CampaignStatus
    clicks: int
    orders: int
    revenue: int  # cents
    commission_amount: int  # cents
    created_at: datetime
    updated_at: datetime
    product_ids: List[uuid.UUID] = Field(default_factory=list)
    category_ids: List[uuid.UUID] = Field(default_factory=list)


class CampaignAnalyticsResponse(BaseModel):
    campaign_id: uuid.UUID
    name: str
    clicks: int
    orders: int
    revenue: int  # cents
    discount_cost: int  # cents
    commission_amount: int  # cents
    conversion_rate: float  # percentage e.g. 12.5%
    average_order_value: int  # cents


class AttributionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    session_id: str
    campaign_id: uuid.UUID
    influencer_id: uuid.UUID
    company_id: uuid.UUID
    tracking_code: str
    first_click_at: datetime
    last_click_at: datetime
    expires_at: datetime
    order_id: Optional[uuid.UUID] = None
    conversion_status: AttributionStatus


class CommissionResponse(BaseModel):
    campaign_id: uuid.UUID
    influencer_id: uuid.UUID
    order_id: uuid.UUID
    order_total: int
    commission_type: CommissionType
    commission_value: int
    calculated_commission: int  # cents
