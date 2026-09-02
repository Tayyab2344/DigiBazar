"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CompanyShell } from "@/components/company/CompanyShell";
import { ProductFormHeader } from "@/components/company/product/ProductFormHeader";
import { CategoryPickerModal } from "@/components/company/product/CategoryPickerModal";
import { ProductMediaManager } from "@/components/company/product/ProductMediaManager";
import { VariantMatrixGenerator } from "@/components/company/product/VariantMatrixGenerator";
import { ProductSEOPreview } from "@/components/company/product/ProductSEOPreview";
import { CustomerProductPreviewModal } from "@/components/company/product/CustomerProductPreviewModal";
import { productApi } from "@/lib/api/product";
import { useAuthStore } from "@/lib/store/useAuthStore";
import type { ProductFormState, CategoryItem } from "@/types/product";
import {
  Package,
  Layers,
  FileText,
  Image as ImageIcon,
  DollarSign,
  Boxes,
  Truck,
  ListFilter,
  Tag,
  Search,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [form, setForm] = useState<ProductFormState>({
    product_type: "SIMPLE",
    name: "",
    slug: "",
    sku: "",
    category_id: "",
    category_name: "",
    brand: "",
    short_description: "",
    description: "",

    price: 0, // Integer cents
    sale_price: undefined,
    cost_price: undefined,
    tax_setting: "STANDARD",

    sale_start_date: "",
    sale_end_date: "",

    stock: 0,
    low_stock_threshold: 5,
    barcode: "",
    track_inventory: true,
    backorders_policy: "STOP_SELLING",

    weight: undefined,
    length: undefined,
    width: undefined,
    height: undefined,
    shipping_class: "",

    status: "DRAFT",
    visibility: "PUBLIC",

    images: [],
    variants: [],
    attributes: [],
    tags: [],
    seo: { title: "", description: "", keywords: "" },
    related_product_ids: [],
  });

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [tagInput, setTagInput] = useState("");
  const [specName, setSpecName] = useState("");
  const [specValue, setSpecValue] = useState("");

  // Calculate completion percentage
  const sectionStatus = useMemo(() => {
    return {
      "Basic Info": Boolean(form.name.trim() && form.category_id && form.description.trim()),
      "Media": form.images.length > 0,
      "Pricing": form.price > 0,
      "Inventory": form.sku.trim() !== "",
      "Variants": form.product_type === "SIMPLE" || form.variants.length > 0,
      "SEO": Boolean(form.seo.title || form.seo.description),
    };
  }, [form]);

  const completionPct = useMemo(() => {
    const values = Object.values(sectionStatus);
    const completed = values.filter(Boolean).length;
    return Math.round((completed / values.length) * 100);
  }, [sectionStatus]);

  // Profit calculations
  const sellingPriceCents = form.sale_price || form.price || 0;
  const profitCents = form.cost_price ? sellingPriceCents - form.cost_price : null;
  const profitMarginPct = profitCents && sellingPriceCents > 0
    ? ((profitCents / sellingPriceCents) * 100).toFixed(1)
    : null;

  // Auto-scroll to first invalid input field
  const scrollToFirstError = (errors: Record<string, string>) => {
    const firstKey = Object.keys(errors)[0];
    if (!firstKey) return;
    setTimeout(() => {
      const element = document.querySelector(`[data-field="${firstKey}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        const focusable = element.querySelector("input, textarea, select, button") as HTMLElement;
        if (focusable) {
          focusable.focus();
        }
      }
    }, 50);
  };

  // Client side validation
  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!form.name.trim()) {
      errors.name = "Product name is required.";
    } else if (form.name.trim().length < 2) {
      errors.name = "Product name must be at least 2 characters long.";
    }

    if (!form.category_id) {
      errors.category_id = "Marketplace category is required. Click Browse to select one.";
    }

    if (!form.description.trim()) {
      errors.description = "Detailed product description is required.";
    }

    if (!form.price || form.price <= 0) {
      errors.price = "Regular price must be greater than 0.";
    }

    if (form.sale_price !== undefined && form.sale_price !== null && form.sale_price >= form.price) {
      errors.sale_price = "Sale price must be lower than regular price.";
    }

    if (!form.sku.trim()) {
      errors.sku = "Product SKU is required.";
    }

    if (form.stock < 0 || isNaN(form.stock)) {
      errors.stock = "Available stock cannot be negative.";
    }

    if (form.sale_start_date && form.sale_end_date && form.sale_start_date > form.sale_end_date) {
      errors.sale_end_date = "Sale end date must be after sale start date.";
    }

    return errors;
  };

  const getSanitizedPayload = (targetStatus?: string) => {
    return {
      ...form,
      status: (targetStatus || form.status).toLowerCase() as any,
      category_id: form.category_id || undefined,
      brand: form.brand || undefined,
      short_description: form.short_description || undefined,
      description: form.description || undefined,
      sale_start_date: form.sale_start_date || undefined,
      sale_end_date: form.sale_end_date || undefined,
      barcode: form.barcode || undefined,
      shipping_class: form.shipping_class || undefined,
      stock: Math.max(0, form.stock || 0),
      sale_price: form.sale_price || undefined,
      cost_price: form.cost_price || undefined,
    };
  };

  const parseBackendError = (err: any) => {
    const fieldMap: Record<string, string> = {};
    let msg = err.message || "Failed to save product.";

    if (err.data) {
      if (Array.isArray(err.data.detail)) {
        err.data.detail.forEach((item: any) => {
          if (typeof item === "string") {
            msg = item;
          } else if (item.loc) {
            const fieldName = item.loc[item.loc.length - 1];
            if (fieldName) {
              fieldMap[fieldName] = item.msg;
            }
          }
        });
      } else if (typeof err.data.detail === "string") {
        msg = err.data.detail;
      } else if (err.data.detail && typeof err.data.detail === "object") {
        if (Array.isArray(err.data.detail.publishing_errors)) {
          msg = `Publishing Error: ${err.data.detail.publishing_errors.join(" | ")}`;
        }
      }
    }

    setFieldErrors(fieldMap);
    setErrorMessage(msg);

    if (Object.keys(fieldMap).length > 0) {
      scrollToFirstError(fieldMap);
    }
  };

  // Auto-generate Slug & SKU when product name changes
  const handleNameChange = async (name: string) => {
    setForm((prev) => ({ ...prev, name }));
    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));

    if (name.trim().length >= 3 && !form.slug) {
      try {
        const slugRes = await productApi.generateSlug(name);
        const skuRes = await productApi.generateSku(name);
        setForm((prev) => ({
          ...prev,
          name,
          slug: prev.slug || slugRes.slug,
          sku: prev.sku || skuRes.sku,
        }));
      } catch (err) {
        console.error("Auto slug/sku generation error:", err);
      }
    }
  };

  const handleAIContent = async (type: "description" | "tags") => {
    if (!form.name.trim()) return;
    try {
      const res = await productApi.generateAIContent({
        product_name: form.name,
        category_name: form.category_name,
        content_type: type,
      });

      if (type === "description") {
        setForm((prev) => ({ ...prev, description: res.generated_text }));
        if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: "" }));
      } else if (type === "tags") {
        const generatedTags = res.generated_text.split(",").map((t) => t.trim()).filter(Boolean);
        setForm((prev) => ({ ...prev, tags: Array.from(new Set([...prev.tags, ...generatedTags])) }));
      }
    } catch (err) {
      console.error("AI assistant error:", err);
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) return;
    setForm((prev) => ({
      ...prev,
      tags: Array.from(new Set([...prev.tags, tagInput.trim().toLowerCase()])),
    }));
    setTagInput("");
  };

  const handleRemoveTag = (tagStr: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tagStr) }));
  };

  const [createdProductId, setCreatedProductId] = useState<string | null>(null);

  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      setErrorMessage("");
      setFieldErrors({});

      const payload = getSanitizedPayload("draft");
      if (createdProductId) {
        await productApi.updateEnhancedProduct(createdProductId, payload);
      } else {
        const created = await productApi.createEnhancedProduct(payload);
        setCreatedProductId(created.id);
      }
      router.push("/company/products");
    } catch (err: any) {
      parseBackendError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    const clientErrors = validateForm();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setErrorMessage("Please resolve the highlighted field errors below.");
      scrollToFirstError(clientErrors);
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");
      setFieldErrors({});

      const payload = getSanitizedPayload("draft");
      let productId = createdProductId;

      if (productId) {
        await productApi.updateEnhancedProduct(productId, payload);
      } else {
        const created = await productApi.createEnhancedProduct(payload);
        productId = created.id;
        setCreatedProductId(created.id);
      }

      await productApi.publishProduct(productId);
      router.push("/company/products");
    } catch (err: any) {
      parseBackendError(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CompanyShell>
      {/* Sticky Header Bar */}
      <ProductFormHeader
        completionPct={completionPct}
        sectionStatus={sectionStatus}
        isEditing={false}
        productStatus={form.status}
        isSaving={isSaving}
        onSaveDraft={handleSaveDraft}
        onPreview={() => setPreviewModalOpen(true)}
        onPublish={handlePublish}
      />

      {errorMessage && (
        <div className="max-w-5xl mx-auto mt-4 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {Object.keys(fieldErrors).length > 0 && (
            <button
              type="button"
              onClick={() => scrollToFirstError(fieldErrors)}
              className="text-xs font-bold text-rose-700 underline hover:text-rose-900 cursor-pointer"
            >
              Jump to First Error ↓
            </button>
          )}
        </div>
      )}

      {/* Main Product Creation Layout */}
      <div className="max-w-5xl mx-auto space-y-8 py-6 text-xs">
        {/* Section 1: Product Type */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-600" />
            <span>1. Select Product Type</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setForm((prev) => ({ ...prev, product_type: "SIMPLE" }))}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                form.product_type === "SIMPLE"
                  ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <h3 className="font-bold text-slate-900 text-sm">Simple Product</h3>
              <p className="text-xs text-slate-500 mt-1">Single standalone item with one price, SKU, and inventory stock.</p>
            </div>

            <div
              onClick={() => setForm((prev) => ({ ...prev, product_type: "VARIABLE" }))}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                form.product_type === "VARIABLE"
                  ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <h3 className="font-bold text-slate-900 text-sm">Variable Product</h3>
              <p className="text-xs text-slate-500 mt-1">Item with multiple variations (e.g. Color: Red/Blue, Size: S/M/L).</p>
            </div>
          </div>
        </section>

        {/* Section 2: Basic Information */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            <span>2. Basic Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="md:col-span-2" data-field="name">
              <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Apple AirPods Pro 3"
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none ${
                  fieldErrors.name
                    ? "border-rose-500 bg-rose-50/50 text-rose-900 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-amber-500"
                }`}
              />
              {fieldErrors.name && (
                <p className="text-rose-600 font-semibold text-xs mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Slug */}
            <div data-field="slug">
              <label className="block font-semibold text-slate-700 mb-1">Product URL Slug *</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, slug: e.target.value }));
                  if (fieldErrors.slug) setFieldErrors((prev) => ({ ...prev, slug: "" }));
                }}
                placeholder="apple-airpods-pro-3-a7k29"
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 font-mono text-xs focus:bg-white focus:outline-none ${
                  fieldErrors.slug
                    ? "border-rose-500 bg-rose-50/50 text-rose-900"
                    : "border-slate-200 focus:border-amber-500"
                }`}
              />
              {fieldErrors.slug && (
                <p className="text-rose-600 font-semibold text-xs mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.slug}
                </p>
              )}
            </div>

            {/* Category Picker */}
            <div data-field="category_id">
              <label className="block font-semibold text-slate-700 mb-1">Marketplace Category *</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={form.category_name || "Select Category..."}
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 cursor-pointer ${
                    fieldErrors.category_id
                      ? "border-rose-500 bg-rose-50/50 text-rose-900"
                      : "border-slate-200"
                  }`}
                  onClick={() => setCategoryModalOpen(true)}
                />
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(true)}
                  className="px-4 py-2.5 bg-amber-500 text-slate-950 font-black rounded-xl shadow-2xs hover:bg-amber-600 cursor-pointer"
                >
                  Browse
                </button>
              </div>
              {fieldErrors.category_id && (
                <p className="text-rose-600 font-semibold text-xs mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.category_id}
                </p>
              )}
            </div>

            {/* Brand */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Brand Name</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                placeholder="e.g. Apple, Nike, Samsung"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Short Description */}
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Short Description (Summary)</label>
              <textarea
                rows={2}
                value={form.short_description}
                onChange={(e) => setForm((prev) => ({ ...prev, short_description: e.target.value }))}
                placeholder="Brief key highlights displayed next to price..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Detailed Description */}
            <div className="md:col-span-2" data-field="description">
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Detailed Description *</label>
                <button
                  type="button"
                  onClick={() => handleAIContent("description")}
                  className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span>Generate Description with AI</span>
                </button>
              </div>
              <textarea
                rows={5}
                required
                value={form.description}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, description: e.target.value }));
                  if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: "" }));
                }}
                placeholder="Full product specs, features, warranty, and craftsmanship details..."
                className={`w-full p-3 bg-slate-50 border rounded-xl text-slate-900 focus:bg-white focus:outline-none ${
                  fieldErrors.description
                    ? "border-rose-500 bg-rose-50/50 text-rose-900 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-amber-500"
                }`}
              />
              {fieldErrors.description && (
                <p className="text-rose-600 font-semibold text-xs mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.description}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Product Media */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-600" />
            <span>3. Product Media & Images</span>
          </h2>
          <ProductMediaManager
            images={form.images}
            onChangeImages={(imgs) => setForm((prev) => ({ ...prev, images: imgs }))}
          />
        </section>

        {/* Section 4: Pricing & Sale Scheduling */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span>4. Pricing & Profit Calculations</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Regular Price */}
            <div data-field="price">
              <label className="block font-semibold text-slate-700 mb-1">Regular Price (PKR) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={(form.price / 100).toString()}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, price: Math.round(parseFloat(e.target.value || "0") * 100) }));
                  if (fieldErrors.price) setFieldErrors((prev) => ({ ...prev, price: "" }));
                }}
                placeholder="249.99"
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none ${
                  fieldErrors.price
                    ? "border-rose-500 bg-rose-50/50 text-rose-900 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-emerald-600"
                }`}
              />
              {fieldErrors.price && (
                <p className="text-rose-600 font-semibold text-xs mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.price}
                </p>
              )}
            </div>

            {/* Sale Price */}
            <div data-field="sale_price">
              <label className="block font-semibold text-slate-700 mb-1">Sale Price (PKR)</label>
              <input
                type="number"
                step="0.01"
                value={form.sale_price ? (form.sale_price / 100).toString() : ""}
                onChange={(e) => {
                  setForm((prev) => ({
                    ...prev,
                    sale_price: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : undefined,
                  }));
                  if (fieldErrors.sale_price) setFieldErrors((prev) => ({ ...prev, sale_price: "" }));
                }}
                placeholder="199.99"
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none ${
                  fieldErrors.sale_price
                    ? "border-rose-500 bg-rose-50/50 text-rose-900 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-emerald-600"
                }`}
              />
              {fieldErrors.sale_price && (
                <p className="text-rose-600 font-semibold text-xs mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.sale_price}
                </p>
              )}
            </div>

            {/* Cost Price */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Private Cost Price (PKR)</label>
              <input
                type="number"
                step="0.01"
                value={form.cost_price ? (form.cost_price / 100).toString() : ""}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    cost_price: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : undefined,
                  }))
                }
                placeholder="120.00"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Sale Date Scheduling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div data-field="sale_start_date">
              <label className="block font-semibold text-slate-700 mb-1">Sale Start Date</label>
              <input
                type="datetime-local"
                value={form.sale_start_date || ""}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, sale_start_date: e.target.value }));
                  if (fieldErrors.sale_start_date) setFieldErrors((prev) => ({ ...prev, sale_start_date: "" }));
                }}
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none ${
                  fieldErrors.sale_start_date
                    ? "border-rose-500 bg-rose-50/50 text-rose-900 focus:border-rose-600"
                    : "border-slate-200 focus:border-emerald-600"
                }`}
              />
              {fieldErrors.sale_start_date && (
                <p className="text-rose-600 font-semibold text-xs mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.sale_start_date}
                </p>
              )}
            </div>

            <div data-field="sale_end_date">
              <label className="block font-semibold text-slate-700 mb-1">Sale End Date</label>
              <input
                type="datetime-local"
                value={form.sale_end_date || ""}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, sale_end_date: e.target.value }));
                  if (fieldErrors.sale_end_date) setFieldErrors((prev) => ({ ...prev, sale_end_date: "" }));
                }}
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none ${
                  fieldErrors.sale_end_date
                    ? "border-rose-500 bg-rose-50/50 text-rose-900 focus:border-rose-600"
                    : "border-slate-200 focus:border-emerald-600"
                }`}
              />
              {fieldErrors.sale_end_date && (
                <p className="text-rose-600 font-semibold text-xs mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.sale_end_date}
                </p>
              )}
            </div>
          </div>

          {/* Profit & Margin Calculator Display */}
          {profitCents !== null && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
              <div>
                <span className="block font-bold">Vendor Private Profit Margin:</span>
                <span>Calculated based on selling price minus cost price.</span>
              </div>
              <div className="text-right">
                <span className="block text-lg font-black text-emerald-700">
                  PKR {(profitCents / 100).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-bold text-emerald-600">{profitMarginPct}% Margin</span>
              </div>
            </div>
          )}
        </section>

        {/* Section 5: Inventory */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-amber-600" />
            <span>5. Inventory & Stock Rules</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div data-field="sku">
              <label className="block font-semibold text-slate-700 mb-1">Product SKU *</label>
              <input
                type="text"
                required
                value={form.sku}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, sku: e.target.value.toUpperCase() }));
                  if (fieldErrors.sku) setFieldErrors((prev) => ({ ...prev, sku: "" }));
                }}
                placeholder="DB-AIRPODS-3-A7K29"
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:outline-none ${
                  fieldErrors.sku
                    ? "border-rose-500 bg-rose-50/50 text-rose-900 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-amber-500"
                }`}
              />
              {fieldErrors.sku && (
                <p className="text-rose-600 font-semibold text-xs mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.sku}
                </p>
              )}
            </div>

            <div data-field="stock">
              <label className="block font-semibold text-slate-700 mb-1">Available Stock *</label>
              <input
                type="number"
                required
                value={form.stock.toString()}
                onChange={(e) => {
                  const val = parseInt(e.target.value || "0", 10);
                  setForm((prev) => ({ ...prev, stock: isNaN(val) ? 0 : val }));
                  if (fieldErrors.stock) setFieldErrors((prev) => ({ ...prev, stock: "" }));
                }}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none ${
                  fieldErrors.stock
                    ? "border-rose-500 bg-rose-50/50 text-rose-900 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-amber-500"
                }`}
              />
              {fieldErrors.stock && (
                <p className="text-rose-600 font-semibold text-xs mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {fieldErrors.stock}
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Low Stock Threshold</label>
              <input
                type="number"
                value={form.low_stock_threshold.toString()}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, low_stock_threshold: parseInt(e.target.value || "5", 10) }))
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </section>

        {/* Section 6: Variants (Variable Products) */}
        {form.product_type === "VARIABLE" && (
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>6. Product Variants & Matrix</span>
            </h2>
            <VariantMatrixGenerator
              parentSku={form.sku}
              parentPriceCents={form.price}
              attributes={form.attributes}
              variants={form.variants}
              onChangeAttributes={(attrs) => setForm((prev) => ({ ...prev, attributes: attrs }))}
              onChangeVariants={(vars) => setForm((prev) => ({ ...prev, variants: vars }))}
            />
          </section>
        )}

        {/* Section 7: Shipping */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-600" />
            <span>7. Shipping & Dimensions</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.01"
                value={form.weight || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, weight: parseFloat(e.target.value) || undefined }))}
                placeholder="0.25"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Length (cm)</label>
              <input
                type="number"
                step="0.1"
                value={form.length || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, length: parseFloat(e.target.value) || undefined }))}
                placeholder="10"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Width (cm)</label>
              <input
                type="number"
                step="0.1"
                value={form.width || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, width: parseFloat(e.target.value) || undefined }))}
                placeholder="8"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Height (cm)</label>
              <input
                type="number"
                step="0.1"
                value={form.height || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, height: parseFloat(e.target.value) || undefined }))}
                placeholder="4"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
              />
            </div>
          </div>
        </section>

        {/* Section 8: Tags */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-600" />
              <span>8. Product Search Tags</span>
            </h2>
            <button
              type="button"
              onClick={() => handleAIContent("tags")}
              className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>AI Generate Tags</span>
            </button>
          </div>

          <form onSubmit={handleAddTag} className="flex items-center gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add product tag (e.g. wireless, earbuds)..."
              className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 cursor-pointer"
            >
              Add Tag
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {form.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200/80"
              >
                <span>#{t}</span>
                <button type="button" onClick={() => handleRemoveTag(t)} className="text-amber-700 hover:text-slate-950 cursor-pointer">
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* Section 10: SEO Preview */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-600" />
            <span>10. Search Engine Optimization (SEO)</span>
          </h2>
          <ProductSEOPreview
            productName={form.name}
            categoryName={form.category_name}
            slug={form.slug}
            seo={form.seo}
            onChangeSEO={(seo) => setForm((prev) => ({ ...prev, seo }))}
          />
        </section>
      </div>

      {/* Category Picker Modal */}
      <CategoryPickerModal
        isOpen={categoryModalOpen}
        selectedCategoryId={form.category_id}
        onSelectCategory={(cat: CategoryItem) => {
          setForm((prev) => ({ ...prev, category_id: cat.id, category_name: cat.name }));
          if (fieldErrors.category_id) setFieldErrors((prev) => ({ ...prev, category_id: "" }));
        }}
        onClose={() => setCategoryModalOpen(false)}
      />

      {/* Customer Product Preview Modal */}
      <CustomerProductPreviewModal
        isOpen={previewModalOpen}
        storeName={user?.first_name ? `${user.first_name}'s Store` : "DigiBazar Store"}
        form={form}
        onClose={() => setPreviewModalOpen(false)}
      />
    </CompanyShell>
  );
}
