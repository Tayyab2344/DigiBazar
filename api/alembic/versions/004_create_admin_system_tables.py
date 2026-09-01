"""create super admin system tables safely

Revision ID: 004_admin_system_tables
Revises: 003_add_company_address
Create Date: 2026-08-20

"""
from typing import Sequence, Union
from alembic import op

revision: str = '004_admin_system_tables'
down_revision: Union[str, None] = '003_add_company_address'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 0. Clean up any existing legacy tables with conflicting schemas
    tables_to_drop = [
        "platform_settings",
        "notification_records",
        "banners",
        "cms_sections",
        "cms_pages",
        "reports",
        "reviews",
        "campaigns",
        "campaign_coupons",
        "influencers",
        "coupons",
        "payouts",
        "refunds",
        "payments",
        "order_status_histories",
        "order_items",
        "orders",
        "product_images",
        "product_variants",
        "wishlist_items",
        "cart_items",
        "products",
        "categories",
        "audit_logs",
    ]
    for table in tables_to_drop:
        op.execute(f"DROP TABLE IF EXISTS {table} CASCADE;")

    # Drop existing enums to avoid upper/lower case mismatch from legacy DB states
    enums_to_drop = [
        "productstatus",
        "orderstatus",
        "paymentstatus",
        "payoutstatus",
        "discounttype",
        "influencerstatus",
        "campaignstatus",
        "reportstatus",
        "targettype",
        "cmsstatus",
        "notificationtarget",
        "notificationstatus",
    ]
    for enum_type in enums_to_drop:
        op.execute(f"DROP TYPE IF EXISTS {enum_type} CASCADE;")

    # 1. Enums
    enums_to_create = [
        ("productstatus", "('pending', 'active', 'rejected', 'disabled')"),
        ("orderstatus", "('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')"),
        ("paymentstatus", "('pending', 'paid', 'failed', 'refunded', 'partially_refunded')"),
        ("payoutstatus", "('pending', 'processing', 'paid', 'failed')"),
        ("discounttype", "('percentage', 'fixed')"),
        ("influencerstatus", "('pending', 'approved', 'suspended')"),
        ("campaignstatus", "('active', 'paused', 'ended')"),
        ("reportstatus", "('open', 'under_review', 'resolved', 'rejected')"),
        ("targettype", "('product', 'company', 'review', 'customer', 'order')"),
        ("cmsstatus", "('draft', 'published')"),
        ("notificationtarget", "('ALL_CUSTOMERS', 'ALL_COMPANIES', 'SPECIFIC_CUSTOMERS', 'SPECIFIC_COMPANIES')"),
        ("notificationstatus", "('pending', 'sent', 'failed')"),
    ]
    for enum_name, enum_values in enums_to_create:
        op.execute(f"CREATE TYPE {enum_name} AS ENUM {enum_values};")

    # 2. Audit Logs Table
    op.execute("""
    CREATE TABLE audit_logs (
        id VARCHAR(255) PRIMARY KEY,
        admin_user_id VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50) NOT NULL,
        resource_id VARCHAR(255) NOT NULL,
        previous_value JSONB,
        new_value JSONB,
        reason VARCHAR(500),
        ip_address VARCHAR(45),
        user_agent VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)

    # 3. Categories Table
    op.execute("""
    CREATE TABLE categories (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description VARCHAR(500),
        image_url VARCHAR(500),
        parent_id VARCHAR(255) REFERENCES categories(id) ON DELETE SET NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)

    # 4. Products Table
    op.execute("""
    CREATE TABLE products (
        id VARCHAR(255) PRIMARY KEY,
        company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        category_id VARCHAR(255) REFERENCES categories(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        images JSONB,
        price INTEGER NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        status productstatus NOT NULL DEFAULT 'pending',
        rejection_reason VARCHAR(500),
        rating DOUBLE PRECISION NOT NULL DEFAULT 0.0,
        review_count INTEGER NOT NULL DEFAULT 0,
        sales_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)

    # 5. Orders Table
    op.execute("""
    CREATE TABLE orders (
        id VARCHAR(255) PRIMARY KEY,
        customer_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        items JSONB,
        subtotal INTEGER NOT NULL,
        discount INTEGER NOT NULL DEFAULT 0,
        shipping INTEGER NOT NULL DEFAULT 0,
        tax INTEGER NOT NULL DEFAULT 0,
        total INTEGER NOT NULL,
        payment_status paymentstatus NOT NULL DEFAULT 'pending',
        order_status orderstatus NOT NULL DEFAULT 'pending',
        payment_reference VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)

    # 6. Order Status History Table
    op.execute("""
    CREATE TABLE order_status_histories (
        id VARCHAR(255) PRIMARY KEY,
        order_id VARCHAR(255) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        previous_status orderstatus NOT NULL,
        new_status orderstatus NOT NULL,
        changed_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        reason VARCHAR(500),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)

    # 7. Payments Table
    op.execute("""
    CREATE TABLE payments (
        id VARCHAR(255) PRIMARY KEY,
        order_id VARCHAR(255) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        customer_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
        stripe_payment_reference VARCHAR(255),
        status paymentstatus NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)

    # 8. Refunds Table
    op.execute("""
    CREATE TABLE refunds (
        id VARCHAR(255) PRIMARY KEY,
        order_id VARCHAR(255) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        payment_id VARCHAR(255) NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        reason VARCHAR(500) NOT NULL,
        processed_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)

    # 9. Payouts Table
    op.execute("""
    CREATE TABLE payouts (
        id VARCHAR(255) PRIMARY KEY,
        company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        gross_sales INTEGER NOT NULL,
        platform_commission INTEGER NOT NULL DEFAULT 0,
        refunds INTEGER NOT NULL DEFAULT 0,
        net_payable INTEGER NOT NULL,
        status payoutstatus NOT NULL DEFAULT 'pending',
        payout_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)

    # 10. Coupons Table
    op.execute("""
    CREATE TABLE coupons (
        id VARCHAR(255) PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_type discounttype NOT NULL DEFAULT 'fixed',
        discount_value INTEGER NOT NULL,
        minimum_order INTEGER NOT NULL DEFAULT 0,
        maximum_discount INTEGER NOT NULL DEFAULT 0,
        usage_limit INTEGER NOT NULL DEFAULT 0,
        per_user_limit INTEGER NOT NULL DEFAULT 1,
        usage_count INTEGER NOT NULL DEFAULT 0,
        start_date TIMESTAMP WITH TIME ZONE,
        expiry_date TIMESTAMP WITH TIME ZONE,
        is_platform BOOLEAN NOT NULL DEFAULT TRUE,
        company_id VARCHAR(255) REFERENCES companies(id) ON DELETE CASCADE,
        applicable_categories JSONB,
        applicable_products JSONB,
        applicable_companies JSONB,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)

    # 11. Influencers & Campaigns
    op.execute("""
    CREATE TABLE influencers (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        handle VARCHAR(100) NOT NULL,
        followers_count INTEGER NOT NULL DEFAULT 0,
        status influencerstatus NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)

    op.execute("""
    CREATE TABLE campaigns (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        influencer_id VARCHAR(255) NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
        coupon_id VARCHAR(255) REFERENCES coupons(id) ON DELETE SET NULL,
        clicks_count INTEGER NOT NULL DEFAULT 0,
        orders_count INTEGER NOT NULL DEFAULT 0,
        total_revenue INTEGER NOT NULL DEFAULT 0,
        commission_amount INTEGER NOT NULL DEFAULT 0,
        status campaignstatus NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)

    # 12. Reviews Table
    op.execute("""
    CREATE TABLE reviews (
        id VARCHAR(255) PRIMARY KEY,
        product_id VARCHAR(255) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        company_id VARCHAR(255) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        customer_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL,
        comment TEXT,
        is_verified_purchase BOOLEAN NOT NULL DEFAULT TRUE,
        is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
        is_reported BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)

    # 13. Reports Table
    op.execute("""
    CREATE TABLE reports (
        id VARCHAR(255) PRIMARY KEY,
        reporter_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_type targettype NOT NULL,
        target_id VARCHAR(255) NOT NULL,
        reason VARCHAR(255) NOT NULL,
        description TEXT,
        status reportstatus NOT NULL DEFAULT 'open',
        assigned_admin_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        resolution TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        resolved_at TIMESTAMP WITH TIME ZONE
    );
    """)

    # 14. CMS & Banners
    op.execute("""
    CREATE TABLE cms_pages (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content TEXT NOT NULL,
        meta_title VARCHAR(255),
        meta_description VARCHAR(500),
        status cmsstatus NOT NULL DEFAULT 'draft',
        published_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)

    op.execute("""
    CREATE TABLE cms_sections (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        image_url VARCHAR(500),
        cta_text VARCHAR(100),
        cta_url VARCHAR(500),
        section_type VARCHAR(50) NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)

    op.execute("""
    CREATE TABLE banners (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        image_url VARCHAR(500) NOT NULL,
        cta_text VARCHAR(100),
        cta_url VARCHAR(500),
        position VARCHAR(50) NOT NULL DEFAULT 'homepage_hero',
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)

    # 15. Notifications Table
    op.execute("""
    CREATE TABLE notification_records (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'info',
        target_type notificationtarget NOT NULL,
        target_ids JSONB,
        scheduled_at TIMESTAMP WITH TIME ZONE,
        sent_at TIMESTAMP WITH TIME ZONE,
        status notificationstatus NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)

    # 16. Platform Settings Table
    op.execute("""
    CREATE TABLE platform_settings (
        id VARCHAR(255) PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value JSONB NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'general',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)


def downgrade() -> None:
    tables = [
        "platform_settings",
        "notification_records",
        "banners",
        "cms_sections",
        "cms_pages",
        "reports",
        "reviews",
        "campaigns",
        "influencers",
        "coupons",
        "payouts",
        "refunds",
        "payments",
        "order_status_histories",
        "orders",
        "products",
        "categories",
        "audit_logs",
    ]
    for table in tables:
        op.execute(f"DROP TABLE IF EXISTS {table} CASCADE;")
