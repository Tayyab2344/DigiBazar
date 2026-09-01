"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Grid } from "lucide-react";
import { PublicCategory } from "@/lib/api/public";

interface CategorySectionProps {
  categories: PublicCategory[];
}

export const CategorySection: React.FC<CategorySectionProps> = ({ categories }) => {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
            <Grid className="w-4 h-4" />
            <span>Marketplace Catalog</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Shop by Category
          </h2>
        </div>
        <Link
          href="/search"
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
        >
          <span>All Categories</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {categories.slice(0, 12).map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="group relative bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-blue-400 transition-all duration-300 flex flex-col items-center text-center overflow-hidden"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 overflow-hidden mb-3 group-hover:scale-110 transition-transform duration-300 border border-slate-100 shadow-inner">
              <img
                src={cat.image_url || "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&q=80"}
                alt={cat.name}
                loading="lazy"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
              {cat.name}
            </h3>
            <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
              {cat.product_count || 45}+ items
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};
