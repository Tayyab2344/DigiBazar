"use client";

import React, { useState } from "react";
import { Search, Sparkles, Globe } from "lucide-react";
import { productApi } from "@/lib/api/product";
import type { ProductSEOItem } from "@/types/product";

interface Props {
  productName: string;
  categoryName?: string;
  slug: string;
  seo: ProductSEOItem;
  onChangeSEO: (seo: ProductSEOItem) => void;
}

export function ProductSEOPreview({
  productName,
  categoryName,
  slug,
  seo,
  onChangeSEO,
}: Props) {
  const [generatingField, setGeneratingField] = useState<string | null>(null);

  const displayTitle = seo.title || (productName ? `${productName} | DigiBazar` : "Product Title | DigiBazar");
  const displayDesc =
    seo.description ||
    (productName
      ? `Buy ${productName} online on DigiBazar. Explore features, specifications, and fast delivery in Pakistan.`
      : "Shop top-rated products on DigiBazar marketplace.");
  const displayUrl = `https://digibazar.com/products/${slug || "product-slug-a7k29"}`;

  const handleAIAssist = async (type: "seo_title" | "meta_description") => {
    if (!productName.trim()) return;
    try {
      setGeneratingField(type);
      const res = await productApi.generateAIContent({
        product_name: productName,
        category_name: categoryName,
        content_type: type,
      });

      if (type === "seo_title") {
        onChangeSEO({ ...seo, title: res.generated_text });
      } else {
        onChangeSEO({ ...seo, description: res.generated_text });
      }
    } catch (err) {
      console.error("AI assistant error:", err);
    } finally {
      setGeneratingField(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Google Search Preview Snippet */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Globe className="w-4 h-4 text-amber-600" />
          <span>Search Engine Google Snippet Preview</span>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center">
              D
            </span>
            <span className="truncate max-w-[300px]">{displayUrl}</span>
          </div>
          <h4 className="text-base font-bold text-amber-800 hover:underline cursor-pointer leading-tight">
            {displayTitle}
          </h4>
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{displayDesc}</p>
        </div>
      </div>

      {/* Inputs Form */}
      <div className="space-y-4">
        {/* SEO Title */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">SEO Page Title</label>
            <button
              type="button"
              onClick={() => handleAIAssist("seo_title")}
              disabled={generatingField === "seo_title"}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3 text-purple-500" />
              <span>{generatingField === "seo_title" ? "Generating..." : "AI Generate Title"}</span>
            </button>
          </div>
          <input
            type="text"
            value={seo.title || ""}
            onChange={(e) => onChangeSEO({ ...seo, title: e.target.value })}
            placeholder="Custom SEO Title..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Meta Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">Meta Description</label>
            <button
              type="button"
              onClick={() => handleAIAssist("meta_description")}
              disabled={generatingField === "meta_description"}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3 text-purple-500" />
              <span>{generatingField === "meta_description" ? "Generating..." : "AI Generate Description"}</span>
            </button>
          </div>
          <textarea
            rows={3}
            value={seo.description || ""}
            onChange={(e) => onChangeSEO({ ...seo, description: e.target.value })}
            placeholder="Search result snippet summary (150-160 characters recommended)..."
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">SEO Search Keywords</label>
          <input
            type="text"
            value={seo.keywords || ""}
            onChange={(e) => onChangeSEO({ ...seo, keywords: e.target.value })}
            placeholder="Comma-separated keywords (e.g. airpods, wireless earbuds, bluetooth headphones)..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>
    </div>
  );
}
