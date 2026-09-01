export type CompanyStatus = "pending" | "active" | "suspended" | "blocked";
export type ProductStatus = "active" | "draft" | "archived" | "pending" | "rejected";
export type OrderStatus = "pending" | "confirmed" | "processing" | "packed" | "shipped" | "delivered" | "cancelled" | "refunded";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
export type DiscountType = "percentage" | "fixed";
export type CampaignStatus = "draft" | "active" | "completed" | "cancelled";
export type InventoryMovementType = "restock" | "sale" | "return" | "adjustment" | "damage";

export interface CompanyProfileRead {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  legal_name?: string | null;
  business_email: string;
  phone: string;
  logo_url?: string | null;
  cover_image_url?: string | null;
  description?: string | null;
  website?: string | null;
  tax_identifier?: string | null;
  registration_number?: string | null;
  business_type?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  verification_status: string;
  store_status: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyProfileUpdate {
  name?: string;
  legal_name?: string;
  business_email?: string;
  phone?: string;
  logo_url?: string;
  cover_image_url?: string;
  description?: string;
  website?: string;
  tax_identifier?: string;
  registration_number?: string;
  business_type?: string;
  address?: string;
  city?: string;
  country?: string;
  store_status?: string;
}

export interface CompanyDashboardStats {
  total_products: number;
  active_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  total_orders: number;
  gross_revenue: number;
  discounts_given: number;
  pending_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  refunded_orders: number;
  total_customers: number;
  total_reviews: number;
  avg_rating: number;
  conversion_rate?: number;
  average_order_value?: number;
}

export interface CompanyProductRead {
  id: string;
  company_id: string;
  category_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  short_description?: string | null;
  sku?: string | null;
  brand?: string | null;
  price: number;
  compare_at_price?: number | null;
  cost_price?: number | null;
  stock: number;
  low_stock_threshold?: number;
  status: ProductStatus;
  images: string[];
  rating: number;
  review_count: number;
  sales_count: number;
  created_at: string;
  updated_at: string;
}

export interface CompanyProductCreate {
  category_id?: string;
  name: string;
  description?: string;
  short_description?: string;
  sku?: string;
  brand?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  stock: number;
  low_stock_threshold?: number;
  images?: string[];
  status?: ProductStatus;
}

export interface InventoryUpdate {
  product_id: string;
  stock: number;
  reason?: string;
}

export interface InventoryMovementRead {
  id: string;
  company_id: string;
  product_id: string;
  product_name?: string;
  movement_type: InventoryMovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason?: string | null;
  created_at: string;
}

export interface CompanyOrderItem {
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  variant?: string;
}

export interface CompanyOrderRead {
  id: string;
  customer_id: string;
  company_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  items: CompanyOrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  shipping_address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CompanyCustomerRead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  orders_count: number;
  total_orders?: number;
  total_spent: number;
  total_spending?: number;
  first_order_at?: string | null;
  last_order_at?: string | null;
  created_at?: string | null;
}

export interface CompanyCouponRead {
  id: string;
  company_id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  minimum_order: number;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  uses_count: number;
  is_active: boolean;
  expires_at?: string | null;
  created_at: string;
}

export interface CompanyCouponCreate {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  minimum_order?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  expires_at?: string;
}

export interface CompanyCampaignRead {
  id: string;
  company_id: string;
  name: string;
  description?: string | null;
  influencer_id?: string | null;
  influencer_name?: string;
  coupon_code: string;
  commission_rate: number;
  budget: number;
  revenue_generated: number;
  orders_count: number;
  status: CampaignStatus;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
}

export interface CompanyCampaignCreate {
  name: string;
  description?: string;
  influencer_id?: string;
  coupon_code: string;
  commission_rate: number;
  budget: number;
  start_date?: string;
  end_date?: string;
}

export interface CompanyReviewRead {
  id: string;
  company_id: string;
  product_id: string;
  product_name: string;
  customer_name: string;
  rating: number;
  comment: string;
  verified_purchase: boolean;
  reply?: string | null;
  reply_at?: string | null;
  created_at: string;
}

export interface TeamMemberRead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: "owner" | "manager" | "product_manager" | "order_manager" | "marketing_manager";
  status: "active" | "invited" | "inactive";
  last_active?: string | null;
  created_at: string;
}

export interface CompanyPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
