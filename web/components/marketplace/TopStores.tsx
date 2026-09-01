"use client";

import React from "react";
import Link from "next/link";
import { Store, CheckCircle, Star, ArrowRight, Package } from "lucide-react";
import { PublicCompany } from "@/lib/api/public";

interface TopStoresProps {
  companies: PublicCompany[];
}

export const TopStores: React.FC<TopStoresProps> = ({ companies }) => {
  if (!companies || companies.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Shop from Trusted Stores
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Discover verified sellers on DigiBazar
          </p>
        </div>
        <Link
          href="/search?type=stores"
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
        >
          <span>Explore All Stores</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {companies.slice(0, 5).map((comp) => (
          <div
            key={comp.id}
            className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg hover:border-blue-300 transition-all duration-300 overflow-hidden flex flex-col justify-between"
          >
            {/* Store Cover Image */}
            <div className="relative h-20 bg-slate-900 overflow-hidden">
              <img
                src={comp.cover_image_url || "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&q=80"}
                alt={comp.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>

              {/* Logo Overlay */}
              <div className="absolute -bottom-3 left-3 w-10 h-10 rounded-xl bg-white p-0.5 shadow-md border border-slate-100 overflow-hidden">
                <img
                  src={comp.logo_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80"}
                  alt={comp.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>

            {/* Store Details */}
            <div className="p-3 pt-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                  <Link href={`/company/${comp.slug}`} className="truncate">
                    {comp.name}
                  </Link>
                </div>
                <div className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 mt-0.5">
                  <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>Verified</span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-900">{comp.rating.toFixed(1)}</span>
                </div>

                <div className="flex items-center gap-1 font-semibold text-slate-500 text-[10px]">
                  <Package className="w-3 h-3 text-slate-400" />
                  <span>{comp.product_count.toLocaleString()} products</span>
                </div>
              </div>
            </div>

            {/* Visit Store Button */}
            <div className="p-4 pt-0">
              <Link
                href={`/company/${comp.slug}`}
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <span>Visit Store</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
