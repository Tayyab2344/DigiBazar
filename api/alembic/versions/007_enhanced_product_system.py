"""enhanced product creation system tables and fields

Revision ID: 007_enhanced_product_system
Revises: 006_add_company_status_columns
Create Date: 2026-08-23

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '007_enhanced_product_system'
down_revision: Union[str, None] = '006_add_company_status_columns'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create Enums IF NOT EXISTS
    op.execute("""
    DO $$ BEGIN
        CREATE TYPE producttype AS ENUM ('SIMPLE', 'VARIABLE');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    """)

    op.execute("""
    DO $$ BEGIN
        CREATE TYPE backorderspolicy AS ENUM ('STOP_SELLING', 'ALLOW_BACKORDERS', 'ALLOW_BACKORDERS_WITH_WARNING');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    """)

    op.execute("""
    DO $$ BEGIN
        CREATE TYPE productvisibility AS ENUM ('PUBLIC', 'HIDDEN');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    """)

    op.execute("""
    DO $$ BEGIN
        CREATE TYPE categoryrequeststatus AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    """)

    op.execute("""
    DO $$ BEGIN
        CREATE TYPE relationtype AS ENUM ('RELATED', 'UPSELL', 'CROSS_SELL');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    """)

    # Update productstatus enum to include draft/archived if missing
    op.execute("""
    DO $$ BEGIN
        ALTER TYPE productstatus ADD VALUE IF NOT EXISTS 'draft';
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    """)
    op.execute("""
    DO $$ BEGIN
        ALTER TYPE productstatus ADD VALUE IF NOT EXISTS 'archived';
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    """)

    # 2. Add columns to products table IF NOT EXISTS
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type producttype NOT NULL DEFAULT 'SIMPLE';")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT;")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price INTEGER;")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price INTEGER;")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_setting VARCHAR(50) DEFAULT 'STANDARD';")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_start_date TIMESTAMP WITH TIME ZONE;")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_end_date TIMESTAMP WITH TIME ZONE;")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 5;")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN NOT NULL DEFAULT TRUE;")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS backorders_policy backorderspolicy NOT NULL DEFAULT 'STOP_SELLING';")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DOUBLE PRECISION;")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS length DOUBLE PRECISION;")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS width DOUBLE PRECISION;")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS height DOUBLE PRECISION;")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_class VARCHAR(100);")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS visibility productvisibility NOT NULL DEFAULT 'PUBLIC';")

    # Populate unique SKU for existing products if any SKU is NULL
    op.execute("UPDATE products SET sku = 'DB-LEGACY-' || SUBSTRING(id::text, 1, 8) WHERE sku IS NULL;")
    op.execute("ALTER TABLE products ALTER COLUMN sku SET NOT NULL;")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_products_sku ON products(sku);")

    # 3. Create category_requests table
    op.execute("""
    CREATE TABLE IF NOT EXISTS category_requests (
        id UUID PRIMARY KEY,
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        description TEXT,
        reason TEXT,
        status categoryrequeststatus NOT NULL DEFAULT 'PENDING',
        admin_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)

    # 4. Create product_images table
    op.execute("""
    CREATE TABLE IF NOT EXISTS product_images (
        id UUID PRIMARY KEY,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        url VARCHAR(1000) NOT NULL,
        cloudinary_public_id VARCHAR(255),
        alt_text VARCHAR(255),
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)

    # 5. Create product_variants table
    op.execute("""
    CREATE TABLE IF NOT EXISTS product_variants (
        id UUID PRIMARY KEY,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        sku VARCHAR(100) UNIQUE NOT NULL,
        price INTEGER NOT NULL,
        sale_price INTEGER,
        cost_price INTEGER,
        stock INTEGER NOT NULL DEFAULT 0,
        low_stock_threshold INTEGER NOT NULL DEFAULT 5,
        barcode VARCHAR(100),
        image_url VARCHAR(1000),
        weight DOUBLE PRECISION,
        attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)

    # 6. Create product_attributes table
    op.execute("""
    CREATE TABLE IF NOT EXISTS product_attributes (
        id UUID PRIMARY KEY,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        value VARCHAR(255) NOT NULL,
        is_variation BOOLEAN NOT NULL DEFAULT FALSE
    );
    """)

    # 7. Create product_tags table
    op.execute("""
    CREATE TABLE IF NOT EXISTS product_tags (
        id UUID PRIMARY KEY,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        tag VARCHAR(100) NOT NULL
    );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_product_tags_tag ON product_tags(tag);")

    # 8. Create product_seos table
    op.execute("""
    CREATE TABLE IF NOT EXISTS product_seos (
        id UUID PRIMARY KEY,
        product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        title VARCHAR(255),
        description VARCHAR(500),
        keywords VARCHAR(500)
    );
    """)

    # 9. Create related_products table
    op.execute("""
    CREATE TABLE IF NOT EXISTS related_products (
        id UUID PRIMARY KEY,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        related_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        relation_type relationtype NOT NULL DEFAULT 'RELATED'
    );
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS related_products CASCADE;")
    op.execute("DROP TABLE IF EXISTS product_seos CASCADE;")
    op.execute("DROP TABLE IF EXISTS product_tags CASCADE;")
    op.execute("DROP TABLE IF EXISTS product_attributes CASCADE;")
    op.execute("DROP TABLE IF EXISTS product_variants CASCADE;")
    op.execute("DROP TABLE IF EXISTS product_images CASCADE;")
    op.execute("DROP TABLE IF EXISTS category_requests CASCADE;")
    op.execute("DROP TYPE IF EXISTS relationtype;")
    op.execute("DROP TYPE IF EXISTS categoryrequeststatus;")
    op.execute("DROP TYPE IF EXISTS productvisibility;")
    op.execute("DROP TYPE IF EXISTS backorderspolicy;")
    op.execute("DROP TYPE IF EXISTS producttype;")
