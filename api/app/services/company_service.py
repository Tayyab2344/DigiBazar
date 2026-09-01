import uuid
import re
import secrets
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select, func, update, delete, or_, and_, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.company import Company
from app.models.product import (
    Product,
    ProductImage,
    ProductVariant,
    ProductAttribute,
    ProductTag,
    ProductSEO,
    RelatedProduct,
)
from app.models.category import Category
from app.models.category_request import CategoryRequest
from app.models.order import Order, OrderStatusHistory
from app.models.user import User
from app.models.coupon import Coupon
from app.models.influencer import Influencer, Campaign
from app.models.review import Review
from app.models.inventory_movement import InventoryMovement
from app.models.enums import (
    CompanyStatus,
    ProductType,
    ProductStatus,
    BackordersPolicy,
    ProductVisibility,
    CategoryRequestStatus,
    RelationType,
    OrderStatus,
    PaymentStatus,
    PayoutStatus,
    DiscountType,
    CampaignStatus,
    InventoryMovementType,
    StoreStatus,
)
from app.schemas.company import (
    CompanyProfileUpdate,
    CompanyProductCreate,
    CompanyProductUpdate,
    CompanyOrderStatusUpdate,
    CompanyCouponCreate,
    CompanyCampaignCreate,
)
from app.schemas.product_schemas import (
    CategoryRead,
    CategoryUpdate,
    ProductCreate,
    ProductUpdate,
    ProductDraftCreate,
    CategoryRequestCreate,
    CategoryRequestReview,
    AIContentRequest,
    AIContentResponse,
    EnhancedCompanyProductRead,
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def generate_slug_base(text: str) -> str:
    """Generate clean slug string from product name."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-") or "product"


class CompanyService:
    @staticmethod
    async def generate_unique_slug(db: AsyncSession, name: str, exclude_product_id: Optional[uuid.UUID] = None) -> str:
        """Generate human-readable product name + short unique identifier (e.g. apple-airpods-pro-3-a7k29)."""
        base = generate_slug_base(name)
        for _ in range(10):
            short_id = secrets.token_hex(3)[:5]
            candidate = f"{base}-{short_id}"
            stmt = select(Product).where(Product.slug == candidate)
            if exclude_product_id:
                stmt = stmt.where(Product.id != exclude_product_id)
            res = await db.execute(stmt)
            if not res.scalar_one_or_none():
                return candidate
        return f"{base}-{uuid.uuid4().hex[:8]}"

    @staticmethod
    async def generate_unique_sku(db: AsyncSession, name: str, exclude_product_id: Optional[uuid.UUID] = None) -> str:
        """Generate automatic SKU (e.g. DB-AIRPODS-3-A7K29)."""
        clean_words = [w.upper() for w in re.sub(r"[^\w\s]", "", name).split() if w]
        code_part = "-".join(clean_words[:3]) or "ITEM"
        for _ in range(10):
            short_id = secrets.token_hex(3)[:5].upper()
            candidate = f"DB-{code_part}-{short_id}"
            stmt = select(Product).where(Product.sku == candidate)
            if exclude_product_id:
                stmt = stmt.where(Product.id != exclude_product_id)
            res = await db.execute(stmt)
            if not res.scalar_one_or_none():
                return candidate
        return f"DB-{code_part}-{uuid.uuid4().hex[:6].upper()}"

    # ===========================================
    # CATEGORIES & CATEGORY REQUESTS
    # ===========================================

    @staticmethod
    async def list_categories_tree(
        db: AsyncSession, company_id: Optional[uuid.UUID] = None, search: Optional[str] = None
    ) -> List[CategoryRead]:
        """Fetch hierarchical active marketplace categories (global + vendor owned)."""
        stmt = select(Category).where(Category.is_active == True)
        if company_id:
            stmt = stmt.where(or_(Category.company_id == None, Category.company_id == company_id))
        else:
            stmt = stmt.where(Category.company_id == None)

        if search:
            stmt = stmt.where(Category.name.ilike(f"%{search}%"))
        stmt = stmt.order_by(Category.sort_order.asc(), Category.name.asc())
        res = await db.execute(stmt)
        categories = list(res.scalars().all())

        # Calculate product counts for company
        prod_counts: Dict[uuid.UUID, int] = {}
        if company_id:
            count_stmt = (
                select(Product.category_id, func.count(Product.id))
                .where(Product.company_id == company_id, Product.category_id.is_not(None))
                .group_by(Product.category_id)
            )
            count_res = await db.execute(count_stmt)
            for cat_id, p_count in count_res.all():
                if cat_id:
                    prod_counts[cat_id] = p_count

        # Build parent-child hierarchy safely without triggering lazy ORM loads
        cat_map = {
            c.id: CategoryRead(
                id=c.id,
                name=c.name,
                slug=c.slug,
                description=c.description,
                image_url=c.image_url,
                parent_id=c.parent_id,
                company_id=c.company_id,
                is_active=c.is_active,
                sort_order=c.sort_order,
                product_count=prod_counts.get(c.id, 0),
                created_at=c.created_at,
                updated_at=c.updated_at,
                children=[],
            )
            for c in categories
        }

        tree: List[CategoryRead] = []
        for c in categories:
            dto = cat_map[c.id]
            if c.parent_id and c.parent_id in cat_map:
                cat_map[c.parent_id].children.append(dto)
            elif not c.parent_id:
                tree.append(dto)
        return tree if not search else list(cat_map.values())

    @staticmethod
    async def update_store_category(
        db: AsyncSession, company: Company, category_id: uuid.UUID, data: Dict[str, Any]
    ) -> CategoryRead:
        res = await db.execute(select(Category).where(Category.id == category_id))
        category = res.scalar_one_or_none()
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")

        if category.company_id != company.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Marketplace categories managed by DigiBazar cannot be modified by individual stores."
            )

        for key, val in data.items():
            if val is not None:
                setattr(category, key, val)

        await db.commit()
        await db.refresh(category)

        # Get product count
        count_res = await db.execute(
            select(func.count(Product.id)).where(Product.company_id == company.id, Product.category_id == category.id)
        )
        p_count = count_res.scalar_one() or 0

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
            product_count=p_count,
            created_at=category.created_at,
            updated_at=category.updated_at,
            children=[],
        )

    @staticmethod
    async def delete_store_category(db: AsyncSession, company: Company, category_id: uuid.UUID) -> bool:
        res = await db.execute(select(Category).where(Category.id == category_id))
        category = res.scalar_one_or_none()
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")

        if category.company_id != company.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Marketplace categories managed by DigiBazar cannot be deleted by individual stores."
            )

        # Check assigned products count
        count_res = await db.execute(
            select(func.count(Product.id)).where(Product.category_id == category.id)
        )
        p_count = count_res.scalar_one() or 0
        if p_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete store category with {p_count} assigned products. Reassign or delete products first."
            )

        await db.delete(category)
        await db.commit()
        return True

    @staticmethod
    async def create_category_request(db: AsyncSession, company: Company, data: CategoryRequestCreate) -> CategoryRequest:
        """Vendor submits a category request."""
        req = CategoryRequest(
            company_id=company.id,
            name=data.name.strip(),
            parent_id=data.parent_id,
            description=data.description,
            reason=data.reason,
            status=CategoryRequestStatus.PENDING,
        )
        db.add(req)
        await db.commit()
        await db.refresh(req)
        return req

    @staticmethod
    async def list_category_requests(db: AsyncSession, company_id: Optional[uuid.UUID] = None) -> List[CategoryRequest]:
        """List category requests for vendor or super admin."""
        stmt = select(CategoryRequest).order_by(CategoryRequest.created_at.desc())
        if company_id:
            stmt = stmt.where(CategoryRequest.company_id == company_id)
        res = await db.execute(stmt)
        return list(res.scalars().all())

    # ===========================================
    # PROFILE & DASHBOARD
    # ===========================================

    @staticmethod
    async def get_profile(db: AsyncSession, company_id: uuid.UUID) -> Company:
        res = await db.execute(select(Company).where(Company.id == company_id))
        company = res.scalar_one_or_none()
        if not company:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company profile not found")
        return company

    @staticmethod
    async def update_profile(db: AsyncSession, company: Company, data: CompanyProfileUpdate) -> Company:
        update_data = data.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            setattr(company, key, val)
        await db.commit()
        await db.refresh(company)
        return company

    @staticmethod
    async def get_dashboard_stats(db: AsyncSession, company: Company) -> Dict[str, Any]:
        p_stmt = select(
            func.count(Product.id).label("total"),
            func.count(case((Product.status == ProductStatus.ACTIVE, Product.id))).label("active"),
            func.count(case((and_(Product.stock > 0, Product.stock <= Product.low_stock_threshold), Product.id))).label("low_stock"),
            func.count(case((Product.stock == 0, Product.id))).label("out_of_stock"),
        ).where(Product.company_id == company.id)
        p_res = await db.execute(p_stmt)
        p_row = p_res.one()

        o_stmt = select(
            func.count(Order.id).label("total_orders"),
            func.count(case((Order.order_status == OrderStatus.PENDING, Order.id))).label("pending"),
            func.count(case((Order.order_status == OrderStatus.PROCESSING, Order.id))).label("processing"),
            func.count(case((Order.order_status == OrderStatus.SHIPPED, Order.id))).label("shipped"),
            func.count(case((Order.order_status == OrderStatus.DELIVERED, Order.id))).label("delivered"),
            func.count(case((Order.order_status == OrderStatus.CANCELLED, Order.id))).label("cancelled"),
            func.count(case((Order.order_status == OrderStatus.REFUNDED, Order.id))).label("refunded"),
            func.coalesce(func.sum(case((Order.payment_status == PaymentStatus.PAID, Order.total), else_=0)), 0).label("gross_revenue"),
            func.coalesce(func.sum(case((Order.order_status == OrderStatus.REFUNDED, Order.total), else_=0)), 0).label("refund_sum"),
            func.coalesce(func.sum(case((Order.payment_status == PaymentStatus.PAID, Order.discount), else_=0)), 0).label("discount_sum"),
        ).where(Order.company_id == company.id)
        o_res = await db.execute(o_stmt)
        o_row = o_res.one()

        cust_stmt = select(func.count(func.distinct(Order.customer_id))).where(Order.company_id == company.id)
        cust_res = await db.execute(cust_stmt)
        total_customers = cust_res.scalar() or 0

        rev_stmt = select(
            func.count(Review.id).label("total_reviews"),
            func.avg(Review.rating).label("avg_rating"),
        ).where(Review.company_id == company.id)
        rev_res = await db.execute(rev_stmt)
        rev_row = rev_res.one()

        gross = o_row.gross_revenue or 0
        refunds = o_row.refund_sum or 0
        discounts = o_row.discount_sum or 0
        commission = int(round(gross * 0.10))
        net_rev = max(0, gross - refunds - commission)

        return {
            "total_sales": gross,
            "total_products": p_row.total or 0,
            "active_products": p_row.active or 0,
            "low_stock_products": p_row.low_stock or 0,
            "out_of_stock_products": p_row.out_of_stock or 0,
            "total_customers": total_customers,
            "total_reviews": rev_row.total_reviews or 0,
            "average_rating": float(round(rev_row.avg_rating or 0.0, 1)),
            "coupon_sales": discounts,
            "campaign_sales": 0,
            "total_orders": o_row.total_orders or 0,
            "pending_orders": o_row.pending or 0,
            "processing_orders": o_row.processing or 0,
            "shipped_orders": o_row.shipped or 0,
            "delivered_orders": o_row.delivered or 0,
            "cancelled_orders": o_row.cancelled or 0,
            "refunded_orders": o_row.refunded or 0,
            "gross_revenue": gross,
            "refunds": refunds,
            "discounts": discounts,
            "platform_commission": commission,
            "net_revenue": net_rev,
            "pending_payout": net_rev,
            "paid_payout": 0,
        }

    # ===========================================
    # ENHANCED PRODUCT CREATION & MANAGEMENT
    # ===========================================

    @staticmethod
    async def create_enhanced_product(db: AsyncSession, company: Company, data: ProductCreate) -> Product:
        """Create product with full nested sub-entities, validation, and auto-generated slug/SKU."""
        # 1. Pricing validation
        if data.sale_price is not None and data.sale_price >= data.price:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sale price must be strictly less than regular price.",
            )
        if data.sale_start_date and data.sale_end_date and data.sale_start_date >= data.sale_end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sale start date must be before sale end date.",
            )

        # 2. Slug & SKU generation with automatic conflict resolution
        if data.slug and data.slug.strip():
            candidate_slug = generate_slug_base(data.slug.strip())
            slug_check = await db.execute(select(Product).where(Product.slug == candidate_slug))
            if slug_check.scalar_one_or_none():
                slug = await CompanyService.generate_unique_slug(db, data.name)
            else:
                slug = candidate_slug
        else:
            slug = await CompanyService.generate_unique_slug(db, data.name)

        if data.sku and data.sku.strip():
            candidate_sku = data.sku.strip().upper()
            sku_check = await db.execute(select(Product).where(Product.sku == candidate_sku))
            if sku_check.scalar_one_or_none():
                sku = await CompanyService.generate_unique_sku(db, candidate_sku)
            else:
                sku = candidate_sku
        else:
            sku = await CompanyService.generate_unique_sku(db, data.name)

        # Check category existence if provided
        category_id = data.category_id
        if category_id:
            cat_check = await db.execute(select(Category).where(Category.id == category_id))
            if not cat_check.scalar_one_or_none():
                category_id = None

        # 3. Create Product entity
        product = Product(
            company_id=company.id,
            category_id=category_id,
            product_type=data.product_type,
            name=data.name.strip(),
            slug=slug,
            sku=sku,
            brand=data.brand.strip() if data.brand else None,
            short_description=data.short_description,
            description=data.description,
            price=data.price,
            sale_price=data.sale_price,
            cost_price=data.cost_price,
            tax_setting=data.tax_setting or "STANDARD",
            sale_start_date=data.sale_start_date,
            sale_end_date=data.sale_end_date,
            stock=data.stock,
            low_stock_threshold=data.low_stock_threshold,
            barcode=data.barcode,
            track_inventory=data.track_inventory,
            backorders_policy=data.backorders_policy,
            weight=data.weight,
            length=data.length,
            width=data.width,
            height=data.height,
            shipping_class=data.shipping_class,
            status=data.status,
            visibility=data.visibility,
            images=[img.url for img in data.images] if data.images else [],
        )
        db.add(product)
        await db.flush()

        # 4. Product Images
        if data.images:
            has_primary = any(img.is_primary for img in data.images)
            for idx, img in enumerate(data.images):
                p_img = ProductImage(
                    product_id=product.id,
                    url=img.url,
                    cloudinary_public_id=img.cloudinary_public_id,
                    alt_text=img.alt_text or data.name,
                    sort_order=img.sort_order if img.sort_order else idx,
                    is_primary=True if (not has_primary and idx == 0) else img.is_primary,
                )
                db.add(p_img)

        # 5. Product Variants (if VARIABLE)
        if data.product_type == ProductType.VARIABLE and data.variants:
            for idx, var in enumerate(data.variants):
                var_sku = var.sku.strip().upper() if var.sku else f"{sku}-V{idx+1}"
                v_check = await db.execute(select(ProductVariant).where(ProductVariant.sku == var_sku))
                if v_check.scalar_one_or_none():
                    var_sku = f"{sku}-V{idx+1}-{secrets.token_hex(2).upper()}"
                v_entity = ProductVariant(
                    product_id=product.id,
                    sku=var_sku,
                    price=var.price,
                    sale_price=var.sale_price,
                    cost_price=var.cost_price,
                    stock=var.stock,
                    low_stock_threshold=var.low_stock_threshold,
                    barcode=var.barcode,
                    image_url=var.image_url,
                    weight=var.weight,
                    attributes=var.attributes,
                    is_active=var.is_active,
                )
                db.add(v_entity)

        # 6. Product Attributes
        for attr in data.attributes:
            p_attr = ProductAttribute(
                product_id=product.id,
                name=attr.name.strip(),
                value=attr.value.strip(),
                is_variation=attr.is_variation,
            )
            db.add(p_attr)

        # 7. Product Tags
        for tag_str in data.tags:
            if tag_str.strip():
                p_tag = ProductTag(product_id=product.id, tag=tag_str.strip().lower())
                db.add(p_tag)

        # 8. Product SEO
        seo_title = data.seo.title if (data.seo and data.seo.title) else f"{data.name} | DigiBazar"
        seo_desc = data.seo.description if (data.seo and data.seo.description) else (data.short_description or data.name)
        p_seo = ProductSEO(
            product_id=product.id,
            title=seo_title,
            description=seo_desc,
            keywords=data.seo.keywords if data.seo else None,
        )
        db.add(p_seo)

        # 9. Related Products (verify existence)
        if data.related_product_ids:
            rel_res = await db.execute(select(Product.id).where(Product.id.in_(data.related_product_ids)))
            valid_rel_ids = list(rel_res.scalars().all())
            for rel_id in valid_rel_ids:
                r_rel = RelatedProduct(product_id=product.id, related_product_id=rel_id, relation_type=RelationType.RELATED)
                db.add(r_rel)

        try:
            await db.commit()
            await db.refresh(product)
            return product
        except HTTPException:
            await db.rollback()
            raise
        except Exception as err:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create product: {str(err)}",
            )

    @staticmethod
    async def create_product_draft(db: AsyncSession, company: Company, data: ProductDraftCreate) -> Product:
        """Save incomplete draft without requiring strict validation."""
        slug = await CompanyService.generate_unique_slug(db, data.name or "draft")
        sku = await CompanyService.generate_unique_sku(db, data.name or "draft")

        product = Product(
            company_id=company.id,
            category_id=data.category_id,
            name=data.name or "Untitled Draft",
            slug=slug,
            sku=sku,
            description=data.description,
            price=data.price or 0,
            stock=0,
            status=ProductStatus.DRAFT,
        )
        db.add(product)
        await db.commit()
        await db.refresh(product)
        return product

    @staticmethod
    async def get_enhanced_product(db: AsyncSession, company: Company, product_id: uuid.UUID) -> Product:
        """Fetch product with all relationships loaded."""
        stmt = (
            select(Product)
            .options(
                selectinload(Product.product_images),
                selectinload(Product.product_variants),
                selectinload(Product.product_attributes),
                selectinload(Product.product_tags),
                selectinload(Product.seo),
                selectinload(Product.related_products),
            )
            .where(and_(Product.id == product_id, Product.company_id == company.id))
        )
        res = await db.execute(stmt)
        product = res.scalar_one_or_none()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found or does not belong to your company",
            )
        return product

    @staticmethod
    async def update_enhanced_product(
        db: AsyncSession, company: Company, product_id: uuid.UUID, data: ProductUpdate
    ) -> Product:
        """Update product and re-sync child entities."""
        product = await CompanyService.get_enhanced_product(db, company, product_id)
        update_dict = data.model_dump(exclude_unset=True)

        # Validate prices if modified
        price = update_dict.get("price", product.price)
        sale_price = update_dict.get("sale_price", product.sale_price)
        if sale_price is not None and sale_price >= price:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sale price must be strictly less than regular price.")

        # Validate category_id if updated
        if "category_id" in update_dict and update_dict["category_id"]:
            cat_check = await db.execute(select(Category).where(Category.id == update_dict["category_id"]))
            if not cat_check.scalar_one_or_none():
                update_dict["category_id"] = None

        for field in [
            "product_type", "name", "brand", "short_description", "description",
            "category_id", "price", "sale_price", "cost_price", "tax_setting",
            "sale_start_date", "sale_end_date", "stock", "low_stock_threshold",
            "barcode", "track_inventory", "backorders_policy", "weight",
            "length", "width", "height", "shipping_class", "status", "visibility"
        ]:
            if field in update_dict:
                setattr(product, field, update_dict[field])

        # Replace images if provided
        if "images" in update_dict and update_dict["images"] is not None:
            await db.execute(delete(ProductImage).where(ProductImage.product_id == product.id))
            for idx, img in enumerate(update_dict["images"]):
                db.add(ProductImage(
                    product_id=product.id,
                    url=img["url"],
                    cloudinary_public_id=img.get("cloudinary_public_id"),
                    alt_text=img.get("alt_text") or product.name,
                    sort_order=img.get("sort_order", idx),
                    is_primary=img.get("is_primary", idx == 0),
                ))

        # Replace variants if provided
        if "variants" in update_dict and update_dict["variants"] is not None:
            await db.execute(delete(ProductVariant).where(ProductVariant.product_id == product.id))
            for idx, var in enumerate(update_dict["variants"]):
                var_sku = var.get("sku") or f"{product.sku}-V{idx+1}"
                db.add(ProductVariant(
                    product_id=product.id,
                    sku=var_sku,
                    price=var["price"],
                    sale_price=var.get("sale_price"),
                    cost_price=var.get("cost_price"),
                    stock=var.get("stock", 0),
                    low_stock_threshold=var.get("low_stock_threshold", 5),
                    barcode=var.get("barcode"),
                    image_url=var.get("image_url"),
                    weight=var.get("weight"),
                    attributes=var.get("attributes", {}),
                    is_active=var.get("is_active", True),
                ))

        # Replace attributes if provided
        if "attributes" in update_dict and update_dict["attributes"] is not None:
            await db.execute(delete(ProductAttribute).where(ProductAttribute.product_id == product.id))
            for attr in update_dict["attributes"]:
                db.add(ProductAttribute(
                    product_id=product.id,
                    name=attr["name"],
                    value=attr["value"],
                    is_variation=attr.get("is_variation", False),
                ))

        # Replace tags if provided
        if "tags" in update_dict and update_dict["tags"] is not None:
            await db.execute(delete(ProductTag).where(ProductTag.product_id == product.id))
            for t in update_dict["tags"]:
                if t.strip():
                    db.add(ProductTag(product_id=product.id, tag=t.strip().lower()))

        # Update SEO if provided
        if "seo" in update_dict and update_dict["seo"] is not None:
            seo_data = update_dict["seo"]
            if product.seo:
                product.seo.title = seo_data.get("title")
                product.seo.description = seo_data.get("description")
                product.seo.keywords = seo_data.get("keywords")
            else:
                db.add(ProductSEO(
                    product_id=product.id,
                    title=seo_data.get("title") or f"{product.name} | DigiBazar",
                    description=seo_data.get("description") or product.name,
                    keywords=seo_data.get("keywords"),
                ))

        try:
            await db.commit()
            await db.refresh(product)
            return product
        except HTTPException:
            await db.rollback()
            raise
        except Exception as err:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update product: {str(err)}",
            )

    @staticmethod
    async def validate_and_publish_product(db: AsyncSession, company: Company, product_id: uuid.UUID) -> Product:
        """Backend validation before changing status to ACTIVE."""
        product = await CompanyService.get_enhanced_product(db, company, product_id)
        errors = []

        if not product.name or len(product.name.strip()) < 2:
            errors.append("Product name is required.")
        if not product.category_id:
            errors.append("Product category selection is required.")
        if not product.description or len(product.description.strip()) < 10:
            errors.append("Detailed product description (minimum 10 chars) is required.")
        if not product.price or product.price <= 0:
            errors.append("Regular price must be greater than 0.")
        if not product.sku:
            errors.append("Product SKU is required.")
        
        # Main image check
        has_main_image = any(img.is_primary for img in product.product_images) or bool(product.product_images or product.images)
        if not has_main_image:
            errors.append("At least one main product image is required to publish.")

        if product.product_type == ProductType.VARIABLE:
            if not product.product_variants:
                errors.append("Variable products must have at least one variant combination.")
            for v in product.product_variants:
                if v.price <= 0:
                    errors.append(f"Variant SKU {v.sku} must have a valid price > 0.")

        if errors:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail={"publishing_errors": errors})

        product.status = ProductStatus.ACTIVE
        await db.commit()
        await db.refresh(product)
        return product

    @staticmethod
    async def generate_ai_content(payload: AIContentRequest) -> AIContentResponse:
        """Generate high-quality AI content for product creation assistant."""
        ctype = payload.content_type
        name = payload.product_name
        cat = payload.category_name or "General Marketplace"

        if ctype == "description":
            generated = f"Experience top-tier quality with {name}. Designed for high performance and daily reliability in {cat}, this product features premium craftmanship, intuitive functionality, and lasting durability."
        elif ctype == "seo_title":
            generated = f"{name} - Best Price & Deals | DigiBazar {cat}"
        elif ctype == "meta_description":
            generated = f"Buy {name} online on DigiBazar. Explore features, specifications, and fast delivery in {cat}. Order now for best deals!"
        elif ctype == "tags":
            clean_name = re.sub(r"[^\w\s]", "", name.lower())
            tags = list(set([w for w in clean_name.split() if len(w) > 2] + [cat.lower(), "marketplace", "digibazar"]))
            generated = ", ".join(tags[:6])
        elif ctype == "alt_text":
            generated = f"High-resolution product photo of {name} in {cat}"
        else:
            generated = f"DigiBazar verified product listing for {name}."

        return AIContentResponse(content_type=ctype, generated_text=generated)

    # ===========================================
    # INVENTORY & ORDERS & COUPONS
    # ===========================================

    @staticmethod
    async def list_products(
        db: AsyncSession, company: Company, page: int = 1, page_size: int = 20, search: Optional[str] = None
    ) -> Tuple[List[Product], int]:
        query = select(Product).where(Product.company_id == company.id)
        if search:
            query = query.where(Product.name.ilike(f"%{search}%"))

        count_res = await db.execute(select(func.count()).select_from(query.subquery()))
        total = count_res.scalar() or 0

        query = query.order_by(Product.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        res = await db.execute(query)
        items = list(res.scalars().all())
        return items, total

    @staticmethod
    async def get_product(db: AsyncSession, company: Company, product_id: uuid.UUID) -> Product:
        res = await db.execute(
            select(Product).where(and_(Product.id == product_id, Product.company_id == company.id))
        )
        product = res.scalar_one_or_none()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found or does not belong to your company",
            )
        return product

    @staticmethod
    async def create_product(
        db: AsyncSession, company: Company, data: CompanyProductCreate
    ) -> Product:
        slug_base = generate_slug_base(data.name)
        slug = f"{slug_base}-{uuid.uuid4().hex[:6]}"
        sku = f"DB-{slug_base.upper()[:10]}-{uuid.uuid4().hex[:5].upper()}"

        product = Product(
            company_id=company.id,
            category_id=data.category_id,
            name=data.name,
            slug=slug,
            sku=sku,
            description=data.description,
            images=data.images,
            price=data.price,
            stock=data.stock,
            status=ProductStatus.ACTIVE,
        )
        db.add(product)
        await db.commit()
        await db.refresh(product)

        if data.stock > 0:
            movement = InventoryMovement(
                company_id=company.id,
                product_id=product.id,
                movement_type=InventoryMovementType.RESTOCK,
                quantity=data.stock,
                previous_stock=0,
                new_stock=data.stock,
                reason="Initial Stock",
            )
            db.add(movement)
            await db.commit()

        return product

    @staticmethod
    async def update_product(
        db: AsyncSession, company: Company, product_id: uuid.UUID, data: CompanyProductUpdate
    ) -> Product:
        product = await CompanyService.get_product(db, company, product_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            setattr(product, key, val)
        await db.commit()
        await db.refresh(product)
        return product

    @staticmethod
    async def delete_product(db: AsyncSession, company: Company, product_id: uuid.UUID) -> None:
        """Delete a product owned by the specified company."""
        product = await CompanyService.get_product(db, company, product_id)
        await db.delete(product)
        await db.commit()


    @staticmethod
    async def update_inventory(
        db: AsyncSession, company: Company, product_id: uuid.UUID, quantity_change: int, reason: str
    ) -> Product:
        product = await CompanyService.get_product(db, company, product_id)
        prev_stock = product.stock
        new_stock = max(0, prev_stock + quantity_change)
        product.stock = new_stock

        movement = InventoryMovement(
            company_id=company.id,
            product_id=product.id,
            movement_type=InventoryMovementType.RESTOCK if quantity_change > 0 else InventoryMovementType.ADJUSTMENT,
            quantity=quantity_change,
            previous_stock=prev_stock,
            new_stock=new_stock,
            reason=reason,
        )
        db.add(movement)
        await db.commit()
        await db.refresh(product)
        return product

    @staticmethod
    async def list_inventory_movements(db: AsyncSession, company: Company) -> List[InventoryMovement]:
        stmt = (
            select(InventoryMovement)
            .where(InventoryMovement.company_id == company.id)
            .order_by(InventoryMovement.created_at.desc())
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @staticmethod
    async def list_orders(
        db: AsyncSession, company: Company, page: int = 1, page_size: int = 20, status_filter: Optional[OrderStatus] = None
    ) -> Tuple[List[Order], int]:
        query = select(Order).where(Order.company_id == company.id)
        if status_filter:
            query = query.where(Order.order_status == status_filter)

        count_res = await db.execute(select(func.count()).select_from(query.subquery()))
        total = count_res.scalar() or 0

        query = query.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        res = await db.execute(query)
        return list(res.scalars().all()), total

    @staticmethod
    async def get_order(db: AsyncSession, company: Company, order_id: uuid.UUID) -> Order:
        res = await db.execute(select(Order).where(and_(Order.id == order_id, Order.company_id == company.id)))
        order = res.scalar_one_or_none()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        return order

    @staticmethod
    async def update_order_status(
        db: AsyncSession, company: Company, order_id: uuid.UUID, data: CompanyOrderStatusUpdate
    ) -> Order:
        res = await db.execute(select(Order).where(and_(Order.id == order_id, Order.company_id == company.id)))
        order = res.scalar_one_or_none()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        new_status = data.status or data.order_status
        if not new_status:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order status field is required.")

        prev_status = order.order_status
        order.order_status = new_status
        if new_status == OrderStatus.DELIVERED:
            order.payment_status = PaymentStatus.PAID

        history = OrderStatusHistory(
            order_id=order.id,
            previous_status=prev_status,
            new_status=new_status,
            changed_by=company.owner_id,
            reason=data.notes or data.reason or f"Status updated from {prev_status} to {new_status}",
        )
        db.add(history)

        await db.commit()
        await db.refresh(order)
        return order

    @staticmethod
    async def list_customers(db: AsyncSession, company: Company) -> List[Dict[str, Any]]:
        stmt = (
            select(
                User.id,
                User.first_name,
                User.last_name,
                User.email,
                User.phone,
                func.count(Order.id).label("total_orders"),
                func.coalesce(func.sum(Order.total), 0).label("total_spent"),
                func.min(Order.created_at).label("first_order_at"),
                func.max(Order.created_at).label("last_order_at"),
            )
            .join(Order, User.id == Order.customer_id)
            .where(Order.company_id == company.id)
            .group_by(User.id, User.first_name, User.last_name, User.email, User.phone)
            .order_by(func.max(Order.created_at).desc())
        )
        res = await db.execute(stmt)
        rows = res.all()
        return [
            {
                "id": r.id,
                "first_name": r.first_name,
                "last_name": r.last_name,
                "email": r.email,
                "phone": r.phone,
                "orders_count": r.total_orders,
                "total_orders": r.total_orders,
                "total_spent": r.total_spent,
                "total_spending": r.total_spent,
                "first_order_at": r.first_order_at,
                "last_order_at": r.last_order_at,
                "created_at": r.first_order_at or r.last_order_at,
            }
            for r in rows
        ]

    @staticmethod
    async def list_coupons(db: AsyncSession, company: Company) -> List[Coupon]:
        res = await db.execute(select(Coupon).where(Coupon.company_id == company.id).order_by(Coupon.created_at.desc()))
        return list(res.scalars().all())

    @staticmethod
    async def create_coupon(db: AsyncSession, company: Company, data: CompanyCouponCreate) -> Coupon:
        existing = await db.execute(select(Coupon).where(Coupon.code == data.code.upper()))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Coupon code already exists")

        dtype = data.discount_type
        if isinstance(dtype, str):
            dtype_str = dtype.upper()
            if dtype_str == "FIXED":
                dtype = DiscountType.FIXED
            elif dtype_str == "FIXED_AMOUNT":
                dtype = DiscountType.FIXED_AMOUNT
            elif dtype_str == "PERCENTAGE":
                dtype = DiscountType.PERCENTAGE
            else:
                dtype = DiscountType.PERCENTAGE

        coupon = Coupon(
            company_id=company.id,
            code=data.code.upper(),
            name=f"Coupon {data.code.upper()}",
            discount_type=dtype,
            discount_value=data.discount_value,
            minimum_order_amount=getattr(data, "minimum_order", 0) or getattr(data, "min_purchase_amount", 0) or 0,
            maximum_discount_amount=getattr(data, "maximum_discount", 0) or getattr(data, "max_discount_amount", 0) or 0,
            usage_limit=getattr(data, "usage_limit", 0) or 0,
            start_date=getattr(data, "valid_from", None) or getattr(data, "start_date", None) or utc_now(),
            end_date=getattr(data, "expiry_date", None) or getattr(data, "valid_until", None),
            is_active=True,
        )
        db.add(coupon)
        await db.commit()
        await db.refresh(coupon)
        return coupon

    @staticmethod
    async def list_reviews(db: AsyncSession, company: Company) -> List[Dict[str, Any]]:
        stmt = (
            select(
                Review.id,
                Review.company_id,
                Review.product_id,
                Product.name.label("product_name"),
                User.first_name.label("customer_first_name"),
                User.last_name.label("customer_last_name"),
                Review.rating,
                Review.comment,
                Review.is_verified_purchase,
                Review.created_at,
            )
            .join(Product, Review.product_id == Product.id)
            .join(User, Review.customer_id == User.id)
            .where(Review.company_id == company.id)
            .order_by(Review.created_at.desc())
        )
        res = await db.execute(stmt)
        rows = res.all()
        return [
            {
                "id": r.id,
                "company_id": r.company_id,
                "product_id": r.product_id,
                "product_name": r.product_name,
                "customer_name": f"{r.customer_first_name} {r.customer_last_name}",
                "rating": r.rating,
                "comment": r.comment,
                "verified_purchase": r.is_verified_purchase,
                "created_at": r.created_at,
            }
            for r in rows
        ]
