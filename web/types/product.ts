export type ProductType = "SIMPLE" | "VARIABLE";
export type BackordersPolicy = "STOP_SELLING" | "ALLOW_BACKORDERS" | "ALLOW_BACKORDERS_WITH_WARNING";
export type ProductVisibility = "PUBLIC" | "HIDDEN";
export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED" | "PENDING" | "REJECTED";
export type CategoryRequestStatus = "PENDING" | "APPROVED" | "REJECTED";
export type RelationType = "RELATED" | "UPSELL" | "CROSS_SELL";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  company_id?: string;
  is_active: boolean;
  sort_order: number;
  product_count?: number;
  created_at?: string;
  updated_at?: string;
  children?: CategoryItem[];
}

export interface CategoryRequest {
  id: string;
  company_id: string;
  name: string;
  parent_id?: string;
  description?: string;
  reason?: string;
  status: CategoryRequestStatus;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductImageItem {
  id?: string;
  url: string;
  cloudinary_public_id?: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductVariantItem {
  id?: string;
  sku?: string;
  price: number; // Integer cents
  sale_price?: number;
  cost_price?: number;
  stock: number;
  low_stock_threshold: number;
  barcode?: string;
  image_url?: string;
  weight?: number;
  attributes: Record<string, string>;
  is_active: boolean;
}

export interface ProductAttributeItem {
  id?: string;
  name: string;
  value: string;
  is_variation: boolean;
}

export interface ProductSEOItem {
  id?: string;
  title?: string;
  description?: string;
  keywords?: string;
}

export interface EnhancedProduct {
  id: string;
  company_id: string;
  category_id?: string;
  product_type: ProductType;
  name: string;
  slug: string;
  sku: string;
  brand?: string;
  short_description?: string;
  description?: string;

  price: number; // Integer cents
  sale_price?: number;
  cost_price?: number;
  tax_setting?: string;

  sale_start_date?: string;
  sale_end_date?: string;

  stock: number;
  low_stock_threshold: number;
  barcode?: string;
  track_inventory: boolean;
  backorders_policy: BackordersPolicy;

  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  shipping_class?: string;

  status: ProductStatus;
  visibility: ProductVisibility;
  rejection_reason?: string;

  rating: number;
  review_count: number;
  sales_count: number;

  discount_amount: number;
  discount_percentage: number;
  profit?: number;
  profit_margin?: number;
  stock_status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  public_url: string;

  images: ProductImageItem[];
  variants: ProductVariantItem[];
  attributes: ProductAttributeItem[];
  tags: string[];
  seo?: ProductSEOItem;
  related_product_ids: string[];

  created_at: string;
  updated_at: string;
}

export interface ProductFormState {
  product_type: ProductType;
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  category_name?: string;
  brand: string;
  short_description: string;
  description: string;

  price: number; // Integer cents
  sale_price?: number;
  cost_price?: number;
  tax_setting: string;

  sale_start_date?: string;
  sale_end_date?: string;

  stock: number;
  low_stock_threshold: number;
  barcode: string;
  track_inventory: boolean;
  backorders_policy: BackordersPolicy;

  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  shipping_class: string;

  status: ProductStatus;
  visibility: ProductVisibility;

  images: ProductImageItem[];
  variants: ProductVariantItem[];
  attributes: ProductAttributeItem[];
  tags: string[];
  seo: ProductSEOItem;
  related_product_ids: string[];
}
