import asyncio
from typing import AsyncGenerator
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.services.auth_service import AuthService

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide clean database session per test function."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        # Seed Super Admin
        await AuthService.seed_super_admin(session)
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Provide AsyncClient pointing to test FastAPI app with DB override."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def async_client(client: AsyncClient) -> AsyncClient:
    return client


@pytest_asyncio.fixture(scope="function")
async def company_headers(db_session: AsyncSession) -> dict:
    from app.models.user import User
    from app.models.company import Company
    from app.models.enums import UserRole, CompanyStatus
    from app.core.security import hash_password, create_access_token

    owner = User(
        first_name="Enhanced",
        last_name="Vendor",
        email="enhancedvendor@example.com",
        password_hash=hash_password("Password123!"),
        role=UserRole.COMPANY,
        is_active=True,
    )
    db_session.add(owner)
    await db_session.commit()
    await db_session.refresh(owner)

    company = Company(
        owner_id=owner.id,
        name="Enhanced Store",
        slug="enhanced-store",
        business_email="enhanced@example.com",
        phone="+1999999999",
        status=CompanyStatus.ACTIVE,
    )
    db_session.add(company)
    await db_session.commit()

    token = create_access_token({"sub": str(owner.id), "user_id": str(owner.id), "role": "COMPANY"})
    return {"Authorization": f"Bearer {token}"}
