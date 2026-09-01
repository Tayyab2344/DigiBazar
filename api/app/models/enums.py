import enum


class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    COMPANY = "COMPANY"
    SUPER_ADMIN = "SUPER_ADMIN"


class BusinessType(str, enum.Enum):
    RETAIL = "Retail"
    WHOLESALE = "Wholesale"
    MANUFACTURER = "Manufacturer"
    BRAND = "Brand"
    DISTRIBUTOR = "Distributor"
    SERVICE = "Service"
    OTHER = "Other"


class CompanyStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REJECTED = "rejected"
    BLOCKED = "blocked"


class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class StoreStatus(str, enum.Enum):
    OPEN = "open"
    PAUSED = "paused"
    CLOSED = "closed"


class InventoryMovementType(str, enum.Enum):
    RESTOCK = "restock"
    SALE = "sale"
    RETURN = "return"
    ADJUSTMENT = "adjustment"
    DAMAGE = "damage"
    CANCELLATION = "cancellation"


class ProductType(str, enum.Enum):
    SIMPLE = "SIMPLE"
    VARIABLE = "VARIABLE"


class ProductStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"
    PENDING = "pending"
    REJECTED = "rejected"
    DISABLED = "disabled"


class BackordersPolicy(str, enum.Enum):
    STOP_SELLING = "STOP_SELLING"
    ALLOW_BACKORDERS = "ALLOW_BACKORDERS"
    ALLOW_BACKORDERS_WITH_WARNING = "ALLOW_BACKORDERS_WITH_WARNING"


class ProductVisibility(str, enum.Enum):
    PUBLIC = "PUBLIC"
    HIDDEN = "HIDDEN"


class CategoryRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class RelationType(str, enum.Enum):
    RELATED = "RELATED"
    UPSELL = "UPSELL"
    CROSS_SELL = "CROSS_SELL"



class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class PayoutStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    PAID = "paid"
    FAILED = "failed"


class DiscountType(str, enum.Enum):
    PERCENTAGE = "PERCENTAGE"
    FIXED_AMOUNT = "FIXED_AMOUNT"
    FIXED = "FIXED"


class DiscountScope(str, enum.Enum):
    STORE = "STORE"
    PRODUCTS = "PRODUCTS"
    CATEGORIES = "CATEGORIES"


class CommissionType(str, enum.Enum):
    PERCENTAGE = "PERCENTAGE"
    FIXED = "FIXED"


class AttributionStatus(str, enum.Enum):
    ATTRIBUTED = "ATTRIBUTED"
    CONVERTED = "CONVERTED"
    EXPIRED = "EXPIRED"


class InfluencerStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    SUSPENDED = "suspended"


class CampaignStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    ENDED = "ended"


class ReportStatus(str, enum.Enum):
    OPEN = "open"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    REJECTED = "rejected"


class TargetType(str, enum.Enum):
    PRODUCT = "product"
    COMPANY = "company"
    REVIEW = "review"
    CUSTOMER = "customer"
    ORDER = "order"


class CMSStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


class NotificationTarget(str, enum.Enum):
    ALL_CUSTOMERS = "ALL_CUSTOMERS"
    ALL_COMPANIES = "ALL_COMPANIES"
    SPECIFIC_CUSTOMERS = "SPECIFIC_CUSTOMERS"
    SPECIFIC_COMPANIES = "SPECIFIC_COMPANIES"


class NotificationStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class AdminRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    MODERATOR = "MODERATOR"
    SUPPORT = "SUPPORT"
