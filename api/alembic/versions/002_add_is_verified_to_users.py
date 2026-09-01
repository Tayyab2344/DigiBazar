"""add is_verified column to users table

Revision ID: 002_add_is_verified_to_users
Revises: 001_create_users_table
Create Date: 2026-08-20

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_add_is_verified_to_users'
down_revision: Union[str, None] = '001_create_users_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;")


def downgrade() -> None:
    op.drop_column('users', 'is_verified')
