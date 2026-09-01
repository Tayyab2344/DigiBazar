import { PublicProductCard } from "./api/public";

const RECENTLY_VIEWED_KEY = "digibazar_recently_viewed";

export function getRecentlyViewed(): PublicProductCard[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(product: PublicProductCard | {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  price: number;
  sale_price?: number;
  discount_percentage: number;
  rating: number;
  review_count: number;
  stock: number;
  is_free_delivery: boolean;
  badge?: string;
  primary_image: string;
  company_id: string;
  company_name: string;
  company_slug: string;
  company_is_verified: boolean;
  category_name?: string;
  category_slug?: string;
  created_at: string;
}): void {
  if (typeof window === "undefined") return;
  try {
    const current = getRecentlyViewed();
    const filtered = current.filter((p) => p.id !== product.id && p.slug !== product.slug);
    const updated = [product as PublicProductCard, ...filtered].slice(0, 10);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
}
