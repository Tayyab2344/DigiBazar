"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Filter, SlidersHorizontal, ArrowUpDown, X, Grid, RefreshCw } from "lucide-react";

import { publicApi, PublicProductCard, PublicCategory } from "@/lib/api/public";
import { Header } from "@/components/marketplace/Header";
import { Footer } from "@/components/marketplace/Footer";
import { ProductCard } from "@/components/marketplace/ProductCard";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const qParam = searchParams.get("q") || "";
  const catParam = searchParams.get("category_slug") || "";
  const companyParam = searchParams.get("company_slug") || "";
  const sortParam = searchParams.get("sort_by") || "relevance";

  const [products, setProducts] = useState<PublicProductCard[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState(catParam);
  const [selectedSort, setSelectedSort] = useState(sortParam);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minRating, setMinRating] = useState<number | null>(null);

  useEffect(() => {
    publicApi.getCategories().then((res) => setCategories(res));
  }, []);

  useEffect(() => {
    setIsLoading(true);

    const minCents = minPrice ? parseInt(minPrice) * 100 : undefined;
    const maxCents = maxPrice ? parseInt(maxPrice) * 100 : undefined;

    publicApi
      .getProducts({
        q: qParam,
        category_slug: selectedCategory || undefined,
        company_slug: companyParam || undefined,
        min_price: minCents,
        max_price: maxCents,
        min_rating: minRating || undefined,
        sort_by: selectedSort,
        page: 1,
        limit: 24,
      })
      .then((res) => {
        setProducts(res.items);
        setTotal(res.total);
      })
      .catch((err) => console.error("Error loading search products:", err))
      .finally(() => setIsLoading(false));
  }, [qParam, selectedCategory, companyParam, selectedSort, minPrice, maxPrice, minRating]);

  const handleClearFilters = () => {
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating(null);
    setSelectedSort("relevance");
    router.push("/search");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Title & Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {qParam ? `Search results for "${qParam}"` : "Browse Marketplace Products"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Showing <strong className="text-slate-800">{total}</strong> verified items available across stores
            </p>
          </div>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" /> Sort By:
            </span>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="bg-white border border-slate-300 font-semibold text-xs text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
            >
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest Additions</option>
              <option value="popular">Best Selling</option>
            </select>
          </div>
        </div>

        {/* Filters Sidebar & Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Filter Sidebar (3 Cols) */}
          <aside className="lg:col-span-3 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-6 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                <span>Filters</span>
              </div>
              <button
                onClick={handleClearFilters}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-900 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Category
              </label>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                <button
                  onClick={() => setSelectedCategory("")}
                  className={`w-full text-left text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    selectedCategory === "" ? "bg-amber-50 text-amber-900 border border-amber-200/80 font-bold" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full text-left text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      selectedCategory === cat.slug ? "bg-amber-50 text-amber-900 border border-amber-200/80 font-bold" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Price Range (Rs.)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Minimum Rating
              </label>
              <div className="space-y-1">
                {[4, 3, 2].map((r) => (
                  <button
                    key={r}
                    onClick={() => setMinRating(minRating === r ? null : r)}
                    className={`w-full text-left text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                      minRating === r ? "bg-amber-50 text-amber-900 font-bold border border-amber-200/80" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span>{r}★ & above</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Product Grid (9 Cols) */}
          <div className="lg:col-span-9">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-72 bg-slate-200 animate-pulse rounded-2xl"></div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 my-auto">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto mb-4">
                  <Grid className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">No products found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                  We couldn&apos;t find any items matching your selected query and filters. Try clearing your filters.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2.5 bg-zinc-900 text-white hover:bg-zinc-800 font-bold text-xs rounded-xl transition-colors shadow-md"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
