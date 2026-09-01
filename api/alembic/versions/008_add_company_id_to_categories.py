"""add company_id to categories table

Revision ID: 008_add_company_id_to_categories
Revises: 007_enhanced_product_system
Create Date: 2026-08-25

"""
from typing import Sequence, Union
from alembic import op

revision: str = '008_add_company_id_to_categories'
down_revision: Union[str, None] = '007_enhanced_product_system'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
    ALTER TABLE categories 
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
    """)
    op.execute("""
    CREATE INDEX IF NOT EXISTS ix_categories_company_id ON categories(company_id);
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_categories_company_id;")
    op.execute("ALTER TABLE categories DROP COLUMN IF EXISTS company_id;")
