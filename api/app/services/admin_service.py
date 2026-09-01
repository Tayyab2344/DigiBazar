import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select, func, or_, and_, update, delete, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.company import Company
from app.models.address import Address
from app.models.category import Category
from app.models.product import Product
from app.models.order import Order, OrderStatusHistory
from app.models.payment import Payment, Refund
from app.models.payout import Payout
from app.models.coupon import Coupon
from app.models.influencer import Influencer, Campaign
from app.models.review import Review
from app.models.report import Report
from app.models.cms import CMSPage, CMSSection, Banner
from app.models.notification import NotificationRecord
from app.models.setting import PlatformSetting
from app.models.audit_log import AuditLog
from app.models.enums import (
    UserRole,
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
)
from app.core.security import get_password_hash


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AdminService:
    # ==========================================
    # AUDIT LOGGING UTILITY
    # ==========================================
    @staticmethod
    async def log_action(
        db: AsyncSession,
        admin_user_id: Optional[uuid.UUID],
        action: str,
        resource_type: str,
        resource_id: str,
        previous_value: Optional[Any] = None,
        new_value: Optional[Any] = None,
        reason: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        admin_uuid = uuid.UUID(admin_user_id) if isinstance(admin_user_id, str) else admin_user_id
        audit = AuditLog(
            admin_user_id=admin_uuid,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id),
            previous_value=previous_value,
            new_value=new_value,
            reason=reason,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(audit)
        await db.flush()
        return audit

    # ==========================================
    # DASHBOARD API
    # ==========================================
    @staticmethod
    async def get_dashboard_stats(db: AsyncSession) -> Dict[str, Any]:
        stats_stmt = select(
            select(func.count(User.id)).where(User.role == UserRole.CUSTOMER).scalar_subquery().label("total_customers"),
            select(func.count(Company.id)).scalar_subquery().label("total_companies"),
            select(func.count(Company.id)).where(Company.status == CompanyStatus.ACTIVE).scalar_subquery().label("active_companies"),
            select(func.count(Company.id)).where(Company.status == CompanyStatus.PENDING).scalar_subquery().label("pending_companies"),
            select(func.count(Company.id)).where(Company.status == CompanyStatus.SUSPENDED).scalar_subquery().label("suspended_companies"),
            select(func.count(Product.id)).scalar_subquery().label("total_products"),
            select(func.count(Product.id)).where(Product.status == ProductStatus.ACTIVE).scalar_subquery().label("active_products"),
            select(func.count(Order.id)).scalar_subquery().label("total_orders"),
            select(func.count(Order.id)).where(Order.order_status == OrderStatus.PENDING).scalar_subquery().label("pending_orders"),
            select(func.count(Order.id)).where(Order.order_status == OrderStatus.DELIVERED).scalar_subquery().label("completed_orders"),
            select(func.count(Order.id)).where(Order.order_status == OrderStatus.CANCELLED).scalar_subquery().label("cancelled_orders"),
            select(func.coalesce(func.sum(Order.total), 0)).where(Order.payment_status == PaymentStatus.PAID).scalar_subquery().label("total_revenue"),
            select(func.coalesce(func.sum(Order.total), 0)).scalar_subquery().label("total_gmv"),
            select(func.count(Coupon.id)).scalar_subquery().label("total_coupons"),
            select(func.count(Coupon.id)).where(Coupon.is_active.is_(True)).scalar_subquery().label("active_coupons"),
            select(func.count(Influencer.id)).scalar_subquery().label("total_influencers"),
            select(func.count(Campaign.id)).where(Campaign.status == CampaignStatus.ACTIVE).scalar_subquery().label("active_campaigns"),
            select(func.count(Order.id)).where(Order.order_status == OrderStatus.REFUNDED).scalar_subquery().label("pending_refunds"),
            select(func.count(Payout.id)).where(Payout.status == PayoutStatus.PENDING).scalar_subquery().label("pending_payouts"),
        )
        res = await db.execute(stats_stmt)
        (
            total_customers,
            total_companies,
            active_companies,
            pending_companies,
            suspended_companies,
            total_products,
            active_products,
            total_orders,
            pending_orders,
            completed_orders,
            cancelled_orders,
            total_revenue,
            total_gmv,
            total_coupons,
            active_coupons,
            total_influencers,
            active_campaigns,
            pending_refunds,
            pending_payouts,
        ) = res.one()

        platform_commission = int(total_revenue * 0.10)  # 10% platform commission

        # Recent Items
        rec_orders_res = await db.execute(
            select(Order, User.email, Company.name)
            .join(User, Order.customer_id == User.id)
            .join(Company, Order.company_id == Company.id)
            .order_by(Order.created_at.desc())
            .limit(5)
        )
        recent_orders = [
            {
                "id": o.id,
                "customer_email": cust_email,
                "company_name": comp_name,
                "total": o.total,
                "order_status": o.order_status,
                "created_at": o.created_at,
            }
            for o, cust_email, comp_name in rec_orders_res.all()
        ]

        rec_comp_res = await db.execute(select(Company).order_by(Company.created_at.desc()).limit(5))
        recent_companies = [c for c in rec_comp_res.scalars().all()]

        rec_cust_res = await db.execute(
            select(User).where(User.role == UserRole.CUSTOMER).order_by(User.created_at.desc()).limit(5)
        )
        recent_customers = [u for u in rec_cust_res.scalars().all()]

        rec_prod_res = await db.execute(
            select(Product, Company.name)
            .join(Company, Product.company_id == Company.id)
            .order_by(Product.created_at.desc())
            .limit(5)
        )
        recent_products = [
            {
                "id": p.id,
                "name": p.name,
                "price": p.price,
                "status": p.status,
                "company_name": comp_name,
                "created_at": p.created_at,
            }
            for p, comp_name in rec_prod_res.all()
        ]

        return {
            "total_customers": total_customers,
            "total_companies": total_companies,
            "active_companies": active_companies,
            "pending_companies": pending_companies,
            "suspended_companies": suspended_companies,
            "total_products": total_products,
            "active_products": active_products,
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "completed_orders": completed_orders,
            "cancelled_orders": cancelled_orders,
            "total_revenue": total_revenue,
            "total_gmv": total_gmv,
            "platform_commission": platform_commission,
            "total_coupons": total_coupons,
            "active_coupons": active_coupons,
            "total_influencers": total_influencers,
            "active_campaigns": active_campaigns,
            "pending_refunds": pending_refunds,
            "pending_payouts": pending_payouts,
            "recent_orders": recent_orders,
            "recent_companies": recent_companies,
            "recent_customers": recent_customers,
            "recent_products": recent_products,
        }

    # ==========================================
    # COMPANY MANAGEMENT
    # ==========================================
    @staticmethod
    async def list_companies(
        db: AsyncSession,
        search: Optional[str] = None,
        status: Optional[CompanyStatus] = None,
        city: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Dict[str, Any]], int]:
        stmt = select(Company, User).join(User, Company.owner_id == User.id)

        if search:
            stmt = stmt.where(
                or_(
                    Company.name.ilike(f"%{search}%"),
                    Company.business_email.ilike(f"%{search}%"),
                    Company.slug.ilike(f"%{search}%"),
                )
            )

        if status:
            stmt = stmt.where(Company.status == status)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar_one() or 0

        stmt = stmt.order_by(Company.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        rows = (await db.execute(stmt)).all()

        companies_list = []
        for company, owner in rows:
            # Query product count & order stats for company
            p_cnt = (
                await db.execute(select(func.count(Product.id)).where(Product.company_id == company.id))
            ).scalar_one() or 0
            o_cnt = (
                await db.execute(select(func.count(Order.id)).where(Order.company_id == company.id))
            ).scalar_one() or 0
            rev = (
                await db.execute(
                    select(func.coalesce(func.sum(Order.total), 0)).where(
                        Order.company_id == company.id, Order.payment_status == PaymentStatus.PAID
                    )
                )
            ).scalar_one() or 0

            companies_list.append({
                "id": company.id,
                "owner_id": company.owner_id,
                "name": company.name,
                "slug": company.slug,
                "business_email": company.business_email,
                "phone": company.phone,
                "logo_url": company.logo_url,
                "website": company.website,
                "business_type": company.business_type,
                "status": company.status,
                "is_verified": True,
                "owner": {
                    "id": owner.id,
                    "first_name": owner.first_name,
                    "last_name": owner.last_name,
                    "email": owner.email,
                    "phone": owner.phone,
                },
                "product_count": p_cnt,
                "order_count": o_cnt,
                "revenue": rev,
                "created_at": company.created_at,
                "updated_at": company.updated_at,
            })

        return companies_list, total

    @staticmethod
    async def get_company(db: AsyncSession, company_id: uuid.UUID) -> Dict[str, Any]:
        company_uuid = uuid.UUID(str(company_id)) if isinstance(company_id, str) else company_id
        result = await db.execute(
            select(Company, User).join(User, Company.owner_id == User.id).where(Company.id == company_uuid)
        )
        row = result.first()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

        company, owner = row
        p_cnt = (
            await db.execute(select(func.count(Product.id)).where(Product.company_id == company.id))
        ).scalar_one() or 0
        o_cnt = (
            await db.execute(select(func.count(Order.id)).where(Order.company_id == company.id))
        ).scalar_one() or 0
        rev = (
            await db.execute(
                select(func.coalesce(func.sum(Order.total), 0)).where(
                    Order.company_id == company.id, Order.payment_status == PaymentStatus.PAID
                )
            )
        ).scalar_one() or 0

        return {
            "id": company.id,
            "owner_id": company.owner_id,
            "name": company.name,
            "slug": company.slug,
            "business_email": company.business_email,
            "phone": company.phone,
            "logo_url": company.logo_url,
            "website": company.website,
            "business_type": company.business_type,
            "status": company.status,
            "is_verified": True,
            "owner": {
                "id": owner.id,
                "first_name": owner.first_name,
                "last_name": owner.last_name,
                "email": owner.email,
                "phone": owner.phone,
            },
            "product_count": p_cnt,
            "order_count": o_cnt,
            "revenue": rev,
            "created_at": company.created_at,
            "updated_at": company.updated_at,
        }

    @staticmethod
    async def update_company_status(
        db: AsyncSession,
        admin_user: User,
        company_id: uuid.UUID,
        new_status: CompanyStatus,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        company_uuid = uuid.UUID(str(company_id)) if isinstance(company_id, str) else company_id
        company_data = await AdminService.get_company(db, company_uuid)
        current_status = company_data["status"]

        # Validate transition rules
        valid_transitions = {
            CompanyStatus.PENDING: [CompanyStatus.ACTIVE, CompanyStatus.REJECTED],
            CompanyStatus.ACTIVE: [CompanyStatus.SUSPENDED, CompanyStatus.BLOCKED],
            CompanyStatus.SUSPENDED: [CompanyStatus.ACTIVE, CompanyStatus.BLOCKED],
            CompanyStatus.REJECTED: [CompanyStatus.PENDING, CompanyStatus.ACTIVE],
            CompanyStatus.BLOCKED: [CompanyStatus.ACTIVE],
        }

        if new_status not in valid_transitions.get(current_status, []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid company status transition from {current_status.value} to {new_status.value}",
            )

        result = await db.execute(select(Company).where(Company.id == company_uuid))
        company = result.scalar_one()
        company.status = new_status
        await db.commit()

        await AdminService.log_action(
            db=db,
            admin_user_id=admin_user.id,
            action=f"COMPANY_{new_status.name}",
            resource_type="company",
            resource_id=str(company_id),
            previous_value={"status": current_status.value},
            new_value={"status": new_status.value},
            reason=reason,
        )

        return await AdminService.get_company(db, company_id)

    # ==========================================
    # CUSTOMER MANAGEMENT
    # ==========================================
    @staticmethod
    async def list_customers(
        db: AsyncSession,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Dict[str, Any]], int]:
        stmt = select(User).where(User.role == UserRole.CUSTOMER)

        if search:
            stmt = stmt.where(
                or_(
                    User.first_name.ilike(f"%{search}%"),
                    User.last_name.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%"),
                    User.phone.ilike(f"%{search}%"),
                )
            )

        if is_active is not None:
            stmt = stmt.where(User.is_active == is_active)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar_one() or 0

        stmt = stmt.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        users = (await db.execute(stmt)).scalars().all()

        customers_list = []
        for user in users:
            o_cnt = (
                await db.execute(select(func.count(Order.id)).where(Order.customer_id == user.id))
            ).scalar_one() or 0
            spending = (
                await db.execute(
                    select(func.coalesce(func.sum(Order.total), 0)).where(
                        Order.customer_id == user.id, Order.payment_status == PaymentStatus.PAID
                    )
                )
            ).scalar_one() or 0

            customers_list.append({
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role,
                "is_active": user.is_active,
                "is_verified": user.is_verified,
                "total_orders": o_cnt,
                "total_spending": spending,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
            })

        return customers_list, total

    @staticmethod
    async def get_customer(db: AsyncSession, user_id: uuid.UUID) -> Dict[str, Any]:
        result = await db.execute(select(User).where(User.id == user_id, User.role == UserRole.CUSTOMER))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

        o_cnt = (
            await db.execute(select(func.count(Order.id)).where(Order.customer_id == user.id))
        ).scalar_one() or 0
        spending = (
            await db.execute(
                select(func.coalesce(func.sum(Order.total), 0)).where(
                    Order.customer_id == user.id, Order.payment_status == PaymentStatus.PAID
                )
            )
        ).scalar_one() or 0

        return {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "total_orders": o_cnt,
            "total_spending": spending,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }

    @staticmethod
    async def update_customer_status(
        db: AsyncSession,
        admin_user: User,
        user_id: uuid.UUID,
        is_active: bool,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        customer = await AdminService.get_customer(db, user_id)
        prev_active = customer["is_active"]

        result = await db.execute(select(User).where(User.id == user_id, User.role == UserRole.CUSTOMER))
        user = result.scalar_one()
        user.is_active = is_active
        await db.commit()

        action_name = "CUSTOMER_ACTIVATE" if is_active else "CUSTOMER_SUSPEND"
        await AdminService.log_action(
            db=db,
            admin_user_id=admin_user.id,
            action=action_name,
            resource_type="customer",
            resource_id=str(user_id),
            previous_value={"is_active": prev_active},
            new_value={"is_active": is_active},
            reason=reason,
        )

        return await AdminService.get_customer(db, user_id)

    # ==========================================
    # PRODUCT MODERATION & MANAGEMENT
    # ==========================================
    @staticmethod
    async def list_products(
        db: AsyncSession,
        search: Optional[str] = None,
        company_id: Optional[uuid.UUID] = None,
        category_id: Optional[uuid.UUID] = None,
        status: Optional[ProductStatus] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Dict[str, Any]], int]:
        stmt = select(Product, Company.name, Category.name).join(
            Company, Product.company_id == Company.id
        ).outerjoin(Category, Product.category_id == Category.id)

        if search:
            stmt = stmt.where(or_(Product.name.ilike(f"%{search}%"), Product.slug.ilike(f"%{search}%")))
        if company_id:
            stmt = stmt.where(Product.company_id == company_id)
        if category_id:
            stmt = stmt.where(Product.category_id == category_id)
        if status:
            stmt = stmt.where(Product.status == status)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar_one() or 0

        stmt = stmt.order_by(Product.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        rows = (await db.execute(stmt)).all()

        products_list = []
        for p, comp_name, cat_name in rows:
            products_list.append({
                "id": p.id,
                "company_id": p.company_id,
                "company_name": comp_name,
                "category_id": p.category_id,
                "category_name": cat_name,
                "name": p.name,
                "slug": p.slug,
                "description": p.description,
                "images": p.images or [],
                "price": p.price,
                "stock": p.stock,
                "status": p.status,
                "rejection_reason": p.rejection_reason,
                "rating": p.rating,
                "review_count": p.review_count,
                "sales_count": p.sales_count,
                "created_at": p.created_at,
                "updated_at": p.updated_at,
            })

        return products_list, total

    @staticmethod
    async def moderate_product(
        db: AsyncSession,
        admin_user: User,
        product_id: uuid.UUID,
        new_status: ProductStatus,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        result = await db.execute(select(Product).where(Product.id == product_id))
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        prev_status = product.status
        product.status = new_status
        if reason:
            product.rejection_reason = reason

        await db.commit()

        await AdminService.log_action(
            db=db,
            admin_user_id=admin_user.id,
            action=f"PRODUCT_{new_status.name}",
            resource_type="product",
            resource_id=str(product_id),
            previous_value={"status": prev_status.value},
            new_value={"status": new_status.value},
            reason=reason,
        )

        comp_res = await db.execute(select(Company.name).where(Company.id == product.company_id))
        comp_name = comp_res.scalar_one_or_none()

        cat_name = None
        if product.category_id:
            cat_res = await db.execute(select(Category.name).where(Category.id == product.category_id))
            cat_name = cat_res.scalar_one_or_none()

        return {
            "id": product.id,
            "company_id": product.company_id,
            "company_name": comp_name,
            "category_id": product.category_id,
            "category_name": cat_name,
            "name": product.name,
            "slug": product.slug,
            "description": product.description,
            "images": product.images or [],
            "price": product.price,
            "stock": product.stock,
            "status": product.status,
            "rejection_reason": product.rejection_reason,
            "rating": product.rating,
            "review_count": product.review_count,
            "sales_count": product.sales_count,
            "created_at": product.created_at,
            "updated_at": product.updated_at,
        }

    # ==========================================
    # CATEGORY MANAGEMENT
    # ==========================================
    @staticmethod
    async def create_category(db: AsyncSession, admin_user: User, data: Dict[str, Any]) -> Category:
        category = Category(**data)
        db.add(category)
        await db.commit()
        await db.refresh(category)

        await AdminService.log_action(
            db=db,
            admin_user_id=admin_user.id,
            action="CATEGORY_CREATE",
            resource_type="category",
            resource_id=str(category.id),
            new_value={"name": category.name, "slug": category.slug},
        )
        return category

    @staticmethod
    async def delete_category(db: AsyncSession, admin_user: User, category_id: uuid.UUID) -> bool:
        cat_uuid = uuid.UUID(str(category_id)) if isinstance(category_id, str) else category_id
        # Check linked products
        prod_q = await db.execute(select(func.count(Product.id)).where(Product.category_id == cat_uuid))
        prod_count = prod_q.scalar_one() or 0
        if prod_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete category with {prod_count} active products. Reassign or delete products first.",
            )

        cat_q = await db.execute(select(Category).where(Category.id == cat_uuid))
        category = cat_q.scalar_one_or_none()
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

        await db.delete(category)
        await db.commit()

        await AdminService.log_action(
            db=db,
            admin_user_id=admin_user.id,
            action="CATEGORY_DELETE",
            resource_type="category",
            resource_id=str(cat_uuid),
        )
        return True

    # ==========================================
    # REFUNDS & PAYOUTS
    # ==========================================
    @staticmethod
    async def create_refund(
        db: AsyncSession, admin_user: User, order_id: uuid.UUID, amount: int, reason: str
    ) -> Refund:
        order_uuid = uuid.UUID(str(order_id)) if isinstance(order_id, str) else order_id
        order_res = await db.execute(select(Order).where(Order.id == order_uuid))
        order = order_res.scalar_one_or_none()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

        if amount <= 0 or amount > order.total:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid refund amount {amount}. Must be between 1 and order total ({order.total}).",
            )

        pay_res = await db.execute(select(Payment).where(Payment.order_id == order_uuid))
        payment = pay_res.scalar_one_or_none()
        payment_id = payment.id if payment else uuid.uuid4()

        refund = Refund(
            order_id=order_uuid,
            payment_id=payment_id,
            amount=amount,
            reason=reason,
            processed_by=admin_user.id,
        )
        db.add(refund)

        # Update order & payment statuses
        if amount == order.total:
            order.order_status = OrderStatus.REFUNDED
            order.payment_status = PaymentStatus.REFUNDED
            if payment:
                payment.status = PaymentStatus.REFUNDED
        else:
            order.payment_status = PaymentStatus.PARTIALLY_REFUNDED
            if payment:
                payment.status = PaymentStatus.PARTIALLY_REFUNDED

        await db.commit()
        await db.refresh(refund)

        await AdminService.log_action(
            db=db,
            admin_user_id=admin_user.id,
            action="REFUND_CREATE",
            resource_type="refund",
            resource_id=str(refund.id),
            new_value={"order_id": str(order_id), "amount": amount, "reason": reason},
        )

        return refund
