"""discounts and campaign system

Revision ID: 009_discounts_and_campaign_system
Revises: 008_add_company_id_to_categories
Create Date: 2026-08-30

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '009_discounts_and_campaign_system'
down_revision: Union[str, None] = '008_add_company_id_to_categories'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    if is_postgres:
        op.execute("""
        DO $$ BEGIN
            CREATE TYPE discountscope AS ENUM ('STORE', 'PRODUCTS', 'CATEGORIES');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        """)

        op.execute("""
        DO $$ BEGIN
            CREATE TYPE commissiontype AS ENUM ('PERCENTAGE', 'FIXED');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        """)

        op.execute("""
        DO $$ BEGIN
            CREATE TYPE attributionstatus AS ENUM ('ATTRIBUTED', 'CONVERTED', 'EXPIRED');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        """)

    # 2. Update Coupons table
    try:
        op.add_column('coupons', sa.Column('campaign_id', sa.UUID(), sa.ForeignKey('campaigns.id', ondelete='SET NULL'), nullable=True))
    except Exception:
        pass
    try:
        op.add_column('coupons', sa.Column('name', sa.String(length=100), nullable=True, server_default='Coupon'))
    except Exception:
        pass
    try:
        op.add_column('coupons', sa.Column('description', sa.String(length=500), nullable=True))
    except Exception:
        pass
    try:
        op.add_column('coupons', sa.Column('scope', sa.String(length=20), nullable=True, server_default='STORE'))
    except Exception:
        pass
    try:
        op.add_column('coupons', sa.Column('minimum_order_amount', sa.Integer(), nullable=True, server_default='0'))
    except Exception:
        pass
    try:
        op.add_column('coupons', sa.Column('maximum_discount_amount', sa.Integer(), nullable=True, server_default='0'))
    except Exception:
        pass
    try:
        op.add_column('coupons', sa.Column('per_customer_limit', sa.Integer(), nullable=True, server_default='1'))
    except Exception:
        pass

    # 3. Create coupon_products table
    try:
        op.create_table(
            'coupon_products',
            sa.Column('coupon_id', sa.UUID(), sa.ForeignKey('coupons.id', ondelete='CASCADE'), primary_key=True),
            sa.Column('product_id', sa.UUID(), sa.ForeignKey('products.id', ondelete='CASCADE'), primary_key=True)
        )
    except Exception:
        pass

    # 4. Create coupon_categories table
    try:
        op.create_table(
            'coupon_categories',
            sa.Column('coupon_id', sa.UUID(), sa.ForeignKey('coupons.id', ondelete='CASCADE'), primary_key=True),
            sa.Column('category_id', sa.UUID(), sa.ForeignKey('categories.id', ondelete='CASCADE'), primary_key=True)
        )
    except Exception:
        pass

    # 5. Create coupon_usages table
    try:
        op.create_table(
            'coupon_usages',
            sa.Column('id', sa.UUID(), primary_key=True),
            sa.Column('coupon_id', sa.UUID(), sa.ForeignKey('coupons.id', ondelete='CASCADE'), nullable=False),
            sa.Column('user_id', sa.UUID(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('order_id', sa.UUID(), sa.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False),
            sa.Column('discount_amount', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now())
        )
        op.create_index('ix_coupon_usages_coupon_id', 'coupon_usages', ['coupon_id'])
        op.create_index('ix_coupon_usages_user_id', 'coupon_usages', ['user_id'])
    except Exception:
        pass

    # 6. Update Campaigns table
    try:
        op.add_column('campaigns', sa.Column('description', sa.String(length=500), nullable=True))
    except Exception:
        pass
    try:
        op.add_column('campaigns', sa.Column('discount_type', sa.String(length=20), nullable=True, server_default='PERCENTAGE'))
    except Exception:
        pass
    try:
        op.add_column('campaigns', sa.Column('discount_value', sa.Integer(), nullable=True, server_default='0'))
    except Exception:
        pass
    try:
        op.add_column('campaigns', sa.Column('scope', sa.String(length=20), nullable=True, server_default='STORE'))
    except Exception:
        pass
    try:
        op.add_column('campaigns', sa.Column('commission_type', sa.String(length=20), nullable=True, server_default='PERCENTAGE'))
    except Exception:
        pass
    try:
        op.add_column('campaigns', sa.Column('commission_value', sa.Integer(), nullable=True, server_default='0'))
    except Exception:
        pass
    try:
        op.add_column('campaigns', sa.Column('tracking_code', sa.String(length=50), nullable=True))
    except Exception:
        pass
    try:
        op.add_column('campaigns', sa.Column('tracking_url', sa.String(length=255), nullable=True))
    except Exception:
        pass
    try:
        op.add_column('campaigns', sa.Column('start_date', sa.DateTime(timezone=True), nullable=True))
    except Exception:
        pass
    try:
        op.add_column('campaigns', sa.Column('end_date', sa.DateTime(timezone=True), nullable=True))
    except Exception:
        pass
    try:
        op.add_column('campaigns', sa.Column('is_active', sa.Boolean(), nullable=True, server_default='1'))
    except Exception:
        pass
    try:
        op.add_column('campaigns', sa.Column('clicks', sa.Integer(), nullable=True, server_default='0'))
    except Exception:
        pass

    # 7. Create campaign_products table
    try:
        op.create_table(
            'campaign_products',
            sa.Column('campaign_id', sa.UUID(), sa.ForeignKey('campaigns.id', ondelete='CASCADE'), primary_key=True),
            sa.Column('product_id', sa.UUID(), sa.ForeignKey('products.id', ondelete='CASCADE'), primary_key=True)
        )
    except Exception:
        pass

    # 8. Create campaign_categories table
    try:
        op.create_table(
            'campaign_categories',
            sa.Column('campaign_id', sa.UUID(), sa.ForeignKey('campaigns.id', ondelete='CASCADE'), primary_key=True),
            sa.Column('category_id', sa.UUID(), sa.ForeignKey('categories.id', ondelete='CASCADE'), primary_key=True)
        )
    except Exception:
        pass

    # 9. Create campaign_attributions table
    try:
        op.create_table(
            'campaign_attributions',
            sa.Column('id', sa.UUID(), primary_key=True),
            sa.Column('session_id', sa.String(length=100), nullable=False),
            sa.Column('customer_id', sa.UUID(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
            sa.Column('campaign_id', sa.UUID(), sa.ForeignKey('campaigns.id', ondelete='CASCADE'), nullable=False),
            sa.Column('influencer_id', sa.UUID(), sa.ForeignKey('influencers.id', ondelete='CASCADE'), nullable=False),
            sa.Column('company_id', sa.UUID(), sa.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False),
            sa.Column('tracking_code', sa.String(length=50), nullable=False),
            sa.Column('first_click_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column('last_click_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('order_id', sa.UUID(), sa.ForeignKey('orders.id', ondelete='SET NULL'), nullable=True),
            sa.Column('conversion_status', sa.String(length=20), nullable=False, server_default='ATTRIBUTED'),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now())
        )
        op.create_index('ix_campaign_attributions_session_id', 'campaign_attributions', ['session_id'])
        op.create_index('ix_campaign_attributions_customer_id', 'campaign_attributions', ['customer_id'])
        op.create_index('ix_campaign_attributions_campaign_id', 'campaign_attributions', ['campaign_id'])
        op.create_index('ix_campaign_attributions_tracking_code', 'campaign_attributions', ['tracking_code'])
    except Exception:
        pass


def downgrade() -> None:
    try:
        op.drop_table('campaign_attributions')
    except Exception:
        pass
    try:
        op.drop_table('campaign_categories')
    except Exception:
        pass
    try:
        op.drop_table('campaign_products')
    except Exception:
        pass
    try:
        op.drop_table('coupon_usages')
    except Exception:
        pass
    try:
        op.drop_table('coupon_categories')
    except Exception:
        pass
    try:
        op.drop_table('coupon_products')
    except Exception:
        pass
