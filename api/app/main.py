from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.core.database import async_engine, Base, AsyncSessionLocal
from app.routers.auth import router as auth_router
from app.routers.upload import router as upload_router
from app.routers.admin import router as admin_router
from app.routers.company import router as company_router
from app.routers.public import router as public_router
from app.routers.orders import router as orders_router
from app.routers.coupons import router as coupons_router
from app.routers.campaigns import router as campaigns_router
from app.routers.tracking import router as tracking_router
from app.services.auth_service import AuthService
from app.services.public_service import PublicService


from sqlalchemy import text

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        statements = [
            "ALTER TABLE companies ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255);",
            "ALTER TABLE companies ADD COLUMN IF NOT EXISTS description TEXT;",
            "ALTER TABLE companies ADD COLUMN IF NOT EXISTS cover_image_url TEXT;",
            "ALTER TABLE companies ADD COLUMN IF NOT EXISTS website VARCHAR(255);",
            "ALTER TABLE companies ADD COLUMN IF NOT EXISTS tax_identifier VARCHAR(100);",
            "ALTER TABLE companies ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);",
            "ALTER TABLE companies ALTER COLUMN logo_url TYPE TEXT;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS address_id UUID;",
            "ALTER TABLE addresses ADD COLUMN IF NOT EXISTS landmark VARCHAR(255);",
            "ALTER TABLE addresses ADD COLUMN IF NOT EXISTS address_line_2 VARCHAR(255);",
        ]
        for stmt in statements:
            try:
                await conn.execute(text(stmt))
            except Exception:
                pass
    
    async with AsyncSessionLocal() as session:
        await AuthService.seed_super_admin(session)
        
    yield
    # Shutdown actions
    await async_engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# CORS middleware
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]
if isinstance(settings.CORS_ORIGINS, list):
    origins.extend([o for o in settings.CORS_ORIGINS if o not in origins])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Unhandled Exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
    )

# Include routers
app.include_router(public_router)
app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(admin_router)
app.include_router(company_router)
app.include_router(orders_router)
app.include_router(coupons_router)
app.include_router(campaigns_router)
app.include_router(tracking_router)





@app.get("/", tags=["health"])
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
    }


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "healthy"}
