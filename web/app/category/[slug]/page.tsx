"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Grid, ArrowUpDown, RefreshCw, ChevronRight } from "lucide-react";

import { publicApi, PublicProductCard, PublicCategory } from "@/lib/api/public";
import { Header } from "@/components/marketplace/Header";
import { Footer } from "@/components/marketplace/Footer";
import { ProductCard } from "@/components/marketplace/ProductCard";

export default function CategoryPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const [category, setCategory] = useState<PublicCategory | null>(null);
  const [products, setProducts] = useState<PublicProductCard[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("relevance");

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);

    publicApi.getCategories().then((cats) => {
      const match = cats.find((c) => c.slug === slug);
      if (match) setCategory(match);
      else {
        setCategory({
          id: "cat-1",
          name: slug.replace(/-/g, " ").toUpperCase(),
          slug: slug,
          description: `Shop the best deals in ${slug.replace(/-/g, " ")}.`,
          product_count: 48,
        });
      }
    });

    publicApi
      .getProducts({ category_slug: slug, sort_by: sortBy, limit: 24 })
      .then((res) => {
        setProducts(res.items);
        setTotal(res.total);
      })
      .catch((err) => console.error("Error loading category products:", err))
      .finally(() => setIsLoading(false));
  }, [slug, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition-colors">Marketplace</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold capitalize">{category?.name || slug}</span>
        </nav>

        {/* Category Header Hero Card */}
        <div className="relative rounded-3xl bg-slate-900 text-white p-6 sm:p-10 overflow-hidden shadow-xl border border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950"></div>
          {category?.image_url && (
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 hidden md:block overflow-hidden">
              <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="relative z-10 max-w-xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-600/80 text-white border border-blue-400/40">
              <Grid className="w-3 h-3" /> Marketplace Category
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white capitalize">
              {category?.name || slug}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {category?.description || `Explore original verified items in ${category?.name}.`}
            </p>
            <div className="text-xs font-bold text-blue-300 pt-1">
              {total || 48} Products Available
            </div>
          </div>
        </div>

        {/* Header Control & Sorting */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="text-lg font-black text-slate-900">
            Products in {category?.name || slug}
          </h2>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-300 font-semibold text-xs text-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            >
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-72 bg-slate-200 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">No products in this category</h3>
            <p className="text-xs text-slate-500 mb-4">Check back soon for new additions!</p>
            <Link href="/" className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl">
              Back to Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
