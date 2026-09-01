"use client";

import React, { useState, useEffect } from "react";
import { CompanyShell } from "@/components/company/CompanyShell";
import { companyApi } from "@/lib/api/company";
import { productApi } from "@/lib/api/product";
import type { CategoryItem } from "@/types/product";
import {
  Ticket,
  Plus,
  Trash2,
  X,
  Percent,
  DollarSign,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Megaphone,
  ShoppingBag,
  FolderTree,
  Store,
  Layers,
  PauseCircle,
  PlayCircle,
  ExternalLink,
  Users,
} from "lucide-react";

interface ProductSimple {
  id: string;
  name: string;
  price: number;
}

export default function VendorCouponsPage() {
  const [activeTab, setActiveTab] = useState<"coupons" | "campaigns">("coupons");
  const [coupons, setCoupons] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Available Store Catalog Data
  const [storeProducts, setStoreProducts] = useState<ProductSimple[]>([]);
  const [storeCategories, setStoreCategories] = useState<CategoryItem[]>([]);

  // Modals & Banners
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: "coupon" | "campaign"; name: string } | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Coupon Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<number>(15);
  const [scope, setScope] = useState<"STORE" | "PRODUCTS" | "CATEGORIES">("STORE");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [minimumOrderPKR, setMinimumOrderPKR] = useState<number>(0);
  const [maximumDiscountPKR, setMaximumDiscountPKR] = useState<number>(0);
  const [usageLimit, setUsageLimit] = useState<number>(0);
  const [perCustomerLimit, setPerCustomerLimit] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);

  // Campaign Form State
  const [campName, setCampName] = useState("");
  const [campDesc, setCampDesc] = useState("");
  const [campInfluencerId, setCampInfluencerId] = useState("");
  const [campCouponCode, setCampCouponCode] = useState("");
  const [campDiscountType, setCampDiscountType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [campDiscountValue, setCampDiscountValue] = useState<number>(15);
  const [campScope, setCampScope] = useState<"STORE" | "PRODUCTS" | "CATEGORIES">("STORE");
  const [campCommissionType, setCampCommissionType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [campCommissionValue, setCampCommissionValue] = useState<number>(5);

  const loadData = async () => {
    try {
      setLoading(true);
      const [couponData, campaignData, categoryTree] = await Promise.all([
        companyApi.listCoupons(),
        companyApi.listCampaigns(),
        productApi.listCategories(),
      ]);
      setCoupons(couponData || []);
      setCampaigns(campaignData || []);
      setStoreCategories(categoryTree || []);

      // Fetch products
      const pRes = await companyApi.listProducts({ page: 1, page_size: 100 });
      if (pRes && pRes.items) {
        setStoreProducts(pRes.items.map((p) => ({ id: p.id, name: p.name, price: p.price })));
      }
    } catch (err) {
      console.error("Failed to load promotion data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(identifier);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!code.trim()) {
      setFormError("Coupon promo code is required.");
      return;
    }
    if (!name.trim()) {
      setFormError("Coupon display name is required.");
      return;
    }

    try {
      const minOrderCents = Math.round(minimumOrderPKR * 100);
      const maxDiscountCents = Math.round(maximumDiscountPKR * 100);
      const valCents = discountType === "FIXED_AMOUNT" ? Math.round(discountValue * 100) : discountValue;

      await companyApi.createCoupon({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        discount_type: discountType,
        discount_value: valCents,
        scope,
        product_ids: scope === "PRODUCTS" ? selectedProductIds : [],
        category_ids: scope === "CATEGORIES" ? selectedCategoryIds : [],
        minimum_order_amount: minOrderCents,
        maximum_discount_amount: maxDiscountCents,
        usage_limit: usageLimit,
        per_customer_limit: perCustomerLimit,
        is_active: isActive,
      });

      setCouponModalOpen(false);
      resetCouponForm();
      loadData();
    } catch (err: any) {
      const msg = err?.detail || err?.message || "Failed to create coupon code. Please verify the details.";
      setFormError(msg);
    }
  };

  const resetCouponForm = () => {
    setCode("");
    setName("");
    setDescription("");
    setDiscountType("PERCENTAGE");
    setDiscountValue(15);
    setScope("STORE");
    setSelectedProductIds([]);
    setSelectedCategoryIds([]);
    setMinimumOrderPKR(0);
    setMaximumDiscountPKR(0);
    setUsageLimit(0);
    setPerCustomerLimit(1);
    setIsActive(true);
    setFormError(null);
  };

  const handleToggleCouponActive = async (id: string, currentStatus: boolean) => {
    try {
      await companyApi.toggleCouponActive(id, !currentStatus);
      loadData();
    } catch (err) {
      console.error("Failed to toggle coupon status:", err);
    }
  };

  const confirmDelete = (id: string, type: "coupon" | "campaign", name: string) => {
    setItemToDelete({ id, type, name });
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === "coupon") {
        await companyApi.deleteCoupon(itemToDelete.id);
      } else {
        await companyApi.deleteCampaign(itemToDelete.id);
      }
      setDeleteModalOpen(false);
      setItemToDelete(null);
      loadData();
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  const formatPKR = (cents: number) => `PKR ${(cents / 100).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`;

  return (
    <CompanyShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Discounts & Promotions</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-900 border border-amber-200/80">
              Active Store
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Organize store-wide promo codes, product/category promotions, and influencer tracking URLs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              resetCouponForm();
              setCouponModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-600 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("coupons")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === "coupons"
              ? "bg-slate-900 text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Store Coupons ({coupons.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === "campaigns"
              ? "bg-slate-900 text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Influencer Campaigns ({campaigns.length})</span>
        </button>
      </div>

      {/* TAB 1: STORE COUPONS TABLE */}
      {activeTab === "coupons" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold">
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-4">Scope</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Min Order</th>
                  <th className="py-3.5 px-4">Usage Limit</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading store coupons...
                    </td>
                  </tr>
                ) : coupons.length > 0 ? (
                  coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-slate-900 text-sm bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            {c.code}
                          </span>
                          <button
                            onClick={() => copyToClipboard(c.code, c.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Copy Code"
                          >
                            {copiedCode === c.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-medium">{c.name}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.scope === "STORE"
                              ? "bg-amber-50 text-amber-900 border border-amber-200/80"
                              : c.scope === "PRODUCTS"
                              ? "bg-amber-50 text-amber-900 border border-amber-200/80"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}
                        >
                          {c.scope === "STORE" && <Store className="w-3 h-3 text-amber-700" />}
                          {c.scope === "PRODUCTS" && <ShoppingBag className="w-3 h-3 text-amber-700" />}
                          {c.scope === "CATEGORIES" && <FolderTree className="w-3 h-3" />}
                          {c.scope}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        {c.discount_type === "PERCENTAGE" ? `${c.discount_value}% OFF` : formatPKR(c.discount_value)}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {c.minimum_order_amount > 0 ? formatPKR(c.minimum_order_amount) : "No Minimum"}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {c.usage_count || 0} / {c.usage_limit > 0 ? c.usage_limit : "∞"}
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleCouponActive(c.id, c.is_active)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                            c.is_active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {c.is_active ? <PlayCircle className="w-3 h-3" /> : <PauseCircle className="w-3 h-3" />}
                          {c.is_active ? "Active" : "Paused"}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => confirmDelete(c.id, "coupon", c.code)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No active store coupons found. Click &quot;Create Coupon&quot; to launch your first promotion.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INFLUENCER CAMPAIGNS */}
      {activeTab === "campaigns" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-semibold">
                  <th className="py-3.5 px-4">Campaign Name</th>
                  <th className="py-3.5 px-4">Tracking Code</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Commission</th>
                  <th className="py-3.5 px-4">Clicks</th>
                  <th className="py-3.5 px-4">Orders</th>
                  <th className="py-3.5 px-4">Revenue</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {campaigns.length > 0 ? (
                  campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 text-sm">{camp.name}</p>
                        <p className="text-[11px] text-amber-700 font-bold">{camp.influencer_handle || "@influencer"}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {camp.tracking_code}
                          </span>
                          <button
                            onClick={() => copyToClipboard(`${window.location.origin}/c/${camp.tracking_code}`, camp.id)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            title="Copy Tracking Link"
                          >
                            {copiedCode === camp.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {camp.discount_type === "PERCENTAGE" ? `${camp.discount_value}% OFF` : formatPKR(camp.discount_value)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-700">
                        {camp.commission_type === "PERCENTAGE" ? `${camp.commission_value}%` : formatPKR(camp.commission_value)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800">{camp.clicks || 0}</td>
                      <td className="py-3.5 px-4 font-bold text-amber-700">{camp.orders || 0}</td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">{formatPKR(camp.revenue || 0)}</td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => confirmDelete(camp.id, "campaign", camp.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No active influencer marketing campaigns found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE STORE COUPON MODAL (INLINE STYLED ERROR BANNER - NO BROWSER ALERTS) */}
      {couponModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Create Store Coupon</h3>
                <p className="text-xs text-slate-500">Configure discount code parameters for your customers.</p>
              </div>
              <button
                onClick={() => setCouponModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* INLINE ERROR ALERT BANNER */}
              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-xs">Error Creating Coupon</p>
                    <p className="text-[11px] mt-0.5 text-rose-700">{formError}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Coupon Promo Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. SUMMER20"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 font-mono font-bold text-sm uppercase text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Display Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Summer 20% Off Sale"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Get 20% discount on orders above Rs 1,000"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900 font-semibold"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (PKR)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {discountType === "PERCENTAGE" ? "Discount Percentage (%)" : "Discount Amount (PKR)"}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Promotion Scope</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "STORE", label: "Store-Wide", icon: Store },
                    { id: "PRODUCTS", label: "Products Only", icon: ShoppingBag },
                    { id: "CATEGORIES", label: "Categories Only", icon: FolderTree },
                  ].map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => setScope(s.id as any)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-colors ${
                          scope === s.id
                            ? "bg-amber-50 border-amber-500 text-amber-900 font-bold shadow-2xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span className="text-[11px]">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PRODUCTS SELECTOR IF SCOPE === PRODUCTS */}
              {scope === "PRODUCTS" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Eligible Products</label>
                  <div className="max-h-32 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    {storeProducts.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer text-slate-800">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedProductIds([...selectedProductIds, p.id]);
                            else setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id));
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span className="font-medium text-xs truncate">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* CATEGORIES SELECTOR IF SCOPE === CATEGORIES */}
              {scope === "CATEGORIES" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Eligible Categories</label>
                  <div className="max-h-32 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    {storeCategories.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer text-slate-800">
                        <input
                          type="checkbox"
                          checked={selectedCategoryIds.includes(cat.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedCategoryIds([...selectedCategoryIds, cat.id]);
                            else setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== cat.id));
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span className="font-medium text-xs">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Minimum Order (PKR)</label>
                  <input
                    type="number"
                    min={0}
                    value={minimumOrderPKR}
                    onChange={(e) => setMinimumOrderPKR(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Maximum Discount Cap (PKR)</label>
                  <input
                    type="number"
                    min={0}
                    value={maximumDiscountPKR}
                    onChange={(e) => setMaximumDiscountPKR(parseInt(e.target.value) || 0)}
                    placeholder="0 = Unlimited"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    min={0}
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(parseInt(e.target.value) || 0)}
                    placeholder="0 = Unlimited"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Per-Customer Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={perCustomerLimit}
                    onChange={(e) => setPerCustomerLimit(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCouponModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black transition-colors shadow-2xs"
                >
                  Save & Activate Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DELETE MODAL */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Delete {itemToDelete.type === "coupon" ? "Coupon" : "Campaign"}?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete <span className="font-bold text-slate-900">{itemToDelete.name}</span>? This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="w-full py-2.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors shadow-2xs text-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </CompanyShell>
  );
}
