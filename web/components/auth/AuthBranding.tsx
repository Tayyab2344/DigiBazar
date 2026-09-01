import React from "react";
import { ShieldCheck, ShoppingBag, Package, Star, Sparkles } from "lucide-react";
import { Logo } from "@/components/common/Logo";

export const AuthBranding: React.FC = () => {
  return (
    <div className="relative h-full w-full flex flex-col justify-between p-8 xl:p-12 text-white bg-slate-950 overflow-hidden select-none">
      {/* Background Image Layer with Dark Gradient Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity transform scale-105 transition-transform duration-1000 hover:scale-100"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80')",
        }}
      />
      
      {/* Ambient Gradient Overlays for Rich Atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/90" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Logo */}
      <div className="relative z-10 flex items-center justify-between">
        <Logo size="lg" textClassName="text-xl text-white" />

        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-white/10 text-slate-200 border border-white/15 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          Next-Gen Commerce
        </div>
      </div>

      {/* Main Copy & Interactive Visual Overlay */}
      <div className="relative z-10 my-auto py-6 space-y-8 max-w-lg">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-400/30 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Verified Multi-Vendor Marketplace
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Everything you need. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
              All in one marketplace.
            </span>
          </h1>
          
          <p className="text-sm text-slate-300 leading-relaxed max-w-md">
            Discover thousands of products from trusted businesses and enjoy a unified, seamless shopping experience.
          </p>
        </div>

        {/* Overlay Style Floating Feature Cards */}
        <div className="space-y-3.5 pt-2">
          {/* Card 1: Multi-Vendor Catalog */}
          <div className="p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md shadow-xl transition-transform hover:-translate-y-0.5 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span className="truncate">1,200+ Verified Vendors</span>
                <span className="text-emerald-400 text-[11px] font-bold">Active Stores</span>
              </div>
              <p className="text-[11px] text-slate-300 truncate mt-0.5">
                Electronics, fashion, essentials & direct manufacturer pricing
              </p>
            </div>
          </div>

          {/* Card 2: Single Checkout Protection */}
          <div className="p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md shadow-xl transition-transform hover:-translate-y-0.5 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs font-semibold text-white">
                <span className="truncate">Unified Cart & Shipping</span>
                <div className="flex items-center text-amber-400 text-[11px] font-bold">
                  <Star className="w-3.5 h-3.5 fill-current mr-1" />
                  <span>4.9 / 5</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 truncate mt-0.5">
                Buy from multiple companies in one order with buyer protection
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-white/10">
        <span>© {new Date().getFullYear()} digiBazar Inc.</span>
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Buyer Protection Guarantee
        </span>
      </div>
    </div>
  );
};
