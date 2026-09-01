"""add addresses, companies, and user relationship columns safely

Revision ID: 003_add_company_address
Revises: 002_add_is_verified_to_users
Create Date: 2026-08-20

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003_add_company_address'
down_revision: Union[str, None] = '002_add_is_verified_to_users'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create Enums for Company model if they do not exist
    op.execute("""
    DO $$ BEGIN
        CREATE TYPE businesstype AS ENUM ('RETAIL', 'WHOLESALE', 'MANUFACTURER', 'DISTRIBUTOR', 'BRAND', 'SERVICE');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
    """)

    op.execute("""
    DO $$ BEGIN
        CREATE TYPE companystatus AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
    """)

    # 2. Create addresses table IF NOT EXISTS
    op.execute("""
    CREATE TABLE IF NOT EXISTS addresses (
        id UUID PRIMARY KEY,
        address_line_1 VARCHAR(255) NOT NULL,
        address_line_2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        province VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20) NOT NULL,
        country VARCHAR(100) NOT NULL DEFAULT 'Pakistan',
        landmark VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)

    # 3. Create companies table IF NOT EXISTS
    op.execute("""
    CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY,
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        business_email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        logo_url VARCHAR(500),
        website VARCHAR(255),
        business_type businesstype NOT NULL DEFAULT 'RETAIL',
        status companystatus NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    );
    """)

    # 4. Add address_id and company_id columns to users table IF NOT EXISTS
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS address_id VARCHAR(255);")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id VARCHAR(255);")


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS company_id;")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS address_id;")
    op.execute("DROP TABLE IF EXISTS companies;")
    op.execute("DROP TABLE IF EXISTS addresses;")
    op.execute("DROP TYPE IF EXISTS companystatus;")
    op.execute("DROP TYPE IF EXISTS businesstype;")
