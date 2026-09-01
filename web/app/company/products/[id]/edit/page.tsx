"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { CompanyShell } from "@/components/company/CompanyShell";
import { ProductFormHeader } from "@/components/company/product/ProductFormHeader";
import { CategoryPickerModal } from "@/components/company/product/CategoryPickerModal";
import { ProductMediaManager } from "@/components/company/product/ProductMediaManager";
import { VariantMatrixGenerator } from "@/components/company/product/VariantMatrixGenerator";
import { CustomerProductPreviewModal } from "@/components/company/product/CustomerProductPreviewModal";
import { productApi } from "@/lib/api/product";
import { companyApi } from "@/lib/api/company";
import type { ProductFormState, ProductImageItem } from "@/types/product";
import {
  Package,
  Layers,
  FileText,
  Image as ImageIcon,
  DollarSign,
  Boxes,
  Truck,
  Sparkles,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

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

    price: 0,
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

  const [loading, setLoading] = useState(true);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [tagInput, setTagInput] = useState("");

  // Load existing product data
  useEffect(() => {
    if (!productId) return;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const enhanced = await productApi.getEnhancedProduct(productId);
        
        // Map images to ProductImageItem format (filtering out expired blob URLs)
        const mappedImages: ProductImageItem[] = (enhanced.images || [])
          .map((img, idx) => ({
            url: typeof img === "string" ? img : img.url,
            cloudinary_public_id: typeof img === "object" ? img.cloudinary_public_id : undefined,
            alt_text: typeof img === "object" ? img.alt_text || enhanced.name : enhanced.name,
            sort_order: typeof img === "object" ? img.sort_order : idx,
            is_primary: typeof img === "object" ? img.is_primary : idx === 0,
          }))
          .filter((img) => img.url && !img.url.startsWith("blob:"));

        setForm({
          product_type: (enhanced.product_type as any) || "SIMPLE",
          name: enhanced.name || "",
          slug: enhanced.slug || "",
          sku: enhanced.sku || "",
          category_id: enhanced.category_id || "",
          category_name: "",
          brand: enhanced.brand || "",
          short_description: enhanced.short_description || "",
          description: enhanced.description || "",
          price: enhanced.price || 0,
          sale_price: enhanced.sale_price || undefined,
          cost_price: enhanced.cost_price || undefined,
          tax_setting: enhanced.tax_setting || "STANDARD",
          sale_start_date: enhanced.sale_start_date ? new Date(enhanced.sale_start_date).toISOString().slice(0, 16) : "",
          sale_end_date: enhanced.sale_end_date ? new Date(enhanced.sale_end_date).toISOString().slice(0, 16) : "",
          stock: enhanced.stock || 0,
          low_stock_threshold: enhanced.low_stock_threshold || 5,
          barcode: enhanced.barcode || "",
          track_inventory: enhanced.track_inventory ?? true,
          backorders_policy: (enhanced.backorders_policy as any) || "STOP_SELLING",
          weight: enhanced.weight || undefined,
          length: enhanced.length || undefined,
          width: enhanced.width || undefined,
          height: enhanced.height || undefined,
          shipping_class: enhanced.shipping_class || "",
          status: (enhanced.status as any) || "DRAFT",
          visibility: (enhanced.visibility as any) || "PUBLIC",
          images: mappedImages,
          variants: (enhanced.variants || []).map((v) => ({
            id: v.id,
            sku: v.sku,
            price: v.price,
            sale_price: v.sale_price || undefined,
            cost_price: v.cost_price || undefined,
            stock: v.stock,
            low_stock_threshold: v.low_stock_threshold,
            barcode: v.barcode || undefined,
            image_url: v.image_url || undefined,
            weight: v.weight || undefined,
            attributes: v.attributes || {},
            is_active: v.is_active,
          })),
          attributes: (enhanced.attributes || []).map((a) => ({
            id: a.id,
            name: a.name,
            value: a.value,
            is_variation: a.is_variation,
          })),
          tags: enhanced.tags || [],
          seo: {
            title: enhanced.seo?.title || "",
            description: enhanced.seo?.description || "",
            keywords: enhanced.seo?.keywords || "",
          },
          related_product_ids: enhanced.related_product_ids || [],
        });
      } catch (err: any) {
        setErrorMessage("Failed to load product details: " + (err.message || "Unknown error"));
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const sectionStatus = useMemo(() => {
    return {
      "Basic Info": Boolean(form.name.trim() && form.description.trim()),
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

  const sellingPriceCents = form.sale_price || form.price || 0;
  const profitCents = form.cost_price ? sellingPriceCents - form.cost_price : null;
  const profitMarginPct = profitCents && sellingPriceCents > 0
    ? ((profitCents / sellingPriceCents) * 100).toFixed(1)
    : null;

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

  const handleUpdate = async (targetStatus?: string) => {
    try {
      setIsSaving(true);
      setErrorMessage("");
      setFieldErrors({});

      const payload = getSanitizedPayload(targetStatus);
      await productApi.updateEnhancedProduct(productId, payload);
      
      if ((targetStatus as string) === "active" && (form.status as string) !== "active") {
        await productApi.publishProduct(productId);
      }
      
      router.push("/company/products");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update product.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <CompanyShell>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading product details for editing...</p>
        </div>
      </CompanyShell>
    );
  }

  return (
    <CompanyShell>
      {/* Sticky Header Bar */}
      <ProductFormHeader
        completionPct={completionPct}
        sectionStatus={sectionStatus}
        isEditing={true}
        productStatus={form.status}
        isSaving={isSaving}
        onSaveDraft={() => handleUpdate("draft")}
        onPreview={() => setPreviewModalOpen(true)}
        onPublish={() => handleUpdate("active")}
      />

      <div className="max-w-5xl mx-auto mt-4 mb-2">
        <Link
          href="/company/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products Catalog</span>
        </Link>
      </div>

      {errorMessage && (
        <div className="max-w-5xl mx-auto mt-2 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Main Product Edit Layout */}
      <div className="max-w-5xl mx-auto space-y-8 py-4 text-xs">
        {/* Section 1: Basic Information */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            <span>Product Details</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product SKU *</label>
              <input
                type="text"
                required
                value={form.sku}
                onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Brand */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Brand Name</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Short Description */}
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Short Description</label>
              <textarea
                rows={2}
                value={form.short_description}
                onChange={(e) => setForm((prev) => ({ ...prev, short_description: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Detailed Description */}
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Detailed Description *</label>
              <textarea
                rows={5}
                required
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Product Media */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-600" />
            <span>Product Media & Images</span>
          </h2>
          <ProductMediaManager
            images={form.images}
            onChangeImages={(imgs) => setForm((prev) => ({ ...prev, images: imgs }))}
          />
        </section>

        {/* Section 3: Pricing & Stock */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span>Pricing & Inventory</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Regular Price (PKR) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={(form.price / 100).toString()}
                onChange={(e) => setForm((prev) => ({ ...prev, price: Math.round(parseFloat(e.target.value || "0") * 100) }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sale Price (PKR)</label>
              <input
                type="number"
                step="0.01"
                value={form.sale_price ? (form.sale_price / 100).toString() : ""}
                onChange={(e) => setForm((prev) => ({ ...prev, sale_price: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : undefined }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Available Stock *</label>
              <input
                type="number"
                required
                value={form.stock.toString()}
                onChange={(e) => setForm((prev) => ({ ...prev, stock: parseInt(e.target.value || "0", 10) }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </section>
      </div>

      {previewModalOpen && (
        <CustomerProductPreviewModal
          isOpen={previewModalOpen}
          form={form}
          onClose={() => setPreviewModalOpen(false)}
        />
      )}
    </CompanyShell>
  );
}
