"use client";

import React, { useState } from "react";
import { X, Star, ShieldCheck, ShoppingCart, CreditCard, Store, CheckCircle, Package } from "lucide-react";
import type { ProductFormState } from "@/types/product";

interface Props {
  isOpen: boolean;
  storeName?: string;
  form: ProductFormState;
  onClose: () => void;
}

export function CustomerProductPreviewModal({
  isOpen,
  storeName,
  form,
  onClose,
}: Props) {
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);

  if (!isOpen) return null;

  const images = form.images;
  const currentImg = images[selectedImgIdx] || images[0];

  const pricePKR = (form.price / 100).toLocaleString("en-PK", { minimumFractionDigits: 2 });
  const salePricePKR = form.sale_price ? (form.sale_price / 100).toLocaleString("en-PK", { minimumFractionDigits: 2 }) : null;

  const discountPct = form.sale_price && form.price > form.sale_price
    ? Math.round(((form.price - form.sale_price) / form.price) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
              Customer Live Preview
            </span>
            <span className="text-xs text-slate-300">How buyers will see this item on DigiBazar</span>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Page Layout Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Media Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative flex items-center justify-center">
              {currentImg?.url ? (
                <img src={currentImg.url} alt={form.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-400 flex flex-col items-center gap-1">
                  <Package className="w-12 h-12 text-slate-300" />
                  <span className="text-xs">No Image Uploaded</span>
                </div>
              )}
              {discountPct > 0 && (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-600 text-white shadow-md">
                  -{discountPct}% OFF
                </span>
              )}
            </div>

            {/* Thumbnail Carousel */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImgIdx(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImgIdx === i ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-200 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img.url} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Product Buy Section */}
          <div className="space-y-5 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Store & Brand Pill */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  <Store className="w-3.5 h-3.5 text-slate-500" />
                  <span>{storeName || "Official Store"}</span>
                </span>
                {form.brand && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/80">
                    {form.brand}
                  </span>
                )}
              </div>

              {/* Product Title */}
              <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                {form.name || "Product Name Placeholder"}
              </h2>

              {/* Rating Placeholder */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current text-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-slate-900">5.0</span>
                <span className="text-slate-400">&bull; New Verified Listing</span>
              </div>

              {/* Price Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-baseline gap-3">
                {salePricePKR ? (
                  <>
                    <span className="text-2xl font-black text-emerald-600">PKR {salePricePKR}</span>
                    <span className="text-sm font-semibold text-slate-400 line-through">PKR {pricePKR}</span>
                  </>
                ) : (
                  <span className="text-2xl font-black text-slate-900">PKR {pricePKR}</span>
                )}
              </div>

              {/* Stock Status Pill */}
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold ${
                    form.stock > 0
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{form.stock > 0 ? `${form.stock} In Stock` : "Out of Stock"}</span>
                </span>
                <span className="text-slate-400 text-[11px]">SKU: {form.sku || "DB-AIRPODS-A7K29"}</span>
              </div>

              {/* Description Snippet */}
              {form.short_description && (
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  {form.short_description}
                </p>
              )}

              {/* Variants Selector Preview */}
              {form.variants.length > 0 && (
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-900">Available Options:</span>
                  <div className="flex flex-wrap gap-2">
                    {form.variants.map((v, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs"
                      >
                        {Object.values(v.attributes).join(" / ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Buyer CTA Buttons */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="py-3 rounded-xl bg-slate-100 text-slate-900 font-bold text-xs hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4 text-slate-700" />
                  <span>Add to Cart</span>
                </button>

                <button
                  type="button"
                  className="py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <CreditCard className="w-4 h-4 text-slate-950" />
                  <span>Buy Now</span>
                </button>
              </div>

              <span className="block text-center text-[10px] text-slate-400">
                Guaranteed safe checkout & DigiBazar buyer protection.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
