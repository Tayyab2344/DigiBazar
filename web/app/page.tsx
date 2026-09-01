"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Sparkles, TrendingUp, Sparkle } from "lucide-react";

import { publicApi, HomepageResponse } from "@/lib/api/public";
import { Header } from "@/components/marketplace/Header";
import { HeroCarousel } from "@/components/marketplace/HeroCarousel";
import { CategorySection } from "@/components/marketplace/CategorySection";
import { FlashDeals } from "@/components/marketplace/FlashDeals";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { TopStores } from "@/components/marketplace/TopStores";
import { MarketplaceBenefits } from "@/components/marketplace/MarketplaceBenefits";
import { Footer } from "@/components/marketplace/Footer";

export default function Home() {
  const [data, setData] = useState<HomepageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    publicApi
      .getHomepage()
      .then((res) => setData(res))
      .catch((err) => console.error("Error loading homepage data:", err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Header />
        {/* Skeleton Loaders */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
          <div className="w-full h-80 bg-slate-200 animate-pulse rounded-3xl"></div>
          <div className="grid grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-28 bg-slate-200 animate-pulse rounded-2xl"></div>
            ))}
          </div>
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
      {/* Marketplace Header */}
      <Header />

      <main className="flex-1 pb-16 space-y-12">
        {/* 1. Hero Promotional Carousel */}
        <HeroCarousel slides={data.hero_slides} />

        {/* 2. Categories Grid */}
        <CategorySection categories={data.categories} />

        {/* 3. Featured Products Section */}
        {data.featured_products && data.featured_products.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Featured Products
                </h2>
              </div>
              <Link
                href="/search?sort=featured"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
              >
                <span>View All &rarr;</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {data.featured_products.slice(0, 5).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* 4. Trending Now Section */}
        {data.popular_products && data.popular_products.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Trending</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Trending Now
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  Products shoppers are loving right now
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {data.popular_products.slice(0, 5).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* 5. Promotional Dark Navy Banner */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-slate-900 overflow-hidden border border-slate-800 text-white p-8 sm:p-12 grid grid-cols-1 md:grid-cols-12 items-center gap-8 shadow-xl">
            <div className="md:col-span-7 space-y-4">
              <span className="px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 border border-amber-300/50">
                LIMITED DEALS
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Upgrade your everyday
              </h2>
              <p className="text-sm sm:text-base text-slate-300 font-medium max-w-lg">
                Discover deals from trusted DigiBazar stores.
              </p>
              <div className="pt-2">
                <Link
                  href="/search?sort=deals"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all"
                >
                  <span>Explore Deals</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </Link>
              </div>
            </div>

            <div className="hidden md:flex md:col-span-5 items-center justify-center">
              <div className="w-full max-w-xs aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl p-1 bg-white/5">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"
                  alt="Explore Deals"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 6. Shop from Trusted Stores */}
        <TopStores companies={data.top_companies} />

        {/* 7. New Arrivals Section */}
        {data.new_arrivals && data.new_arrivals.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  New Arrivals
                </h2>
              </div>
              <Link
                href="/search?sort=newest"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
              >
                <span>View All &rarr;</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {data.new_arrivals.slice(0, 5).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
