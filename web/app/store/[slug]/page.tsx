"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Store, CheckCircle, Star, Package, ChevronRight, Share2, UserPlus, ShieldCheck } from "lucide-react";

import { publicApi, PublicCompany, PublicProductCard } from "@/lib/api/public";
import { Header } from "@/components/marketplace/Header";
import { Footer } from "@/components/marketplace/Footer";
import { ProductCard } from "@/components/marketplace/ProductCard";

export default function StorefrontPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const [company, setCompany] = useState<PublicCompany | null>(null);
  const [products, setProducts] = useState<PublicProductCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setIsLoading(true);

    Promise.all([
      publicApi.getCompanyDetail(slug),
      publicApi.getProducts({ company_slug: slug, limit: 24 }),
    ])
      .then(([compRes, prodRes]) => {
        setCompany(compRes);
        setProducts(prodRes.items);
      })
      .catch((err) => console.error("Error loading company storefront:", err))
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading || !company) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Header />
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 space-y-6">
          <div className="h-48 bg-slate-200 animate-pulse rounded-3xl"></div>
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-64 bg-slate-200 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-amber-600 transition-colors">Marketplace</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">{company.name}</span>
        </nav>

        {/* Company Header Store Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Cover Photo */}
          <div className="relative h-44 sm:h-56 bg-slate-900 overflow-hidden">
            <img
              src={company.cover_image_url || "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200&q=80"}
              alt={company.name}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
          </div>

          {/* Store Info Bar */}
          <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4 -mt-12 sm:-mt-16">
              {/* Logo */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-1.5 shadow-xl border border-slate-200 shrink-0 overflow-hidden">
                <img
                  src={company.logo_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&q=80"}
                  alt={company.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {company.name}
                  </h1>
                  {company.is_verified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Verified Store
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 max-w-lg mt-1 line-clamp-2">
                  {company.description || "Official seller store on DigiBazar Marketplace."}
                </p>
              </div>
            </div>

            {/* Store Stats & Follow Button */}
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-extrabold text-slate-900">{company.rating.toFixed(1)}</span>
                  <span className="text-[11px] text-slate-400">({company.review_count})</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <Package className="w-4 h-4 text-amber-600" />
                  <span>{company.product_count} Products</span>
                </div>
              </div>

              <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all ${
                  isFollowing
                    ? "bg-slate-100 text-slate-800 border border-slate-300"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>{isFollowing ? "Following Store" : "Follow Store"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Store Catalog Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="text-xl font-black text-slate-900">
            Products by {company.name} ({products.length})
          </h2>
        </div>

        {/* Store Products Grid */}
        {products.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">No products available yet</h3>
            <p className="text-xs text-slate-500">This store is currently preparing its catalog.</p>
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
