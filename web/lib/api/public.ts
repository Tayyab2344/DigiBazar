import { apiClient } from "./client";

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  product_count: number;
}

export interface PublicCompany {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  cover_image_url?: string;
  description?: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  product_count: number;
  sales_count: number;
}

export interface PublicProductImage {
  id: string;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
}

export interface PublicVariant {
  id: string;
  sku: string;
  price: number; // in integer cents
  sale_price?: number;
  stock: number;
  attributes: Record<string, string>;
  image_url?: string;
  is_active: boolean;
}

export interface PublicAttribute {
  name: string;
  value: string;
  is_variation: boolean;
}

export interface PublicProductCard {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  price: number; // integer cents
  sale_price?: number;
  discount_percentage: number;
  rating: number;
  review_count: number;
  sales_count?: number;
  stock: number;
  is_free_delivery: boolean;
  badge?: string; // BEST SELLER, NEW, SALE, LIMITED STOCK
  primary_image: string;
  hover_image?: string;
  company_id: string;
  company_name: string;
  company_slug: string;
  company_is_verified: boolean;
  category_name?: string;
  category_slug?: string;
  created_at: string;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  brand?: string;
  short_description?: string;
  description?: string;
  price: number;
  sale_price?: number;
  discount_percentage: number;
  stock: number;
  rating: number;
  review_count: number;
  sales_count: number;
  is_free_delivery: boolean;
  badge?: string;
  images: PublicProductImage[];
  variants: PublicVariant[];
  attributes: PublicAttribute[];
  tags: string[];
  company: PublicCompany;
  category?: PublicCategory;
  specifications: Record<string, string>;
  warranty_info: string;
  return_info: string;
  shipping_info: string;
}

export interface ReviewItem {
  id: string;
  rating: number;
  comment?: string;
  customer_name: string;
  is_verified_purchase: boolean;
  created_at: string;
}

export interface ReviewSummary {
  average_rating: number;
  total_reviews: number;
  rating_breakdown: Record<number, number>;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  desktop_image: string;
  mobile_image?: string;
  side_image?: string;
  button_text: string;
  button_url: string;
  badge_text?: string;
  bg_gradient?: string;
}

export interface SearchSuggestionItem {
  id: string;
  type: "product" | "category" | "company";
  title: string;
  subtitle?: string;
  url: string;
  image_url?: string;
  price?: number;
}

export interface SearchSuggestionResponse {
  products: SearchSuggestionItem[];
  categories: SearchSuggestionItem[];
  companies: SearchSuggestionItem[];
}

export interface PaginatedProductsResponse {
  items: PublicProductCard[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface HomepageResponse {
  hero_slides: HeroSlide[];
  categories: PublicCategory[];
  flash_deals: PublicProductCard[];
  flash_deals_end_time: string;
  featured_products: PublicProductCard[];
  popular_products: PublicProductCard[];
  top_companies: PublicCompany[];
  new_arrivals: PublicProductCard[];
}

export const publicApi = {
  async getHomepage(): Promise<HomepageResponse> {
    try {
      return await apiClient<HomepageResponse>("/api/v1/public/homepage");
    } catch {
      return {
        hero_slides: [],
        categories: [],
        flash_deals: [],
        flash_deals_end_time: new Date().toISOString(),
        featured_products: [],
        popular_products: [],
        top_companies: [],
        new_arrivals: [],
      };
    }
  },

  async getBanners(): Promise<HeroSlide[]> {
    try {
      return await apiClient<HeroSlide[]>("/api/v1/public/banners");
    } catch {
      return [];
    }
  },

  async searchSuggestions(q: string): Promise<SearchSuggestionResponse> {
    if (!q || q.trim().length === 0) return { products: [], categories: [], companies: [] };
    try {
      return await apiClient<SearchSuggestionResponse>(`/api/v1/public/products/suggestions?q=${encodeURIComponent(q)}`);
    } catch {
      return { products: [], categories: [], companies: [] };
    }
  },

  async getProducts(params: {
    q?: string;
    category_slug?: string;
    company_slug?: string;
    brand?: string;
    min_price?: number;
    max_price?: number;
    min_rating?: number;
    sort_by?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedProductsResponse> {
    const query = new URLSearchParams();
    if (params.q) query.append("q", params.q);
    if (params.category_slug) query.append("category_slug", params.category_slug);
    if (params.company_slug) query.append("company_slug", params.company_slug);
    if (params.brand) query.append("brand", params.brand);
    if (params.min_price !== undefined) query.append("min_price", params.min_price.toString());
    if (params.max_price !== undefined) query.append("max_price", params.max_price.toString());
    if (params.min_rating !== undefined) query.append("min_rating", params.min_rating.toString());
    if (params.sort_by) query.append("sort_by", params.sort_by);
    if (params.page) query.append("page", params.page.toString());
    if (params.limit) query.append("limit", params.limit.toString());

    try {
      return await apiClient<PaginatedProductsResponse>(`/api/v1/public/products?${query.toString()}`);
    } catch {
      return { items: [], total: 0, page: 1, limit: 16, pages: 1 };
    }
  },

  async getProductDetail(slug: string): Promise<ProductDetail> {
    return await apiClient<ProductDetail>(`/api/v1/public/products/${slug}`);
  },

  async getProductReviews(slug: string): Promise<{ reviews: ReviewItem[]; summary: ReviewSummary }> {
    try {
      return await apiClient<{ reviews: ReviewItem[]; summary: ReviewSummary }>(`/api/v1/public/products/${slug}/reviews`);
    } catch {
      return {
        reviews: [],
        summary: {
          average_rating: 0,
          total_reviews: 0,
          rating_breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
      };
    }
  },

  async getCategories(): Promise<PublicCategory[]> {
    try {
      return await apiClient<PublicCategory[]>("/api/v1/public/categories");
    } catch {
      return [];
    }
  },

  async getCompanyDetail(slug: string): Promise<PublicCompany> {
    return await apiClient<PublicCompany>(`/api/v1/public/companies/${slug}`);
  },
};
