import { apiClient } from "./client";
import type {
  CompanyProfileRead,
  CompanyProfileUpdate,
  CompanyDashboardStats,
  CompanyProductRead,
  CompanyProductCreate,
  InventoryUpdate,
  InventoryMovementRead,
  CompanyOrderRead,
  CompanyCustomerRead,
  CompanyCouponRead,
  CompanyCouponCreate,
  CompanyCampaignRead,
  CompanyCampaignCreate,
  CompanyReviewRead,
  TeamMemberRead,
  CompanyPaginatedResponse,
} from "@/types/company";

const BASE = "/api/v1/company";

function toQuery(params: object = {}): string {
  const entries = Object.entries(params as Record<string, unknown>).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

export const companyApi = {
  // Profile & Dashboard
  getProfile: () => apiClient<CompanyProfileRead>(`${BASE}/profile`),
  updateProfile: (data: CompanyProfileUpdate) =>
    apiClient<CompanyProfileRead>(`${BASE}/profile`, { method: "PATCH", body: JSON.stringify(data) }),
  getDashboardStats: () => apiClient<CompanyDashboardStats>(`${BASE}/dashboard`),

  // Products
  listProducts: (params?: { page?: number; page_size?: number; search?: string }) =>
    apiClient<CompanyPaginatedResponse<CompanyProductRead>>(`${BASE}/products${toQuery(params)}`),
  getProduct: (id: string) => apiClient<CompanyProductRead>(`${BASE}/products/${id}`),
  createProduct: (data: CompanyProductCreate) =>
    apiClient<CompanyProductRead>(`${BASE}/products`, { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: string, data: Partial<CompanyProductCreate>) =>
    apiClient<CompanyProductRead>(`${BASE}/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteProduct: (id: string) => apiClient<{ message: string }>(`${BASE}/products/${id}`, { method: "DELETE" }),

  // Inventory
  updateStock: (productId: string, stock: number, reason?: string) =>
    apiClient<CompanyProductRead>(`${BASE}/inventory/${productId}`, {
      method: "PATCH",
      body: JSON.stringify({ product_id: productId, stock, reason }),
    }),
  listMovements: (params?: { page?: number; page_size?: number }) =>
    apiClient<CompanyPaginatedResponse<InventoryMovementRead>>(`${BASE}/inventory/movements${toQuery(params)}`),

  // Orders & Checkout
  checkoutOrder: (payload: any) =>
    apiClient<{ order_ids: string[]; total_amount: number; message: string }>("/api/v1/orders/checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getMyOrders: () => apiClient<any[]>("/api/v1/orders/my-orders"),
  listOrders: (params?: { page?: number; page_size?: number }) =>
    apiClient<CompanyPaginatedResponse<CompanyOrderRead>>(`${BASE}/orders${toQuery(params)}`),
  getOrder: (id: string) => apiClient<CompanyOrderRead>(`${BASE}/orders/${id}`),
  updateOrderStatus: (id: string, status: string, notes?: string) =>
    apiClient<CompanyOrderRead>(`${BASE}/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, order_status: status, notes }),
    }),

  // Customers
  listCustomers: (params?: { page?: number; page_size?: number }) =>
    apiClient<CompanyPaginatedResponse<CompanyCustomerRead>>(`${BASE}/customers${toQuery(params)}`),

  // Coupons
  listCoupons: () => apiClient<any[]>("/api/v1/coupons"),
  createCoupon: (data: any) =>
    apiClient<any>("/api/v1/coupons", { method: "POST", body: JSON.stringify(data) }),
  toggleCouponActive: (id: string, active: boolean) =>
    apiClient<any>(`/api/v1/coupons/${id}/${active ? "activate" : "pause"}`, { method: "POST" }),
  deleteCoupon: (id: string) => apiClient<{ message: string }>(`/api/v1/coupons/${id}`, { method: "DELETE" }),

  // Campaigns
  listCampaigns: () => apiClient<any[]>("/api/v1/campaigns"),
  createCampaign: (data: any) =>
    apiClient<any>("/api/v1/campaigns", { method: "POST", body: JSON.stringify(data) }),
  toggleCampaignActive: (id: string, active: boolean) =>
    apiClient<any>(`/api/v1/campaigns/${id}/${active ? "activate" : "pause"}`, { method: "POST" }),
  deleteCampaign: (id: string) => apiClient<{ message: string }>(`/api/v1/campaigns/${id}`, { method: "DELETE" }),
  getCampaignAnalytics: (id: string) => apiClient<any>(`/api/v1/campaigns/${id}/analytics`),

  // Reviews
  listReviews: () => apiClient<CompanyReviewRead[]>(`${BASE}/reviews`),
};

