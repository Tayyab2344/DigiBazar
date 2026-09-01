import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Text, Integer, Float, Boolean, Enum as SQLEnum, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import UUID

from app.core.database import Base
from app.models.enums import (
    ProductType,
    ProductStatus,
    BackordersPolicy,
    ProductVisibility,
    RelationType,
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=False
    )
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), index=True, nullable=True
    )
    product_type: Mapped[ProductType] = mapped_column(
        SQLEnum(ProductType, name="producttype", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=ProductType.SIMPLE,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    sku: Mapped[Optional[str]] = mapped_column(String(100), unique=True, index=True, nullable=True)
    brand: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    short_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Pricing (Integer cents)
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    sale_price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cost_price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tax_setting: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="STANDARD")

    sale_start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sale_end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Inventory
    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    barcode: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    track_inventory: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    backorders_policy: Mapped[BackordersPolicy] = mapped_column(
        SQLEnum(BackordersPolicy, name="backorderspolicy", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=BackordersPolicy.STOP_SELLING,
    )

    # Shipping
    weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    length: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    width: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    height: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    shipping_class: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Status & Visibility
    status: Mapped[ProductStatus] = mapped_column(
        SQLEnum(ProductStatus, name="productstatus", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=ProductStatus.DRAFT,
        index=True,
    )
    visibility: Mapped[ProductVisibility] = mapped_column(
        SQLEnum(ProductVisibility, name="productvisibility", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=ProductVisibility.PUBLIC,
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    rating: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    review_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sales_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    images: Mapped[Optional[List[str]]] = mapped_column(JSON, default=list, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    # Relationships
    product_images: Mapped[List["ProductImage"]] = relationship(
        "ProductImage", back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.sort_order", lazy="selectin"
    )
    product_variants: Mapped[List["ProductVariant"]] = relationship(
        "ProductVariant", back_populates="product", cascade="all, delete-orphan", lazy="selectin"
    )
    product_attributes: Mapped[List["ProductAttribute"]] = relationship(
        "ProductAttribute", back_populates="product", cascade="all, delete-orphan", lazy="selectin"
    )
    product_tags: Mapped[List["ProductTag"]] = relationship(
        "ProductTag", back_populates="product", cascade="all, delete-orphan", lazy="selectin"
    )
    seo: Mapped[Optional["ProductSEO"]] = relationship(
        "ProductSEO", back_populates="product", uselist=False, cascade="all, delete-orphan", lazy="selectin"
    )
    related_products: Mapped[List["RelatedProduct"]] = relationship(
        "RelatedProduct", foreign_keys="RelatedProduct.product_id", cascade="all, delete-orphan", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Product id={self.id} name={self.name} sku={self.sku} status={self.status}>"


class ProductImage(Base):
    __tablename__ = "product_images"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False
    )
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    cloudinary_public_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    alt_text: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )

    product: Mapped["Product"] = relationship("Product", back_populates="product_images")


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False
    )
    sku: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)  # Integer cents
    sale_price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cost_price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    barcode: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    attributes: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)  # e.g. {"Color": "Black", "Size": "M"}
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )

    product: Mapped["Product"] = relationship("Product", back_populates="product_variants")


class ProductAttribute(Base):
    __tablename__ = "product_attributes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. "Connectivity", "Color"
    value: Mapped[str] = mapped_column(String(255), nullable=False)  # e.g. "Bluetooth", "Black, White, Red"
    is_variation: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    product: Mapped["Product"] = relationship("Product", back_populates="product_attributes")


class ProductTag(Base):
    __tablename__ = "product_tags"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False
    )
    tag: Mapped[str] = mapped_column(String(100), index=True, nullable=False)

    product: Mapped["Product"] = relationship("Product", back_populates="product_tags")


class ProductSEO(Base):
    __tablename__ = "product_seos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), unique=True, index=True, nullable=False
    )
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    keywords: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    product: Mapped["Product"] = relationship("Product", back_populates="seo")


class RelatedProduct(Base):
    __tablename__ = "related_products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False
    )
    related_product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True, nullable=False
    )
    relation_type: Mapped[RelationType] = mapped_column(
        SQLEnum(RelationType, name="relationtype", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=RelationType.RELATED,
    )
