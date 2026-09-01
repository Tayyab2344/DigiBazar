import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.deps.auth import require_super_admin, get_current_user
from app.models.user import User
from app.models.company import Company
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
    CMSStatus,
    NotificationTarget,
    NotificationStatus,
)
from app.schemas.admin import (
    PaginatedResponse,
    DashboardStatsResponse,
    CompanyAdminRead,
    CompanyAdminUpdate,
    CompanyStatusUpdate,
    CustomerAdminRead,
    CustomerAdminUpdate,
    CustomerStatusUpdate,
    ProductAdminRead,
    ProductAdminCreate,
    ProductAdminUpdate,
    ProductModerationRequest,
    CategoryCreate,
    CategoryUpdate,
    CategoryRead,
    OrderAdminRead,
    OrderStatusUpdate,
    PaymentAdminRead,
    RefundCreate,
    RefundAdminRead,
    PayoutAdminRead,
    PayoutActionRequest,
    CouponAdminCreate,
    CouponAdminUpdate,
    CouponAdminRead,
    InfluencerAdminRead,
    CampaignAdminRead,
    ReviewAdminRead,
    ReportAdminRead,
    ReportResolveRequest,
    CMSPageCreate,
    CMSPageUpdate,
    CMSPageRead,
    BannerCreate,
    BannerUpdate,
    BannerRead,
    NotificationCreate,
    NotificationRead,
    AnalyticsOverviewResponse,
    AuditLogRead,
    PlatformSettingsRead,
    PlatformSettingsUpdate,
    AdminUserCreate,
    AdminUserUpdate,
    AdminUserRead,
)
from app.services.admin_service import AdminService
from app.core.security import get_password_hash

router = APIRouter(prefix="/api/v1/admin", tags=["Super Admin"])


# 1. DASHBOARD
@router.get("/dashboard", response_model=DashboardStatsResponse, dependencies=[Depends(require_super_admin)])
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    return await AdminService.get_dashboard_stats(db)


# 2. COMPANIES MANAGEMENT
@router.get("/companies", response_model=PaginatedResponse[CompanyAdminRead], dependencies=[Depends(require_super_admin)])
async def list_companies(
    search: Optional[str] = Query(None),
    status: Optional[CompanyStatus] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    items, total = await AdminService.list_companies(db, search, status, page=page, page_size=page_size)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/companies/{company_id}", response_model=CompanyAdminRead, dependencies=[Depends(require_super_admin)])
async def get_company(company_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await AdminService.get_company(db, company_id)


@router.post("/companies/{company_id}/approve", response_model=CompanyAdminRead)
async def approve_company(
    company_id: uuid.UUID,
    admin_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService.update_company_status(db, admin_user, company_id, CompanyStatus.ACTIVE, "Super Admin Approval")


@router.post("/companies/{company_id}/reject", response_model=CompanyAdminRead)
async def reject_company(
    company_id: uuid.UUID,
    body: Optional[CompanyStatusUpdate] = None,
    admin_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    reason = body.reason if body else "Super Admin Rejection"
    return await AdminService.update_company_status(db, admin_user, company_id, CompanyStatus.REJECTED, reason)


@router.post("/companies/{company_id}/suspend", response_model=CompanyAdminRead)
async def suspend_company(
    company_id: uuid.UUID,
    body: Optional[CompanyStatusUpdate] = None,
    admin_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    reason = body.reason if body else "Super Admin Suspension"
    return await AdminService.update_company_status(db, admin_user, company_id, CompanyStatus.SUSPENDED, reason)


@router.post("/companies/{company_id}/activate", response_model=CompanyAdminRead)
async def activate_company(
    company_id: uuid.UUID,
    admin_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService.update_company_status(db, admin_user, company_id, CompanyStatus.ACTIVE, "Super Admin Activation")


@router.post("/companies/{company_id}/block", response_model=CompanyAdminRead)
async def block_company(
    company_id: uuid.UUID,
    body: Optional[CompanyStatusUpdate] = None,
    admin_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    reason = body.reason if body else "Super Admin Block"
    return await AdminService.update_company_status(db, admin_user, company_id, CompanyStatus.BLOCKED, reason)


# 3. CUSTOMER MANAGEMENT
@router.get("/customers", response_model=PaginatedResponse[CustomerAdminRead], dependencies=[Depends(require_super_admin)])
async def list_customers(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    items, total = await AdminService.list_customers(db, search, is_active, page, page_size)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.get("/customers/{user_id}", response_model=CustomerAdminRead, dependencies=[Depends(require_super_admin)])
async def get_customer(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await AdminService.get_customer(db, user_id)


@router.post("/customers/{user_id}/activate", response_model=CustomerAdminRead)
async def activate_customer(
    user_id: uuid.UUID,
    admin_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService.update_customer_status(db, admin_user, user_id, True, "Super Admin Activation")


@router.post("/customers/{user_id}/suspend", response_model=CustomerAdminRead)
async def suspend_customer(
    user_id: uuid.UUID,
    body: Optional[CustomerStatusUpdate] = None,
    admin_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    reason = body.reason if body else "Super Admin Suspension"
    return await AdminService.update_customer_status(db, admin_user, user_id, False, reason)


@router.post("/customers/{user_id}/block", response_model=CustomerAdminRead)
async def block_customer(
    user_id: uuid.UUID,
    body: Optional[CustomerStatusUpdate] = None,
    admin_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    reason = body.reason if body else "Super Admin Block"
    return await AdminService.update_customer_status(db, admin_user, user_id, False, reason)


# 4. PRODUCT MANAGEMENT
@router.get("/products", response_model=PaginatedResponse[ProductAdminRead], dependencies=[Depends(require_super_admin)])
async def list_products(
    search: Optional[str] = Query(None),
    company_id: Optional[uuid.UUID] = Query(None),
    category_id: Optional[uuid.UUID] = Query(None),
    status: Optional[ProductStatus] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    items, total = await AdminService.list_products(db, search, company_id, category_id, status, page, page_size)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


@router.post("/products/{product_id}/approve", response_model=ProductAdminRead)
async def approve_product(
    product_id: uuid.UUID,
    admin_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService.moderate_product(db, admin_user, product_id, ProductStatus.ACTIVE, "Super Admin Approval")


@router.post("/products/{product_id}/reject", response_model=ProductAdminRead)
async def reject_product(
    product_id: uuid.UUID,
    body: Optional[ProductModerationRequest] = None,
    admin_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    reason = body.reason if body else "Super Admin Rejection"
    return await AdminService.moderate_product(db, admin_user, product_id, ProductStatus.REJECTED, reason)


@router.post("/products/{product_id}/enable", response_model=ProductAdminRead)
async def enable_product(
    product_id: uuid.UUID,
    admin_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService.moderate_product(db, admin_user, product_id, ProductStatus.ACTIVE, "Super Admin Enable")


@router.post("/products/{product_id}/disable", response_model=ProductAdminRead)
async def disable_product(
    product_id: uuid.UUID,
    body: Optional[ProductModerationRequest] = None,
    admin_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    reason = body.reason if body else "Super Admin Disable"
    return await AdminService.moderate_product(db, admin_user, product_id, ProductStatus.DISABLED, reason)


# 5. CATEGORY MANAGEMENT
@router.get("/categories", response_model=List[CategoryRead], dependencies=[Depends(require_super_admin)])
async def list_categories(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Category, func.count(Product.id).label("product_count"))
        .outerjoin(Product, Product.category_id == Category.id)
        .group_by(Category.id)
        .order_by(Category.sort_order.asc(), Category.name.asc())
    )
    res = await db.execute(stmt)
    categories = []
    for cat, count in res.all():
        cat_dict = CategoryRead.model_validate(cat).model_dump()
        cat_dict["product_count"] = count
        categories.append(CategoryRead(**cat_dict))
    return categories


@router.post("/categories", response_model=CategoryRead)
async def create_category(
    payload: CategoryCreate,
    admin_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService.create_category(db, admin_user, payload.model_dump())


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: uuid.UUID,
    admin_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    await AdminService.delete_category(db, admin_user, category_id)
    return {"message": "Category deleted successfully"}


# 6. ORDERS & PAYMENTS & REFUNDS
@router.post("/orders/{order_id}/refund", response_model=RefundAdminRead)
async def process_refund(
    order_id: uuid.UUID,
    payload: RefundCreate,
    admin_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    return await AdminService.create_refund(db, admin_user, order_id, payload.amount, payload.reason)


# 7. AUDIT LOGS
@router.get("/audit-logs", response_model=PaginatedResponse[AuditLogRead], dependencies=[Depends(require_super_admin)])
async def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc())
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one() or 0

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    items = [a for a in (await db.execute(stmt)).scalars().all()]
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedResponse(items=items, total=total, page=page, page_size=page_size, total_pages=total_pages)


# 8. PLATFORM SETTINGS
@router.get("/settings", response_model=PlatformSettingsRead, dependencies=[Depends(require_super_admin)])
async def get_settings(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(PlatformSetting))
    settings_dict = {s.key: s.value for s in res.scalars().all()}
    return PlatformSettingsRead(
        general=settings_dict.get("general", {"platform_name": "digiBazar", "currency": "PKR"}),
        commerce=settings_dict.get("commerce", {"platform_commission": 10, "tax_rate": 0}),
        marketplace=settings_dict.get("marketplace", {"company_approval_required": True, "product_approval_required": True}),
    )


@router.patch("/settings", response_model=PlatformSettingsRead)
async def update_settings(
    payload: PlatformSettingsUpdate,
    admin_user: User = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db),
):
    if payload.general:
        st = (await db.execute(select(PlatformSetting).where(PlatformSetting.key == "general"))).scalar_one_or_none()
        if not st:
            st = PlatformSetting(key="general", value=payload.general, category="general")
            db.add(st)
        else:
            st.value = payload.general

    if payload.commerce:
        st = (await db.execute(select(PlatformSetting).where(PlatformSetting.key == "commerce"))).scalar_one_or_none()
        if not st:
            st = PlatformSetting(key="commerce", value=payload.commerce, category="commerce")
            db.add(st)
        else:
            st.value = payload.commerce

    if payload.marketplace:
        st = (await db.execute(select(PlatformSetting).where(PlatformSetting.key == "marketplace"))).scalar_one_or_none()
        if not st:
            st = PlatformSetting(key="marketplace", value=payload.marketplace, category="marketplace")
            db.add(st)
        else:
            st.value = payload.marketplace

    await db.commit()
    await AdminService.log_action(
        db=db,
        admin_user_id=admin_user.id,
        action="SETTING_UPDATE",
        resource_type="setting",
        resource_id="platform_settings",
        new_value=payload.model_dump(exclude_none=True),
    )
    return await get_settings(db)
