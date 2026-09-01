import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy import select, func, or_, and_, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.product import Product, ProductImage, ProductVariant, ProductAttribute, ProductTag, RelatedProduct
from app.models.category import Category
from app.models.company import Company
from app.models.review import Review
from app.models.enums import ProductStatus, ProductVisibility, CompanyStatus
from app.models.user import User
from app.models.enums import UserRole
from app.core.security import get_password_hash

from app.schemas.public_schemas import (
    PublicProductCardRead,
    ProductDetailRead,
    PublicCategoryRead,
    PublicCompanyRead,
    PublicProductImageRead,
    PublicVariantRead,
    PublicAttributeRead,
    HeroSlideRead,
    SearchSuggestionItem,
    SearchSuggestionResponse,
    PaginatedProductsResponse,
    ReviewRead,
    ReviewSummary,
    HomepageResponse,
)


def calculate_discount(price: int, sale_price: Optional[int]) -> int:
    if not sale_price or sale_price >= price or price <= 0:
        return 0
    return int(round(((price - sale_price) / price) * 100))


def product_to_card(product: Product, company: Company, category: Optional[Category] = None) -> PublicProductCardRead:
    imgs = sorted(product.product_images, key=lambda x: x.sort_order) if product.product_images else []
    primary = next((i.url for i in imgs if i.is_primary), (imgs[0].url if imgs else None))
    if not primary and product.images and len(product.images) > 0:
        primary = product.images[0]
    
    hover = next((i.url for i in imgs if not i.is_primary), (imgs[1].url if len(imgs) > 1 else None))
    if not hover and product.images and len(product.images) > 1:
        hover = product.images[1]

    disc = calculate_discount(product.price, product.sale_price)
    
    created_at = product.created_at
    if created_at and created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    now_utc = datetime.now(timezone.utc)
    badge = None
    if disc >= 20:
        badge = "FLASH SALE"
    elif product.sales_count > 100:
        badge = "BEST SELLER"
    elif created_at and (now_utc - created_at).days < 14:
        badge = "NEW"
    elif product.stock <= 5 and product.stock > 0:
        badge = "LIMITED STOCK"

    return PublicProductCardRead(
        id=product.id,
        name=product.name,
        slug=product.slug,
        brand=product.brand,
        price=product.price,
        sale_price=product.sale_price if product.sale_price and product.sale_price < product.price else None,
        discount_percentage=disc,
        rating=float(product.rating or 0.0),
        review_count=product.review_count or 0,
        sales_count=product.sales_count or 0,
        stock=product.stock,
        is_free_delivery=True,
        badge=badge,
        primary_image=primary,
        hover_image=hover,
        company_id=company.id,
        company_name=company.name,
        company_slug=company.slug,
        company_is_verified=True,
        category_name=category.name if category else None,
        category_slug=category.slug if category else None,
        created_at=created_at or now_utc,
    )


class PublicService:

    @staticmethod
    async def get_hero_slides() -> List[HeroSlideRead]:
        return [
            HeroSlideRead(
                id="slide-1",
                title="Everything you need.\nAll in one marketplace.",
                subtitle="Shop smartphones, laptops & smartwatches from verified stores across Pakistan.",
                description="Discover authentic tech, fashion, and lifestyle items with verified seller warranties and nationwide express delivery.",
                desktop_image="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&auto=format&fit=crop&q=80",
                side_image="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
                button_text="Shop Electronics",
                button_url="/search?q=Electronics",
                badge_text="DIGIBAZAR EXCLUSIVE",
            ),
            HeroSlideRead(
                id="slide-2",
                title="Upgrade your everyday\ntech & fashion",
                subtitle="Explore direct deals from top Pakistani clothing & fashion brand stores.",
                description="Best prices on genuine electronics, home appliances, and apparel with 100% buyer protection.",
                desktop_image="https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&auto=format&fit=crop&q=80",
                side_image="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80",
                button_text="Shop Fashion",
                button_url="/search?q=Fashion",
                badge_text="VERIFIED BRANDS",
            ),
            HeroSlideRead(
                id="slide-3",
                title="Redefine your home\n& living space",
                subtitle="Discover designer furniture, decor, and smart kitchen appliances with express shipping.",
                description="Elevate your living room and kitchen with durable, stylish home essentials.",
                desktop_image="https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&auto=format&fit=crop&q=80",
                side_image="https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&auto=format&fit=crop&q=80",
                button_text="Explore Home",
                button_url="/search?q=Home",
                badge_text="HOME ESSENTIALS",
            ),
            HeroSlideRead(
                id="slide-4",
                title="Immersive sound &\nsmart wearables",
                subtitle="Top rated wireless earbuds, headphones, and fitness watches with brand warranties.",
                description="Experience high-fidelity audio and health tracking with original brand guarantees.",
                desktop_image="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&auto=format&fit=crop&q=80",
                side_image="https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80",
                button_text="Shop Wearables",
                button_url="/search?q=Wearables",
                badge_text="TRENDING GADGETS",
            ),
            HeroSlideRead(
                id="slide-5",
                title="Glow with authentic\nbeauty & skincare",
                subtitle="100% genuine skincare products, serums, and luxury perfumes from certified sellers.",
                description="Nourish your skin with top dermatologist recommended brands and organic cosmetics.",
                desktop_image="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1600&auto=format&fit=crop&q=80",
                side_image="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
                button_text="Shop Beauty",
                button_url="/search?q=Beauty",
                badge_text="BEAUTY CARE",
            ),
            HeroSlideRead(
                id="slide-6",
                title="Gear up for ultimate\nfitness & sports",
                subtitle="High-grade training equipment, activewear, and footwear for everyday athletes.",
                description="Achieve your fitness goals with premium sports gear and durable gym accessories.",
                desktop_image="https://images.unsplash.com/photo-1517649763962-0c623266010b?w=1600&auto=format&fit=crop&q=80",
                side_image="https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80",
                button_text="Shop Sports",
                button_url="/search?q=Sports",
                badge_text="ACTIVE GEAR",
            ),
            HeroSlideRead(
                id="slide-7",
                title="Unbeatable deals &\nseasonal price cuts",
                subtitle="Save up to 50% on top Pakistani stores with nationwide express shipping.",
                description="Limited time flash discounts on top-selling marketplace categories.",
                desktop_image="https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1600&auto=format&fit=crop&q=80",
                side_image="https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800&auto=format&fit=crop&q=80",
                button_text="View Flash Deals",
                button_url="/search?q=deals",
                badge_text="SPECIAL DISCOUNTS",
            ),
        ]

    @staticmethod
    async def get_homepage_data(session: AsyncSession) -> HomepageResponse:
        slides = await PublicService.get_hero_slides()
        end_time_iso = datetime.now(timezone.utc).isoformat()

        try:
            # 2. Categories
            cat_stmt = select(Category).where(Category.is_active == True).order_by(Category.sort_order).limit(12)
            res_cats = await session.execute(cat_stmt)
            categories_db = list(res_cats.scalars().all())

            if len(categories_db) < 6:
                default_cats = [
                    ("Electronics", "electronics", "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80"),
                    ("Fashion", "fashion", "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80"),
                    ("Home & Living", "home-living", "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80"),
                    ("Beauty", "beauty", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80"),
                    ("Sports", "sports", "https://images.unsplash.com/photo-1517649763962-0c623266010b?w=400&q=80"),
                    ("Groceries", "groceries", "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80"),
                    ("Accessories", "accessories", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80"),
                    ("Mobile & Gadgets", "mobile-gadgets", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80"),
                ]
                for idx, (name, slug, img) in enumerate(default_cats):
                    existing = next((c for c in categories_db if c.slug == slug), None)
                    if not existing:
                        new_c = Category(
                            id=uuid.uuid4(),
                            name=name,
                            slug=slug,
                            image_url=img,
                            sort_order=idx,
                            is_active=True,
                        )
                        session.add(new_c)
                try:
                    await session.commit()
                    res_cats = await session.execute(cat_stmt)
                    categories_db = list(res_cats.scalars().all())
                except Exception:
                    await session.rollback()

            categories = [
                PublicCategoryRead(
                    id=c.id,
                    name=c.name,
                    slug=c.slug,
                    description=c.description,
                    image_url=c.image_url,
                    parent_id=c.parent_id,
                    product_count=0,
                )
                for c in categories_db
            ]

            # 3. Fetch products with relations
            prod_stmt = (
                select(Product)
                .options(
                    selectinload(Product.product_images),
                    selectinload(Product.product_variants),
                    selectinload(Product.product_attributes),
                )
                .limit(40)
            )
            res_prods = await session.execute(prod_stmt)
            products_db = res_prods.scalars().all()

            # Fetch companies and map
            comp_stmt = select(Company)
            res_comps = await session.execute(comp_stmt)
            companies = list(res_comps.scalars().all())
            companies_map = {c.id: c for c in companies}
            categories_map = {c.id: c for c in categories_db}

            all_cards = []
            for p in products_db:
                c = companies_map.get(p.company_id)
                cat = categories_map.get(p.category_id)
                if c:
                    all_cards.append(product_to_card(p, c, cat))

            # Flash deals (has sale price)
            flash_deals = [card for card in all_cards if card.discount_percentage > 0][:5]

            # Featured products
            featured = [card for card in all_cards if card.rating >= 4.0][:5]
            if not featured:
                featured = all_cards[:5]

            # Popular products (trending)
            popular = sorted(all_cards, key=lambda x: (x.rating, x.review_count), reverse=True)[:5]

            # New arrivals
            new_arrivals = sorted(all_cards, key=lambda x: x.created_at, reverse=True)[:5]

            # Top stores with product counts
            top_companies = []
            for c in companies[:6]:
                prod_cnt = sum(1 for p in products_db if p.company_id == c.id)
                top_companies.append(
                    PublicCompanyRead(
                        id=c.id,
                        name=c.name,
                        slug=c.slug,
                        logo_url=c.logo_url,
                        cover_image_url=c.cover_image_url,
                        description=c.description or "Official verified store on DigiBazar.",
                        rating=4.8,
                        review_count=124,
                        is_verified=(c.status == CompanyStatus.ACTIVE),
                        product_count=max(prod_cnt, 12),
                        sales_count=100,
                    )
                )

            return HomepageResponse(
                hero_slides=slides,
                categories=categories,
                flash_deals=flash_deals,
                flash_deals_end_time=end_time_iso,
                featured_products=featured,
                popular_products=popular,
                top_companies=top_companies,
                new_arrivals=new_arrivals,
            )
        except Exception as e:
            try:
                await session.rollback()
            except Exception:
                pass
            import logging
            logging.error(f"Error fetching homepage data from DB: {e}", exc_info=True)
            return HomepageResponse(
                hero_slides=slides,
                categories=[],
                flash_deals=[],
                flash_deals_end_time=end_time_iso,
                featured_products=[],
                popular_products=[],
                top_companies=[],
                new_arrivals=[],
            )

    @staticmethod
    async def search_suggestions(session: AsyncSession, q: str) -> SearchSuggestionResponse:
        if not q or len(q.strip()) < 1:
            return SearchSuggestionResponse()

        term = f"%{q.strip()}%"

        # Search products
        p_stmt = select(Product).where(Product.name.ilike(term)).limit(5)
        p_res = await session.execute(p_stmt)
        products = p_res.scalars().all()

        p_items = [
            SearchSuggestionItem(
                id=str(p.id),
                type="product",
                title=p.name,
                subtitle=f"Rs. {p.price / 100:,.0f}" if p.price else None,
                url=f"/products/{p.slug}",
                image_url=p.product_images[0].url if p.product_images else (p.images[0] if p.images else None),
            )
            for p in products
        ]

        # Search categories
        c_stmt = select(Category).where(Category.name.ilike(term)).limit(4)
        c_res = await session.execute(c_stmt)
        categories = c_res.scalars().all()
        c_items = [
            SearchSuggestionItem(
                id=str(c.id),
                type="category",
                title=c.name,
                subtitle="Category",
                url=f"/category/{c.slug}",
                image_url=c.image_url,
            )
            for c in categories
        ]

        # Search companies
        s_stmt = select(Company).where(Company.name.ilike(term)).limit(4)
        s_res = await session.execute(s_stmt)
        companies = s_res.scalars().all()
        comp_items = [
            SearchSuggestionItem(
                id=str(comp.id),
                type="company",
                title=comp.name,
                subtitle="Verified Store",
                url=f"/company/{comp.slug}",
                image_url=comp.logo_url,
            )
            for comp in companies
        ]

        return SearchSuggestionResponse(
            products=p_items,
            categories=c_items,
            companies=comp_items,
        )

    @staticmethod
    async def get_products(
        session: AsyncSession,
        q: Optional[str] = None,
        category_slug: Optional[str] = None,
        company_slug: Optional[str] = None,
        brand: Optional[str] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        min_rating: Optional[float] = None,
        sort_by: str = "relevance",
        page: int = 1,
        limit: int = 16,
    ) -> PaginatedProductsResponse:
        stmt = select(Product).options(
            selectinload(Product.product_images),
            selectinload(Product.product_variants),
            selectinload(Product.product_attributes),
        )

        if q and q.strip():
            raw_q = q.strip().lower()
            if raw_q in ["deals", "deal", "flash", "flash sale"]:
                stmt = stmt.where(or_(Product.sale_price.isnot(None), Product.discount_percentage > 0))
            else:
                t = f"%{q.strip()}%"
                stmt = stmt.where(
                    or_(
                        Product.name.ilike(t),
                        Product.brand.ilike(t),
                        Product.short_description.ilike(t),
                        Product.description.ilike(t),
                    )
                )

        if category_slug:
            cat_stmt = select(Category.id).where(Category.slug == category_slug)
            cat_res = await session.execute(cat_stmt)
            cat_id = cat_res.scalar_one_or_none()
            if cat_id:
                stmt = stmt.where(Product.category_id == cat_id)

        if company_slug:
            comp_stmt = select(Company.id).where(Company.slug == company_slug)
            comp_res = await session.execute(comp_stmt)
            comp_id = comp_res.scalar_one_or_none()
            if comp_id:
                stmt = stmt.where(Product.company_id == comp_id)

        if brand:
            stmt = stmt.where(Product.brand.ilike(f"%{brand}%"))

        if min_price is not None:
            stmt = stmt.where(Product.price >= min_price)

        if max_price is not None:
            stmt = stmt.where(Product.price <= max_price)

        if min_rating is not None:
            stmt = stmt.where(Product.rating >= min_rating)

        # Sorting
        if sort_by == "price_asc":
            stmt = stmt.order_by(asc(Product.price))
        elif sort_by == "price_desc":
            stmt = stmt.order_by(desc(Product.price))
        elif sort_by == "rating":
            stmt = stmt.order_by(desc(Product.rating))
        elif sort_by == "newest":
            stmt = stmt.order_by(desc(Product.created_at))
        elif sort_by == "popular":
            stmt = stmt.order_by(desc(Product.review_count))
        else:
            stmt = stmt.order_by(desc(Product.created_at))

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        c_res = await session.execute(count_stmt)
        total = c_res.scalar() or 0

        # Pagination
        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)

        res = await session.execute(stmt)
        products = res.scalars().all()

        # Fetch companies and categories maps
        comp_res = await session.execute(select(Company))
        companies_map = {c.id: c for c in comp_res.scalars().all()}
        cat_res = await session.execute(select(Category))
        categories_map = {c.id: c for c in cat_res.scalars().all()}

        cards = []
        for p in products:
            c = companies_map.get(p.company_id)
            cat = categories_map.get(p.category_id)
            if c:
                cards.append(product_to_card(p, c, cat))

        pages = (total + limit - 1) // limit if limit > 0 else 1

        return PaginatedProductsResponse(
            items=cards,
            total=total,
            page=page,
            limit=limit,
            pages=pages,
        )

    @staticmethod
    async def get_product_detail(session: AsyncSession, slug: str) -> Optional[ProductDetailRead]:
        stmt = (
            select(Product)
            .where(Product.slug == slug)
            .options(
                selectinload(Product.product_images),
                selectinload(Product.product_variants),
                selectinload(Product.product_attributes),
                selectinload(Product.product_tags),
            )
        )
        res = await session.execute(stmt)
        product = res.scalar_one_or_none()

        if not product:
            return None

        # Fetch company & category
        c_res = await session.execute(select(Company).where(Company.id == product.company_id))
        company = c_res.scalar_one_or_none()
        if not company:
            return None

        cat = None
        if product.category_id:
            cat_res = await session.execute(select(Category).where(Category.id == product.category_id))
            cat = cat_res.scalar_one_or_none()

        # Format Images
        images_list = []
        if product.product_images:
            for img in sorted(product.product_images, key=lambda x: x.sort_order):
                images_list.append(
                    PublicProductImageRead(
                        id=img.id,
                        url=img.url,
                        alt_text=img.alt_text or product.name,
                        is_primary=img.is_primary,
                        sort_order=img.sort_order,
                    )
                )
        elif product.images:
            for idx, u in enumerate(product.images):
                images_list.append(
                    PublicProductImageRead(
                        id=uuid.uuid4(),
                        url=u,
                        alt_text=product.name,
                        is_primary=(idx == 0),
                        sort_order=idx,
                    )
                )

        # Format Variants
        variants_list = []
        if product.product_variants:
            for v in product.product_variants:
                variants_list.append(
                    PublicVariantRead(
                        id=v.id,
                        sku=v.sku,
                        price=v.price,
                        sale_price=v.sale_price if v.sale_price and v.sale_price < v.price else None,
                        stock=v.stock,
                        attributes=v.attributes or {},
                        image_url=v.image_url,
                        is_active=v.is_active,
                    )
                )

        # Attributes & Specs
        attributes_list = []
        specs_dict = {}
        if product.product_attributes:
            for a in product.product_attributes:
                attributes_list.append(
                    PublicAttributeRead(name=a.name, value=a.value, is_variation=a.is_variation)
                )
                specs_dict[a.name] = a.value

        disc = calculate_discount(product.price, product.sale_price)

        company_dto = PublicCompanyRead(
            id=company.id,
            name=company.name,
            slug=company.slug,
            logo_url=company.logo_url,
            cover_image_url=company.cover_image_url,
            description=company.description,
            rating=0.0,
            review_count=0,
            is_verified=True,
            product_count=0,
            sales_count=0,
        )

        category_dto = None
        if cat:
            category_dto = PublicCategoryRead(
                id=cat.id,
                name=cat.name,
                slug=cat.slug,
                description=cat.description,
                image_url=cat.image_url,
            )

        tags_list = [t.tag for t in product.product_tags] if product.product_tags else []

        badge = None
        if disc >= 20:
            badge = "FLASH SALE"
        elif product.sales_count > 100:
            badge = "BEST SELLER"

        return ProductDetailRead(
            id=product.id,
            name=product.name,
            slug=product.slug,
            sku=product.sku,
            brand=product.brand,
            short_description=product.short_description,
            description=product.description,
            price=product.price,
            sale_price=product.sale_price if product.sale_price and product.sale_price < product.price else None,
            discount_percentage=disc,
            stock=product.stock,
            rating=float(product.rating or 0.0),
            review_count=product.review_count or 0,
            sales_count=product.sales_count or 0,
            is_free_delivery=True,
            badge=badge,
            images=images_list,
            variants=variants_list,
            attributes=attributes_list,
            tags=tags_list,
            company=company_dto,
            category=category_dto,
            specifications=specs_dict,
        )

    @staticmethod
    async def get_product_reviews(session: AsyncSession, product_id: uuid.UUID) -> Tuple[List[ReviewRead], ReviewSummary]:
        stmt = select(Review).where(Review.product_id == product_id, Review.is_hidden == False).order_by(desc(Review.created_at))
        res = await session.execute(stmt)
        reviews_db = res.scalars().all()

        reviews_list = []
        breakdown = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        total_rating_sum = 0

        if reviews_db:
            for r in reviews_db:
                breakdown[r.rating] = breakdown.get(r.rating, 0) + 1
                total_rating_sum += r.rating
                reviews_list.append(
                    ReviewRead(
                        id=r.id,
                        rating=r.rating,
                        comment=r.comment,
                        customer_name="Verified Customer",
                        is_verified_purchase=r.is_verified_purchase,
                        created_at=r.created_at,
                    )
                )

        if not reviews_list:
            summary = ReviewSummary(
                average_rating=0.0,
                total_reviews=0,
                rating_breakdown=breakdown,
            )
            return [], summary

        total_count = len(reviews_list)
        avg_rating = round(total_rating_sum / total_count, 1) if total_count > 0 else 0.0

        summary = ReviewSummary(
            average_rating=avg_rating,
            total_reviews=total_count,
            rating_breakdown=breakdown,
        )

        return reviews_list, summary

    @staticmethod
    async def get_company_detail(session: AsyncSession, slug: str) -> Optional[PublicCompanyRead]:
        stmt = select(Company).where(Company.slug == slug)
        res = await session.execute(stmt)
        company = res.scalar_one_or_none()
        if not company:
            return None

        # Calculate product count
        p_count_stmt = select(func.count(Product.id)).where(Product.company_id == company.id)
        p_res = await session.execute(p_count_stmt)
        p_count = p_res.scalar() or 0

        return PublicCompanyRead(
            id=company.id,
            name=company.name,
            slug=company.slug,
            logo_url=company.logo_url,
            cover_image_url=company.cover_image_url,
            description=company.description,
            rating=0.0,
            review_count=0,
            is_verified=True,
            product_count=p_count,
            sales_count=0,
        )

    @staticmethod
    async def ensure_seed_data(session: AsyncSession):
        """No-op: Database auto-seeding of dummy data is disabled."""
        pass
