import uuid
from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class CheckoutItem(BaseModel):
    product_id: uuid.UUID
    company_id: uuid.UUID
    name: str
    price: int = Field(..., description="Price in integer cents")
    quantity: int = Field(..., ge=1)
    image: Optional[str] = None
    variant_id: Optional[uuid.UUID] = None


class ShippingAddress(BaseModel):
    full_name: str
    phone: str
    address: str
    city: str
    postal_code: Optional[str] = None


class CheckoutRequest(BaseModel):
    shipping_address: ShippingAddress
    payment_method: str = Field("cod", description="cod or card")
    shipping_method: str = Field("standard", description="standard or express")
    coupon_code: Optional[str] = Field(None, description="Optional coupon or campaign code")
    session_id: Optional[str] = Field(None, description="Optional session tracking ID for campaign attribution")
    items: List[CheckoutItem]


class CheckoutResponse(BaseModel):
    order_ids: List[str]
    total_amount: int
    message: str


class CustomerOrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID
    company_name: Optional[str] = None
    items: List[Dict[str, Any]] = []
    subtotal: int
    discount: int
    shipping: int
    tax: int
    total: int
    payment_status: str
    order_status: str
    payment_reference: Optional[str] = None
    created_at: datetime
    updated_at: datetime
