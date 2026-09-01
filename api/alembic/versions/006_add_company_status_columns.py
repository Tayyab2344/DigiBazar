"""add verification_status and store_status to companies table

Revision ID: 006_add_company_status_columns
Revises: 005_align_addresses_table
Create Date: 2026-08-23

"""
from typing import Sequence, Union
from alembic import op

revision: str = '006_add_company_status_columns'
down_revision: Union[str, None] = '005_align_addresses_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Ensure enum types exist
    op.execute("""
    DO $$ BEGIN
        CREATE TYPE verificationstatus AS ENUM ('pending', 'verified', 'rejected');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
    """)

    op.execute("""
    DO $$ BEGIN
        CREATE TYPE storestatus AS ENUM ('open', 'paused', 'closed');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
    """)

    # 2. Add missing columns to companies table
    op.execute("""
    ALTER TABLE companies 
    ADD COLUMN IF NOT EXISTS verification_status verificationstatus NOT NULL DEFAULT 'pending';
    """)

    op.execute("""
    ALTER TABLE companies 
    ADD COLUMN IF NOT EXISTS store_status storestatus NOT NULL DEFAULT 'open';
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE companies DROP COLUMN IF EXISTS store_status;")
    op.execute("ALTER TABLE companies DROP COLUMN IF EXISTS verification_status;")
