"""One-shot script: create alembic_version, apply migration 010, and stamp."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_Ue1cmkqK9TJr@ep-polished-bonus-ayf8ktqn-pooler.c-5.us-east-2.aws.neon.tech/neondb?ssl=require"

async def main():
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        # 1. Create alembic_version table (with wide enough column)
        print("[1/3] Creating alembic_version table...")
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS alembic_version (
                version_num VARCHAR(255) NOT NULL,
                CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
            );
        """))

        # 2. Apply migration 010: change url columns to TEXT
        print("[2/3] Applying migration 010: changing product_images.url and product_variants.image_url to TEXT...")
        await conn.execute(text(
            "ALTER TABLE product_images ALTER COLUMN url TYPE TEXT;"
        ))
        await conn.execute(text(
            "ALTER TABLE product_variants ALTER COLUMN image_url TYPE TEXT;"
        ))

        # 3. Stamp at 010 (current head)
        print("[3/3] Stamping alembic_version at 010_change_image_url_to_text...")
        await conn.execute(text("DELETE FROM alembic_version;"))
        await conn.execute(text(
            "INSERT INTO alembic_version (version_num) VALUES ('010_change_image_url_to_text');"
        ))

    await engine.dispose()
    print("\nDone! All fixes applied successfully.")
    print("  - alembic_version table created with VARCHAR(255)")
    print("  - product_images.url changed to TEXT")
    print("  - product_variants.image_url changed to TEXT")
    print("  - Alembic stamped at revision 010_change_image_url_to_text")

if __name__ == "__main__":
    asyncio.run(main())
