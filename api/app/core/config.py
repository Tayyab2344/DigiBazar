import json
from typing import List, Union
from pydantic import Field, AliasChoices, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "digiBazar API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database settings
    DATABASE_URL: str = "sqlite+aiosqlite:///./commercehub.db"

    # JWT Settings (supports SECRET_KEY or JWT_SECRET_KEY)
    JWT_SECRET_KEY: str = Field(
        "super-secret-jwt-key-change-this-in-production-1234567890!",
        validation_alias=AliasChoices("SECRET_KEY", "JWT_SECRET_KEY")
    )
    JWT_ALGORITHM: str = Field(
        "HS256",
        validation_alias=AliasChoices("ALGORITHM", "JWT_ALGORITHM")
    )
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        1440,
        validation_alias=AliasChoices("ACCESS_TOKEN_EXPIRE_MINUTES", "JWT_ACCESS_TOKEN_EXPIRE_MINUTES")
    )

    # Password Reset Settings
    RESET_TOKEN_EXPIRE_MINUTES: int = 15

    # Super Admin Seed Settings
    SUPER_ADMIN_EMAIL: str = "admin@commercehub.com"
    SUPER_ADMIN_PASSWORD: str = "SuperAdmin123!"
    SUPER_ADMIN_FIRST_NAME: str = "Super"
    SUPER_ADMIN_LAST_NAME: str = "Admin"
    SUPER_ADMIN_PHONE: str = "+10000000000"

    # CORS settings
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Integrations
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
