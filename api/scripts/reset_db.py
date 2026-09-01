import asyncio
import sys
import os

# Add parent directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text, select
from app.core.database import async_engine, AsyncSessionLocal, Base
from app.core.security import hash_password
from app.core.config import settings
from app.models import *  # Ensure all models are registered on Base.metadata
from app.models.user import User
from app.models.enums import UserRole


async def wipe_database_and_seed_admin():
    print("Beginning database reset...")
    async with async_engine.begin() as conn:
        if conn.dialect.name == "sqlite":
            await conn.execute(text("PRAGMA foreign_keys = OFF;"))
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
            await conn.execute(text("PRAGMA foreign_keys = ON;"))
        elif conn.dialect.name == "postgresql":
            await conn.execute(text("DROP SCHEMA public CASCADE;"))
            await conn.execute(text("CREATE SCHEMA public;"))
            await conn.run_sync(Base.metadata.create_all)
        else:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

    print("All tables dropped and recreated.")

    async with AsyncSessionLocal() as session:
        admin_email = settings.SUPER_ADMIN_EMAIL.strip().lower()
        
        res = await session.execute(select(User).where(User.email == admin_email))
        admin = res.scalar_one_or_none()
        if not admin:
            admin = User(
                first_name=settings.SUPER_ADMIN_FIRST_NAME,
                last_name=settings.SUPER_ADMIN_LAST_NAME,
                email=admin_email,
                phone=settings.SUPER_ADMIN_PHONE,
                password_hash=hash_password(settings.SUPER_ADMIN_PASSWORD),
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                is_verified=True,
            )
            session.add(admin)
            await session.commit()
            print(f"Created Super Admin user ({admin_email}).")
        else:
            print(f"Super Admin user already exists ({admin_email}).")

        print("--------------------------------------------------")
        print("Database Reset & Seed Success!")
        print(f"Super Admin Email:    {admin_email}")
        print(f"Super Admin Password: {settings.SUPER_ADMIN_PASSWORD}")
        print("No other users, companies, products, or records exist.")
        print("--------------------------------------------------")


if __name__ == "__main__":
    asyncio.run(wipe_database_and_seed_admin())
