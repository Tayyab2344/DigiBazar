"""align addresses table with SQLAlchemy model

Revision ID: 005_align_addresses_table
Revises: 004_create_admin_system_tables
Create Date: 2026-08-21

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '005_align_addresses_table'
down_revision: Union[str, None] = '004_admin_system_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename columns that exist under different names
    op.execute("ALTER TABLE addresses RENAME COLUMN address_line1 TO address_line_1;")
    op.execute("ALTER TABLE addresses RENAME COLUMN address_line2 TO address_line_2;")
    op.execute("ALTER TABLE addresses RENAME COLUMN state TO province;")

    # Add missing column: landmark
    op.execute("ALTER TABLE addresses ADD COLUMN IF NOT EXISTS landmark VARCHAR(255);")

    # Drop columns that are not in the current model
    # (user_id, full_name, phone, is_default are not part of the Address model)
    op.execute("ALTER TABLE addresses DROP COLUMN IF EXISTS user_id;")
    op.execute("ALTER TABLE addresses DROP COLUMN IF EXISTS full_name;")
    op.execute("ALTER TABLE addresses DROP COLUMN IF EXISTS phone;")
    op.execute("ALTER TABLE addresses DROP COLUMN IF EXISTS is_default;")


def downgrade() -> None:
    # Reverse: add back dropped columns
    op.execute("ALTER TABLE addresses ADD COLUMN IF NOT EXISTS user_id UUID;")
    op.execute("ALTER TABLE addresses ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);")
    op.execute("ALTER TABLE addresses ADD COLUMN IF NOT EXISTS phone VARCHAR(50);")
    op.execute("ALTER TABLE addresses ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;")

    # Drop added column
    op.execute("ALTER TABLE addresses DROP COLUMN IF EXISTS landmark;")

    # Rename back
    op.execute("ALTER TABLE addresses RENAME COLUMN province TO state;")
    op.execute("ALTER TABLE addresses RENAME COLUMN address_line_2 TO address_line2;")
    op.execute("ALTER TABLE addresses RENAME COLUMN address_line_1 TO address_line1;")
