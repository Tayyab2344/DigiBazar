import uuid
import re
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, model_validator, field_validator, ConfigDict

from app.models.enums import UserRole, BusinessType


class AddressSchema(BaseModel):
    address_line_1: str = Field(..., min_length=1, max_length=255, description="House / Flat / Street address")
    address_line_2: Optional[str] = Field(None, max_length=255, description="Apartment, suite, floor, etc.")
    city: str = Field(..., min_length=1, max_length=100, description="City")
    province: str = Field(..., min_length=1, max_length=100, description="Province / State")
    postal_code: str = Field(..., min_length=1, max_length=20, description="Postal code")
    country: str = Field("Pakistan", min_length=1, max_length=100, description="Country")
    landmark: Optional[str] = Field(None, max_length=255, description="Nearby landmark")


class CustomerRegisterRequest(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100, description="First name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Last name")
    email: EmailStr = Field(..., description="Customer email address")
    phone: str = Field(..., min_length=5, max_length=50, description="Phone number")
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")
    confirm_password: str = Field(..., description="Confirm password")
    address: AddressSchema = Field(..., description="Primary delivery address")

    @field_validator("email", mode="after")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @model_validator(mode="after")
    def validate_customer_data(self) -> "CustomerRegisterRequest":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        if not re.search(r"[A-Z]", self.password):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", self.password):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", self.password):
            raise ValueError("Password must contain at least one number")
        return self


class CompanyOwnerSchema(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100, description="Owner first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Owner last name")
    email: EmailStr = Field(..., description="Owner account email")
    phone: str = Field(..., min_length=5, max_length=50, description="Owner phone number")

    @field_validator("email", mode="after")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class CompanyRegisterRequest(BaseModel):
    business_name: str = Field(..., min_length=1, max_length=255, description="Business public name")
    business_email: EmailStr = Field(..., description="Business contact email")
    business_phone: str = Field(..., min_length=5, max_length=50, description="Business contact phone")
    business_logo: Optional[str] = Field(None, description="Business logo image URL")
    website: Optional[str] = Field(None, max_length=255, description="Website URL")
    business_type: str = Field(..., min_length=1, max_length=100, description="Business type (e.g. Retail, Wholesale)")
    address: AddressSchema = Field(..., description="Business physical address")
    owner: CompanyOwnerSchema = Field(..., description="Company account owner information")
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")
    confirm_password: str = Field(..., description="Confirm password")

    @field_validator("business_email", mode="after")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @model_validator(mode="after")
    def validate_company_data(self) -> "CompanyRegisterRequest":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        if not re.search(r"[A-Z]", self.password):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", self.password):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", self.password):
            raise ValueError("Password must contain at least one number")
        return self


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")

    @field_validator("email", mode="after")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password (min 8 characters)")
    confirm_new_password: str = Field(..., description="Confirm new password")

    @model_validator(mode="after")
    def check_new_passwords_match(self) -> "ChangePasswordRequest":
        if self.new_password != self.confirm_new_password:
            raise ValueError("New password and confirm new password do not match")
        return self


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Account email address")

    @field_validator("email", mode="after")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class ResetPasswordRequest(BaseModel):
    reset_token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, description="New password (min 8 characters)")
    confirm_new_password: str = Field(..., description="Confirm new password")

    @model_validator(mode="after")
    def check_new_passwords_match(self) -> "ResetPasswordRequest":
        if self.new_password != self.confirm_new_password:
            raise ValueError("New password and confirm new password do not match")
        return self


class UserResponse(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    is_verified: bool
    company_id: Optional[uuid.UUID] = None

    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MessageResponse(BaseModel):
    message: str
    reset_token: Optional[str] = None
