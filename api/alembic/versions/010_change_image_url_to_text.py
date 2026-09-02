"""change product_images url and product_variants image_url to text

Revision ID: 010_change_image_url_to_text
Revises: 009_discounts_and_campaign_system
Create Date: 2026-09-02

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '010_change_image_url_to_text'
down_revision: Union[str, None] = '009_discounts_and_campaign_system'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE product_images ALTER COLUMN url TYPE TEXT;")
    op.execute("ALTER TABLE product_variants ALTER COLUMN image_url TYPE TEXT;")


def downgrade() -> None:
    op.execute("ALTER TABLE product_images ALTER COLUMN url TYPE VARCHAR(1000);")
    op.execute("ALTER TABLE product_variants ALTER COLUMN image_url TYPE VARCHAR(1000);")
