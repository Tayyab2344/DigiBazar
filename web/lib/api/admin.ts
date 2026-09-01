import { apiClient } from "./client";
import type {
  DashboardStats,
  PaginatedResponse,
  CompanyAdminRead,
  CompanyListParams,
  CustomerAdminRead,
  CustomerListParams,
  ProductAdminRead,
  ProductListParams,
  CategoryRead,
  CategoryCreate,
  OrderAdminRead,
  OrderListParams,
  PaymentAdminRead,
  RefundAdminRead,
  RefundCreate,
  PayoutAdminRead,
  CouponAdminRead,
  CouponAdminCreate,
  InfluencerAdminRead,
  CampaignAdminRead,
  ReviewAdminRead,
  ReportAdminRead,
  ReportResolveRequest,
  CMSPageRead,
  CMSPageCreate,
  CMSSectionRead,
  BannerRead,
  BannerCreate,
  NotificationRead,
  NotificationCreate,
  AnalyticsOverview,
  AuditLogRead,
  AuditLogListParams,
  PlatformSettingsRead,
  PlatformSettingsUpdate,
  AdminUserRead,
  AdminUserCreate,
  PaginationParams,
} from "@/types/admin";

const BASE = "/api/v1/admin";

function toQuery(params: object = {}): string {
  const entries = Object.entries(params as Record<string, unknown>).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

// ===========================================
// DASHBOARD
// ===========================================

export const adminDashboardApi = {
  getStats: () => apiClient<DashboardStats>(`${BASE}/dashboard`),
};

// ===========================================
// COMPANIES
// ===========================================

export const adminCompaniesApi = {
  list: (params: CompanyListParams = {}) =>
    apiClient<PaginatedResponse<CompanyAdminRead>>(`${BASE}/companies${toQuery(params)}`),

  get: (id: string) =>
    apiClient<CompanyAdminRead>(`${BASE}/companies/${id}`),

  approve: (id: string) =>
    apiClient<CompanyAdminRead>(`${BASE}/companies/${id}/approve`, { method: "POST" }),

  reject: (id: string, reason?: string) =>
    apiClient<CompanyAdminRead>(`${BASE}/companies/${id}/reject`, {
      method: "POST",
      body: JSON.stringify(reason ? { reason } : {}),
    }),

  suspend: (id: string, reason?: string) =>
    apiClient<CompanyAdminRead>(`${BASE}/companies/${id}/suspend`, {
      method: "POST",
      body: JSON.stringify(reason ? { reason } : {}),
    }),

  activate: (id: string) =>
    apiClient<CompanyAdminRead>(`${BASE}/companies/${id}/activate`, { method: "POST" }),

  block: (id: string, reason?: string) =>
    apiClient<CompanyAdminRead>(`${BASE}/companies/${id}/block`, {
      method: "POST",
      body: JSON.stringify(reason ? { reason } : {}),
    }),
};

// ===========================================
// CUSTOMERS
// ===========================================

export const adminCustomersApi = {
  list: (params: CustomerListParams = {}) =>
    apiClient<PaginatedResponse<CustomerAdminRead>>(`${BASE}/customers${toQuery(params)}`),

  get: (id: string) =>
    apiClient<CustomerAdminRead>(`${BASE}/customers/${id}`),

  activate: (id: string) =>
    apiClient<CustomerAdminRead>(`${BASE}/customers/${id}/activate`, { method: "POST" }),

  suspend: (id: string, reason?: string) =>
    apiClient<CustomerAdminRead>(`${BASE}/customers/${id}/suspend`, {
      method: "POST",
      body: JSON.stringify(reason ? { reason } : {}),
    }),

  block: (id: string, reason?: string) =>
    apiClient<CustomerAdminRead>(`${BASE}/customers/${id}/block`, {
      method: "POST",
      body: JSON.stringify(reason ? { reason } : {}),
    }),
};

// ===========================================
// PRODUCTS
// ===========================================

export const adminProductsApi = {
  list: (params: ProductListParams = {}) =>
    apiClient<PaginatedResponse<ProductAdminRead>>(`${BASE}/products${toQuery(params)}`),

  get: (id: string) =>
    apiClient<ProductAdminRead>(`${BASE}/products/${id}`),

  approve: (id: string) =>
    apiClient<ProductAdminRead>(`${BASE}/products/${id}/approve`, { method: "POST" }),

  reject: (id: string, reason?: string) =>
    apiClient<ProductAdminRead>(`${BASE}/products/${id}/reject`, {
      method: "POST",
      body: JSON.stringify(reason ? { reason } : {}),
    }),

  enable: (id: string) =>
    apiClient<ProductAdminRead>(`${BASE}/products/${id}/enable`, { method: "POST" }),

  disable: (id: string, reason?: string) =>
    apiClient<ProductAdminRead>(`${BASE}/products/${id}/disable`, {
      method: "POST",
      body: JSON.stringify(reason ? { reason } : {}),
    }),
};

// ===========================================
// CATEGORIES
// ===========================================

export const adminCategoriesApi = {
  list: () => apiClient<CategoryRead[]>(`${BASE}/categories`),

  create: (data: CategoryCreate) =>
    apiClient<CategoryRead>(`${BASE}/categories`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiClient<{ message: string }>(`${BASE}/categories/${id}`, { method: "DELETE" }),
};

// ===========================================
// ORDERS
// ===========================================

export const adminOrdersApi = {
  list: (params: OrderListParams = {}) =>
    apiClient<PaginatedResponse<OrderAdminRead>>(`${BASE}/orders${toQuery(params)}`),

  get: (id: string) =>
    apiClient<OrderAdminRead>(`${BASE}/orders/${id}`),

  refund: (orderId: string, data: RefundCreate) =>
    apiClient<RefundAdminRead>(`${BASE}/orders/${orderId}/refund`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ===========================================
// PAYMENTS
// ===========================================

export const adminPaymentsApi = {
  list: (params: PaginationParams = {}) =>
    apiClient<PaginatedResponse<PaymentAdminRead>>(`${BASE}/payments${toQuery(params)}`),

  get: (id: string) =>
    apiClient<PaymentAdminRead>(`${BASE}/payments/${id}`),
};

// ===========================================
// REFUNDS
// ===========================================

export const adminRefundsApi = {
  list: (params: PaginationParams = {}) =>
    apiClient<PaginatedResponse<RefundAdminRead>>(`${BASE}/refunds${toQuery(params)}`),
};

// ===========================================
// PAYOUTS
// ===========================================

export const adminPayoutsApi = {
  list: (params: PaginationParams = {}) =>
    apiClient<PaginatedResponse<PayoutAdminRead>>(`${BASE}/payouts${toQuery(params)}`),
};

// ===========================================
// COUPONS
// ===========================================

export const adminCouponsApi = {
  list: (params: PaginationParams & { search?: string; is_active?: boolean } = {}) =>
    apiClient<PaginatedResponse<CouponAdminRead>>(`${BASE}/coupons${toQuery(params)}`),

  get: (id: string) =>
    apiClient<CouponAdminRead>(`${BASE}/coupons/${id}`),

  create: (data: CouponAdminCreate) =>
    apiClient<CouponAdminRead>(`${BASE}/coupons`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CouponAdminCreate>) =>
    apiClient<CouponAdminRead>(`${BASE}/coupons/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ===========================================
// INFLUENCERS
// ===========================================

export const adminInfluencersApi = {
  list: (params: PaginationParams = {}) =>
    apiClient<PaginatedResponse<InfluencerAdminRead>>(`${BASE}/influencers${toQuery(params)}`),

  get: (id: string) =>
    apiClient<InfluencerAdminRead>(`${BASE}/influencers/${id}`),
};

// ===========================================
// CAMPAIGNS
// ===========================================

export const adminCampaignsApi = {
  list: (params: PaginationParams = {}) =>
    apiClient<PaginatedResponse<CampaignAdminRead>>(`${BASE}/campaigns${toQuery(params)}`),

  get: (id: string) =>
    apiClient<CampaignAdminRead>(`${BASE}/campaigns/${id}`),
};

// ===========================================
// REVIEWS
// ===========================================

export const adminReviewsApi = {
  list: (params: PaginationParams & { rating?: number; is_reported?: boolean } = {}) =>
    apiClient<PaginatedResponse<ReviewAdminRead>>(`${BASE}/reviews${toQuery(params)}`),

  hide: (id: string) =>
    apiClient<ReviewAdminRead>(`${BASE}/reviews/${id}/hide`, { method: "POST" }),

  restore: (id: string) =>
    apiClient<ReviewAdminRead>(`${BASE}/reviews/${id}/restore`, { method: "POST" }),

  delete: (id: string) =>
    apiClient<{ message: string }>(`${BASE}/reviews/${id}`, { method: "DELETE" }),
};

// ===========================================
// REPORTS
// ===========================================

export const adminReportsApi = {
  list: (params: PaginationParams & { status?: string } = {}) =>
    apiClient<PaginatedResponse<ReportAdminRead>>(`${BASE}/reports${toQuery(params)}`),

  get: (id: string) =>
    apiClient<ReportAdminRead>(`${BASE}/reports/${id}`),

  resolve: (id: string, data: ReportResolveRequest) =>
    apiClient<ReportAdminRead>(`${BASE}/reports/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ===========================================
// CMS
// ===========================================

export const adminCMSApi = {
  listPages: (params: PaginationParams = {}) =>
    apiClient<PaginatedResponse<CMSPageRead>>(`${BASE}/cms/pages${toQuery(params)}`),

  getPage: (id: string) =>
    apiClient<CMSPageRead>(`${BASE}/cms/pages/${id}`),

  createPage: (data: CMSPageCreate) =>
    apiClient<CMSPageRead>(`${BASE}/cms/pages`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updatePage: (id: string, data: Partial<CMSPageCreate>) =>
    apiClient<CMSPageRead>(`${BASE}/cms/pages/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deletePage: (id: string) =>
    apiClient<{ message: string }>(`${BASE}/cms/pages/${id}`, { method: "DELETE" }),

  listSections: () =>
    apiClient<CMSSectionRead[]>(`${BASE}/cms/sections`),

  listBanners: (params: PaginationParams = {}) =>
    apiClient<PaginatedResponse<BannerRead>>(`${BASE}/banners${toQuery(params)}`),

  getBanner: (id: string) =>
    apiClient<BannerRead>(`${BASE}/banners/${id}`),

  createBanner: (data: BannerCreate) =>
    apiClient<BannerRead>(`${BASE}/banners`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateBanner: (id: string, data: Partial<BannerCreate>) =>
    apiClient<BannerRead>(`${BASE}/banners/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteBanner: (id: string) =>
    apiClient<{ message: string }>(`${BASE}/banners/${id}`, { method: "DELETE" }),
};

// ===========================================
// NOTIFICATIONS
// ===========================================

export const adminNotificationsApi = {
  list: (params: PaginationParams = {}) =>
    apiClient<PaginatedResponse<NotificationRead>>(`${BASE}/notifications${toQuery(params)}`),

  create: (data: NotificationCreate) =>
    apiClient<NotificationRead>(`${BASE}/notifications`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ===========================================
// ANALYTICS
// ===========================================

export const adminAnalyticsApi = {
  getOverview: (params: { period?: string; company_id?: string; category_id?: string } = {}) =>
    apiClient<AnalyticsOverview>(`${BASE}/analytics${toQuery(params)}`),
};

// ===========================================
// AUDIT LOGS
// ===========================================

export const adminAuditLogsApi = {
  list: (params: AuditLogListParams = {}) =>
    apiClient<PaginatedResponse<AuditLogRead>>(`${BASE}/audit-logs${toQuery(params)}`),
};

// ===========================================
// SETTINGS
// ===========================================

export const adminSettingsApi = {
  get: () =>
    apiClient<PlatformSettingsRead>(`${BASE}/settings`),

  update: (data: PlatformSettingsUpdate) =>
    apiClient<PlatformSettingsRead>(`${BASE}/settings`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  listAdminUsers: (params: PaginationParams = {}) =>
    apiClient<PaginatedResponse<AdminUserRead>>(`${BASE}/settings/admin-users${toQuery(params)}`),

  createAdminUser: (data: AdminUserCreate) =>
    apiClient<AdminUserRead>(`${BASE}/settings/admin-users`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
