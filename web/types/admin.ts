// ===========================================
// ENUMS — mirrors app/models/enums.py exactly
// ===========================================

export enum CompanyStatus {
  PENDING = "pending",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  REJECTED = "rejected",
  BLOCKED = "blocked",
}

export enum ProductStatus {
  PENDING = "pending",
  ACTIVE = "active",
  REJECTED = "rejected",
  DISABLED = "disabled",
}

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
  PARTIALLY_REFUNDED = "partially_refunded",
}

export enum PayoutStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  PAID = "paid",
  FAILED = "failed",
}

export enum DiscountType {
  PERCENTAGE = "percentage",
  FIXED = "fixed",
}

export enum InfluencerStatus {
  PENDING = "pending",
  APPROVED = "approved",
  SUSPENDED = "suspended",
}

export enum CampaignStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  ENDED = "ended",
}

export enum ReportStatus {
  OPEN = "open",
  UNDER_REVIEW = "under_review",
  RESOLVED = "resolved",
  REJECTED = "rejected",
}

export enum TargetType {
  PRODUCT = "product",
  COMPANY = "company",
  REVIEW = "review",
  CUSTOMER = "customer",
  ORDER = "order",
}

export enum CMSStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
}

export enum NotificationTarget {
  ALL_CUSTOMERS = "ALL_CUSTOMERS",
  ALL_COMPANIES = "ALL_COMPANIES",
  SPECIFIC_CUSTOMERS = "SPECIFIC_CUSTOMERS",
  SPECIFIC_COMPANIES = "SPECIFIC_COMPANIES",
}

export enum NotificationStatus {
  PENDING = "pending",
  SENT = "sent",
  FAILED = "failed",
}

export enum BusinessType {
  RETAIL = "Retail",
  WHOLESALE = "Wholesale",
  MANUFACTURER = "Manufacturer",
  BRAND = "Brand",
  DISTRIBUTOR = "Distributor",
  SERVICE = "Service",
  OTHER = "Other",
}

// ===========================================
// GENERIC PAGINATED RESPONSE
// ===========================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ===========================================
// DASHBOARD
// ===========================================

export interface RecentOrderRead {
  id: string;
  customer_email: string;
  company_name: string;
  total: number; // integer cents
  order_status: OrderStatus;
  created_at: string;
}

export interface RecentCompanyRead {
  id: string;
  name: string;
  business_email: string;
  status: CompanyStatus;
  created_at: string;
}

export interface RecentCustomerRead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
}

export interface RecentProductRead {
  id: string;
  name: string;
  price: number; // integer cents
  status: ProductStatus;
  company_name: string;
  created_at: string;
}

export interface DashboardStats {
  total_customers: number;
  total_companies: number;
  active_companies: number;
  pending_companies: number;
  suspended_companies: number;
  total_products: number;
  active_products: number;
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number; // integer cents
  total_gmv: number; // integer cents
  platform_commission: number; // integer cents
  total_coupons: number;
  active_coupons: number;
  total_influencers: number;
  active_campaigns: number;
  pending_refunds: number;
  pending_payouts: number;
  recent_orders: RecentOrderRead[];
  recent_companies: RecentCompanyRead[];
  recent_customers: RecentCustomerRead[];
  recent_products: RecentProductRead[];
}

// ===========================================
// COMPANY
// ===========================================

export interface CompanyOwnerInfo {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
}

export interface CompanyAdminRead {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  business_email: string;
  phone: string;
  logo_url?: string | null;
  website?: string | null;
  business_type: BusinessType;
  status: CompanyStatus;
  is_verified: boolean;
  owner?: CompanyOwnerInfo | null;
  product_count: number;
  order_count: number;
  revenue: number; // integer cents
  created_at: string;
  updated_at: string;
}

export interface CompanyStatusUpdate {
  status?: CompanyStatus;
  reason?: string;
}

// ===========================================
// CUSTOMER
// ===========================================

export interface CustomerAdminRead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  total_orders: number;
  total_spending: number; // integer cents
  created_at: string;
  updated_at: string;
}

export interface CustomerStatusUpdate {
  is_active: boolean;
  reason?: string;
}

// ===========================================
// PRODUCT
// ===========================================

export interface ProductAdminRead {
  id: string;
  company_id: string;
  company_name?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  images: string[];
  price: number; // integer cents
  stock: number;
  status: ProductStatus;
  rejection_reason?: string | null;
  rating: number;
  review_count: number;
  sales_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductModerationRequest {
  status: ProductStatus;
  reason?: string;
}

// ===========================================
// CATEGORY
// ===========================================

export interface CategoryRead {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  parent_id?: string | null;
  is_active: boolean;
  sort_order: number;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  is_active?: boolean;
  sort_order?: number;
}

// ===========================================
// ORDER
// ===========================================

export interface OrderItemRead {
  id: string;
  product_id: string;
  product_name?: string;
  qty: number;
  unit_price_cents: number;
  discount_cents: number;
}

export interface OrderAdminRead {
  id: string;
  customer_id: string;
  customer_name?: string | null;
  customer_email?: string | null;
  company_id: string;
  company_name?: string | null;
  items: OrderItemRead[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number; // integer cents
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  payment_reference?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistoryRead {
  id: string;
  order_id: string;
  previous_status: OrderStatus;
  new_status: OrderStatus;
  changed_by?: string | null;
  reason?: string | null;
  created_at: string;
}

// ===========================================
// PAYMENT
// ===========================================

export interface PaymentAdminRead {
  id: string;
  order_id: string;
  customer_id: string;
  company_id: string;
  amount: number; // integer cents
  currency: string;
  stripe_payment_reference?: string | null;
  status: PaymentStatus;
  created_at: string;
}

// ===========================================
// REFUND
// ===========================================

export interface RefundCreate {
  amount: number; // integer cents
  reason: string;
}

export interface RefundAdminRead {
  id: string;
  order_id: string;
  payment_id: string;
  amount: number; // integer cents
  reason: string;
  processed_by?: string | null;
  created_at: string;
}

// ===========================================
// PAYOUT
// ===========================================

export interface PayoutAdminRead {
  id: string;
  company_id: string;
  company_name?: string | null;
  gross_sales: number;
  platform_commission: number;
  refunds: number;
  net_payable: number;
  status: PayoutStatus;
  payout_date?: string | null;
  created_at: string;
  updated_at: string;
}

// ===========================================
// COUPON
// ===========================================

export interface CouponAdminCreate {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  minimum_order?: number;
  maximum_discount?: number;
  usage_limit?: number;
  per_user_limit?: number;
  start_date?: string;
  expiry_date?: string;
  is_platform?: boolean;
  company_id?: string;
  applicable_categories?: string[];
  applicable_products?: string[];
  applicable_companies?: string[];
  is_active?: boolean;
}

export interface CouponAdminRead {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  minimum_order: number;
  maximum_discount: number;
  usage_limit: number;
  per_user_limit: number;
  usage_count: number;
  start_date?: string | null;
  expiry_date?: string | null;
  is_platform: boolean;
  company_id?: string | null;
  applicable_categories: string[];
  applicable_products: string[];
  applicable_companies: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ===========================================
// INFLUENCER
// ===========================================

export interface InfluencerAdminRead {
  id: string;
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;
  platform: string;
  handle: string;
  followers_count: number;
  status: InfluencerStatus;
  campaign_count: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
}

// ===========================================
// CAMPAIGN
// ===========================================

export interface CampaignAdminRead {
  id: string;
  name: string;
  company_id: string;
  company_name?: string | null;
  influencer_id: string;
  influencer_handle?: string | null;
  coupon_id?: string | null;
  clicks_count: number;
  orders_count: number;
  total_revenue: number;
  commission_amount: number;
  conversion_rate: number;
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
}

// ===========================================
// REVIEW
// ===========================================

export interface ReviewAdminRead {
  id: string;
  product_id: string;
  product_name?: string | null;
  company_id: string;
  company_name?: string | null;
  customer_id: string;
  customer_name?: string | null;
  rating: number;
  comment?: string | null;
  is_verified_purchase: boolean;
  is_hidden: boolean;
  is_reported: boolean;
  created_at: string;
  updated_at: string;
}

// ===========================================
// REPORT
// ===========================================

export interface ReportAdminRead {
  id: string;
  reporter_id: string;
  reporter_name?: string | null;
  target_type: TargetType;
  target_id: string;
  reason: string;
  description?: string | null;
  status: ReportStatus;
  assigned_admin_id?: string | null;
  resolution?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

export interface ReportResolveRequest {
  status: ReportStatus;
  resolution: string;
}

// ===========================================
// CMS
// ===========================================

export interface CMSPageCreate {
  title: string;
  slug: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  status?: CMSStatus;
}

export interface CMSPageRead {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_title?: string | null;
  meta_description?: string | null;
  status: CMSStatus;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CMSSectionRead {
  id: string;
  title: string;
  subtitle?: string | null;
  image_url?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
  section_type: string;
  display_order: number;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BannerCreate {
  title: string;
  subtitle?: string;
  image_url: string;
  cta_text?: string;
  cta_url?: string;
  position?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export interface BannerRead {
  id: string;
  title: string;
  subtitle?: string | null;
  image_url: string;
  cta_text?: string | null;
  cta_url?: string | null;
  position: string;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ===========================================
// NOTIFICATION
// ===========================================

export interface NotificationCreate {
  title: string;
  message: string;
  type?: string;
  target_type: NotificationTarget;
  target_ids?: string[];
  scheduled_at?: string;
}

export interface NotificationRead {
  id: string;
  title: string;
  message: string;
  type: string;
  target_type: NotificationTarget;
  target_ids: string[];
  scheduled_at?: string | null;
  sent_at?: string | null;
  status: NotificationStatus;
  created_at: string;
}

// ===========================================
// ANALYTICS
// ===========================================

export interface AnalyticsTimeSeriesItem {
  date: string;
  value: number;
}

export interface AnalyticsOverview {
  period: string;
  revenue: number;
  orders: number;
  new_customers: number;
  new_companies: number;
  chart_data: AnalyticsTimeSeriesItem[];
}

// ===========================================
// AUDIT LOG
// ===========================================

export interface AuditLogRead {
  id: string;
  admin_user_id?: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  previous_value?: unknown;
  new_value?: unknown;
  reason?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

// ===========================================
// SETTINGS
// ===========================================

export interface PlatformSettingsRead {
  general: Record<string, unknown>;
  commerce: Record<string, unknown>;
  marketplace: Record<string, unknown>;
}

export interface PlatformSettingsUpdate {
  general?: Record<string, unknown>;
  commerce?: Record<string, unknown>;
  marketplace?: Record<string, unknown>;
}

export interface AdminUserRead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUserCreate {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role?: string;
}

// ===========================================
// SHARED QUERY PARAMS
// ===========================================

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface CompanyListParams extends PaginationParams {
  search?: string;
  status?: CompanyStatus;
}

export interface CustomerListParams extends PaginationParams {
  search?: string;
  is_active?: boolean;
}

export interface ProductListParams extends PaginationParams {
  search?: string;
  company_id?: string;
  category_id?: string;
  status?: ProductStatus;
}

export interface OrderListParams extends PaginationParams {
  search?: string;
  payment_status?: PaymentStatus;
  order_status?: OrderStatus;
  company_id?: string;
}

export interface AuditLogListParams extends PaginationParams {
  admin_user_id?: string;
  action?: string;
  resource_type?: string;
}
