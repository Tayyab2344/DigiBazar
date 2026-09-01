import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.enums import (
    ProductType,
    ProductStatus,
    BackordersPolicy,
    ProductVisibility,
    CategoryRequestStatus,
    RelationType,
)


# ===========================================
# CATEGORY & CATEGORY REQUEST SCHEMAS
# ===========================================

class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    company_id: Optional[uuid.UUID] = None
    is_active: bool
    sort_order: int
    product_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    children: List["CategoryRead"] = []


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: Optional[str] = None
    description: Optional[str] = Field(None, max_length=500)
    image_url: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    is_active: bool = True
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    slug: Optional[str] = None
    description: Optional[str] = Field(None, max_length=500)
    image_url: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class CategoryRequestCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    parent_id: Optional[uuid.UUID] = None
    description: Optional[str] = Field(None, max_length=500)
    reason: Optional[str] = Field(None, max_length=500)


class CategoryRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID
    name: str
    parent_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    reason: Optional[str] = None
    status: CategoryRequestStatus
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CategoryRequestReview(BaseModel):
    status: CategoryRequestStatus
    admin_notes: Optional[str] = None


# ===========================================
# SUB-ENTITY SCHEMAS
# ===========================================

class ProductImageCreate(BaseModel):
    url: str = Field(..., min_length=5)
    cloudinary_public_id: Optional[str] = None
    alt_text: Optional[str] = None
    sort_order: int = 0
    is_primary: bool = False


class ProductImageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    url: str
    cloudinary_public_id: Optional[str] = None
    alt_text: Optional[str] = None
    sort_order: int
    is_primary: bool
    created_at: datetime


class ProductVariantCreate(BaseModel):
    sku: Optional[str] = None
    price: int = Field(0, ge=0, description="Integer cents")
    sale_price: Optional[int] = Field(None, ge=0)
    cost_price: Optional[int] = Field(None, ge=0)
    stock: int = Field(0, ge=0)
    low_stock_threshold: int = Field(5, ge=0)
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    weight: Optional[float] = None
    attributes: Dict[str, str] = Field(default_factory=dict)
    is_active: bool = True

    @field_validator("sku", "barcode", "image_url", "weight", mode="before")
    @classmethod
    def clean_empty_strings(cls, v: Any) -> Any:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return None
        return v

    @field_validator("price", "sale_price", "cost_price", mode="before")
    @classmethod
    def clean_prices(cls, v: Any, info) -> Any:
        if v == "" or v is None:
            if info.field_name == "price":
                return 0
            return None
        if isinstance(v, (float, int, str)):
            try:
                return int(round(float(v)))
            except (ValueError, TypeError):
                return 0 if info.field_name == "price" else None
        return v

    @field_validator("stock", "low_stock_threshold", mode="before")
    @classmethod
    def clean_integers(cls, v: Any) -> Any:
        if v == "" or v is None:
            return 0
        if isinstance(v, (float, int, str)):
            try:
                return int(round(float(v)))
            except (ValueError, TypeError):
                return 0
        return v


class ProductVariantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    sku: Optional[str] = None
    price: int
    sale_price: Optional[int] = None
    cost_price: Optional[int] = None
    stock: int = 0
    low_stock_threshold: int = 5
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    weight: Optional[float] = None
    attributes: Dict[str, str] = Field(default_factory=dict)
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class ProductAttributeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    value: str = Field(..., min_length=1, max_length=255)
    is_variation: bool = False


class ProductAttributeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    value: str
    is_variation: bool


class ProductSEOCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    keywords: Optional[str] = Field(None, max_length=500)

    @field_validator("title", "description", "keywords", mode="before")
    @classmethod
    def clean_empty_strings(cls, v: Any) -> Any:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return None
        return v


class ProductSEORead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    title: Optional[str] = None
    description: Optional[str] = None
    keywords: Optional[str] = None


# ===========================================
# PRODUCT CREATE / UPDATE / READ SCHEMAS
# ===========================================

class ProductCreate(BaseModel):
    product_type: ProductType = ProductType.SIMPLE
    name: str = Field(..., min_length=2, max_length=255)
    slug: Optional[str] = None
    sku: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    brand: Optional[str] = Field(None, max_length=100)
    short_description: Optional[str] = None
    description: Optional[str] = None

    price: int = Field(0, ge=0, description="Integer cents")
    sale_price: Optional[int] = Field(None, ge=0)
    cost_price: Optional[int] = Field(None, ge=0)
    tax_setting: Optional[str] = "STANDARD"

    sale_start_date: Optional[datetime] = None
    sale_end_date: Optional[datetime] = None

    stock: int = Field(0, ge=0)
    low_stock_threshold: int = Field(5, ge=0)
    barcode: Optional[str] = None
    track_inventory: bool = True
    backorders_policy: BackordersPolicy = BackordersPolicy.STOP_SELLING

    weight: Optional[float] = None
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    shipping_class: Optional[str] = None

    status: ProductStatus = ProductStatus.DRAFT
    visibility: ProductVisibility = ProductVisibility.PUBLIC

    images: List[ProductImageCreate] = Field(default_factory=list)
    variants: List[ProductVariantCreate] = Field(default_factory=list)
    attributes: List[ProductAttributeCreate] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    seo: Optional[ProductSEOCreate] = None
    related_product_ids: List[uuid.UUID] = Field(default_factory=list)

    @field_validator(
        "sale_start_date",
        "sale_end_date",
        "category_id",
        "slug",
        "sku",
        "brand",
        "short_description",
        "description",
        "barcode",
        "shipping_class",
        "weight",
        "length",
        "width",
        "height",
        mode="before",
    )
    @classmethod
    def clean_empty_strings(cls, v: Any) -> Any:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return None
        return v

    @field_validator("product_type", "backorders_policy", "visibility", mode="before")
    @classmethod
    def clean_enums(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip().upper()
        return v

    @field_validator("status", mode="before")
    @classmethod
    def clean_status(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("price", "sale_price", "cost_price", mode="before")
    @classmethod
    def clean_prices(cls, v: Any, info) -> Any:
        if v == "" or v is None:
            if info.field_name == "price":
                return 0
            return None
        if isinstance(v, (float, int, str)):
            try:
                return int(round(float(v)))
            except (ValueError, TypeError):
                return 0 if info.field_name == "price" else None
        return v

    @field_validator("stock", "low_stock_threshold", mode="before")
    @classmethod
    def clean_integers(cls, v: Any) -> Any:
        if v == "" or v is None:
            return 0
        if isinstance(v, (float, int, str)):
            try:
                return int(round(float(v)))
            except (ValueError, TypeError):
                return 0
        return v

    @field_validator("attributes", mode="before")
    @classmethod
    def clean_attributes(cls, v: Any) -> Any:
        if isinstance(v, list):
            return [
                attr for attr in v
                if isinstance(attr, dict) and str(attr.get("name", "")).strip() and str(attr.get("value", "")).strip()
            ]
        return v

    @field_validator("tags", mode="before")
    @classmethod
    def clean_tags(cls, v: Any) -> Any:
        if isinstance(v, list):
            return [str(t).strip().lower() for t in v if str(t).strip()]
        return v


class ProductUpdate(BaseModel):
    product_type: Optional[ProductType] = None
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = None
    sku: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    brand: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None

    price: Optional[int] = Field(None, ge=0)
    sale_price: Optional[int] = Field(None, ge=0)
    cost_price: Optional[int] = Field(None, ge=0)
    tax_setting: Optional[str] = None

    sale_start_date: Optional[datetime] = None
    sale_end_date: Optional[datetime] = None

    stock: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    barcode: Optional[str] = None
    track_inventory: Optional[bool] = None
    backorders_policy: Optional[BackordersPolicy] = None

    weight: Optional[float] = None
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    shipping_class: Optional[str] = None

    status: Optional[ProductStatus] = None
    visibility: Optional[ProductVisibility] = None

    images: Optional[List[ProductImageCreate]] = None
    variants: Optional[List[ProductVariantCreate]] = None
    attributes: Optional[List[ProductAttributeCreate]] = None
    tags: Optional[List[str]] = None
    seo: Optional[ProductSEOCreate] = None
    related_product_ids: Optional[List[uuid.UUID]] = None

    @field_validator(
        "sale_start_date",
        "sale_end_date",
        "category_id",
        "slug",
        "sku",
        "brand",
        "short_description",
        "description",
        "barcode",
        "shipping_class",
        "weight",
        "length",
        "width",
        "height",
        mode="before",
    )
    @classmethod
    def clean_empty_strings(cls, v: Any) -> Any:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return None
        return v

    @field_validator("status", mode="before")
    @classmethod
    def clean_status(cls, v: Any) -> Any:
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("price", "sale_price", "cost_price", mode="before")
    @classmethod
    def clean_prices(cls, v: Any) -> Any:
        if v == "" or v is None:
            return None
        if isinstance(v, (float, int, str)):
            try:
                return int(round(float(v)))
            except (ValueError, TypeError):
                return None
        return v

    @field_validator("stock", "low_stock_threshold", mode="before")
    @classmethod
    def clean_integers(cls, v: Any) -> Any:
        if v == "" or v is None:
            return 0
        if isinstance(v, (float, int, str)):
            try:
                return int(round(float(v)))
            except (ValueError, TypeError):
                return 0
        return v


class ProductDraftCreate(BaseModel):
    name: str = Field("Untitled Draft", max_length=255)
    category_id: Optional[uuid.UUID] = None
    price: Optional[int] = 0
    description: Optional[str] = None


class EnhancedCompanyProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID
    category_id: Optional[uuid.UUID] = None
    product_type: ProductType = ProductType.SIMPLE
    name: str
    slug: str
    sku: Optional[str] = None
    brand: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None

    price: int
    sale_price: Optional[int] = None
    cost_price: Optional[int] = None
    tax_setting: Optional[str] = "STANDARD"

    sale_start_date: Optional[datetime] = None
    sale_end_date: Optional[datetime] = None

    stock: int = 0
    low_stock_threshold: int = 5
    barcode: Optional[str] = None
    track_inventory: bool = True
    backorders_policy: BackordersPolicy = BackordersPolicy.STOP_SELLING

    weight: Optional[float] = None
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    shipping_class: Optional[str] = None

    status: ProductStatus = ProductStatus.DRAFT
    visibility: ProductVisibility = ProductVisibility.PUBLIC
    rejection_reason: Optional[str] = None

    rating: float = 0.0
    review_count: int = 0
    sales_count: int = 0

    # Calculated metrics
    discount_amount: int = 0
    discount_percentage: float = 0.0
    profit: Optional[int] = None
    profit_margin: Optional[float] = None
    stock_status: str = "IN_STOCK"
    public_url: str = ""

    images: List[ProductImageRead] = []
    variants: List[ProductVariantRead] = []
    attributes: List[ProductAttributeRead] = []
    tags: List[str] = []
    seo: Optional[ProductSEORead] = None
    related_product_ids: List[uuid.UUID] = []

    created_at: datetime
    updated_at: datetime

    @model_validator(mode="before")
    @classmethod
    def prepare_fields(cls, data: Any) -> Any:
        if hasattr(data, "__table__"):
            imgs = getattr(data, "product_images", None)
            images_list = []
            if imgs:
                images_list = imgs
            elif getattr(data, "images", None):
                json_imgs = getattr(data, "images") or []
                prod_id = getattr(data, "id", uuid.uuid4())
                prod_created = getattr(data, "created_at", None) or datetime.now(timezone.utc)
                images_list = [
                    {
                        "id": uuid.uuid4(),
                        "product_id": prod_id,
                        "url": u,
                        "is_primary": (idx == 0),
                        "alt_text": getattr(data, "name", ""),
                        "sort_order": idx,
                        "created_at": prod_created,
                    }
                    for idx, u in enumerate(json_imgs)
                    if isinstance(u, str)
                ]

            tags_entities = getattr(data, "product_tags", None)
            tags_list = [
                t.tag if hasattr(t, "tag") else (t.name if hasattr(t, "name") else str(t))
                for t in (tags_entities or [])
            ]

            rel_prods = getattr(data, "related_products", None)
            rel_ids = [r.related_product_id for r in (rel_prods or []) if hasattr(r, "related_product_id")]

            return {
                "id": data.id,
                "company_id": data.company_id,
                "category_id": data.category_id,
                "product_type": data.product_type,
                "name": data.name,
                "slug": data.slug,
                "sku": data.sku,
                "brand": data.brand,
                "short_description": data.short_description,
                "description": data.description,
                "price": data.price,
                "sale_price": data.sale_price,
                "cost_price": data.cost_price,
                "tax_setting": data.tax_setting,
                "sale_start_date": data.sale_start_date,
                "sale_end_date": data.sale_end_date,
                "stock": data.stock,
                "low_stock_threshold": data.low_stock_threshold,
                "barcode": data.barcode,
                "track_inventory": data.track_inventory,
                "backorders_policy": data.backorders_policy,
                "weight": data.weight,
                "length": data.length,
                "width": data.width,
                "height": data.height,
                "shipping_class": data.shipping_class,
                "status": data.status,
                "visibility": data.visibility,
                "rejection_reason": data.rejection_reason,
                "rating": getattr(data, "rating", 0.0) or 0.0,
                "review_count": getattr(data, "review_count", 0) or 0,
                "sales_count": getattr(data, "sales_count", 0) or 0,
                "discount_amount": 0,
                "discount_percentage": 0.0,
                "profit": None,
                "profit_margin": None,
                "stock_status": "IN_STOCK",
                "public_url": "",
                "images": images_list,
                "variants": getattr(data, "product_variants", None) or [],
                "attributes": getattr(data, "product_attributes", None) or [],
                "tags": tags_list,
                "seo": getattr(data, "seo", None),
                "related_product_ids": rel_ids,
                "created_at": data.created_at,
                "updated_at": data.updated_at,
            }
        return data


# ===========================================
# AI ASSISTANT SCHEMAS
# ===========================================

class AIContentRequest(BaseModel):
    product_name: str
    category_name: Optional[str] = None
    attributes: Optional[Dict[str, str]] = None
    content_type: str = Field(..., description="description | seo_title | meta_description | tags | alt_text")


class AIContentResponse(BaseModel):
    content_type: str
    generated_text: str
