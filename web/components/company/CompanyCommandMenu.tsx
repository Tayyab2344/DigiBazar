"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, ShoppingBag, Ticket, Sparkles, ArrowRight, X } from "lucide-react";

interface CompanyCommandMenuProps {
  open: boolean;
  onClose: () => void;
}

export const CompanyCommandMenu: React.FC<CompanyCommandMenuProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Search Header Input */}
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, orders, customers, coupons…"
            autoFocus
            className="flex-1 text-sm bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400"
          />
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Links & Results */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3 text-xs">
          <div>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Quick Shortcuts
            </span>
            <div className="mt-1 space-y-0.5">
              <button
                onClick={() => navigateTo("/company/products/new")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-amber-600" />
                  <span>Add New Product</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => navigateTo("/company/orders")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>View All Orders</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => navigateTo("/company/coupons")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Ticket className="w-4 h-4 text-amber-600" />
                  <span>Create Discount Coupon</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                onClick={() => navigateTo("/company/campaigns")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 font-medium transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Launch Influencer Campaign</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Search DigiBazar Seller Workspace</span>
          <div className="flex items-center gap-2">
            <span>Press <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded">ESC</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
