"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Clock, ArrowRight } from "lucide-react";
import { PublicProductCard } from "@/lib/api/public";
import { ProductCard } from "./ProductCard";

interface FlashDealsProps {
  products: PublicProductCard[];
  endTimeIso?: string;
}

export const FlashDeals: React.FC<FlashDealsProps> = ({ products, endTimeIso }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 32, seconds: 15 });

  useEffect(() => {
    const target = endTimeIso ? new Date(endTimeIso).getTime() : Date.now() + 4.5 * 3600 * 1000;

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, target - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [endTimeIso]);

  if (!products || products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-red-900 rounded-3xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Decorative Background Circles */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-rose-500/10 blur-2xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-amber-500/10 blur-2xl pointer-events-none"></div>

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400 text-slate-950 rounded-2xl font-black shadow-md flex items-center justify-center animate-bounce">
              <Zap className="w-6 h-6 fill-slate-950" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-widest">
                <span>Limited Time Event</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Flash Deals & Daily Price Cuts
              </h2>
            </div>
          </div>

          {/* Live Countdown Timer */}
          <div className="flex items-center gap-3 bg-slate-950/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-rose-500/30 w-fit">
            <div className="flex items-center gap-1 text-xs font-semibold text-rose-300">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: "8s" }} />
              <span>Ends in:</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-sm font-black text-white">
              <span className="bg-rose-600 px-2 py-1 rounded-md min-w-[28px] text-center">
                {String(timeLeft.hours).padStart(2, "0")}h
              </span>
              <span>:</span>
              <span className="bg-rose-600 px-2 py-1 rounded-md min-w-[28px] text-center">
                {String(timeLeft.minutes).padStart(2, "0")}m
              </span>
              <span>:</span>
              <span className="bg-rose-600 px-2 py-1 rounded-md min-w-[28px] text-center">
                {String(timeLeft.seconds).padStart(2, "0")}s
              </span>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6 relative z-10">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All Footer Button */}
        <div className="mt-6 text-center relative z-10">
          <Link
            href="/search?deal=flash"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-rose-900 font-extrabold text-xs sm:text-sm shadow-md transition-colors"
          >
            <span>View All Flash Deals ({products.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
