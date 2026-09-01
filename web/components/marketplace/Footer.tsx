"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, ShieldCheck, Mail, Phone, MapPin, Sparkles } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          
          {/* Column 1: DigiBazar Brand */}
          <div className="lg:col-span-1 space-y-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <ShoppingBag className="w-7 h-7 text-white stroke-[2.2] group-hover:text-amber-500 transition-colors" />
              <div className="flex flex-col leading-none">
                <span className="font-extrabold text-2xl tracking-tight text-white">
                  Digi<span className="font-light text-slate-300">Bazar</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5">
                  Digital Bazar for Modern Commerce
                </span>
              </div>
            </Link>
          </div>

          {/* Column 2: Shop */}
          <div>
            <h4 className="font-bold text-xs text-white uppercase tracking-wider mb-3">Shop</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/search" className="hover:text-blue-400 transition-colors">Categories</Link></li>
              <li><Link href="/search?sort=newest" className="hover:text-blue-400 transition-colors">New Arrivals</Link></li>
              <li><Link href="/search?sort=featured" className="hover:text-blue-400 transition-colors">Featured Products</Link></li>
              <li><Link href="/search?sort=deals" className="hover:text-blue-400 transition-colors">Deals</Link></li>
            </ul>
          </div>

          {/* Column 3: Customer Service */}
          <div>
            <h4 className="font-bold text-xs text-white uppercase tracking-wider mb-3">Customer Service</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/customer" className="hover:text-blue-400 transition-colors">Help Center</Link></li>
              <li><Link href="/customer" className="hover:text-blue-400 transition-colors">Shipping</Link></li>
              <li><Link href="/customer" className="hover:text-blue-400 transition-colors">Returns</Link></li>
              <li><Link href="/customer" className="hover:text-blue-400 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Column 4: Sell on DigiBazar */}
          <div>
            <h4 className="font-bold text-xs text-white uppercase tracking-wider mb-3">Sell on DigiBazar</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/register/company" className="hover:text-emerald-400 transition-colors font-semibold text-emerald-400">Become a Seller</Link></li>
              <li><Link href="/login" className="hover:text-blue-400 transition-colors">Seller Center</Link></li>
              <li><Link href="/company" className="hover:text-blue-400 transition-colors">Seller Guidelines</Link></li>
            </ul>
          </div>

          {/* Column 5: Company */}
          <div>
            <h4 className="font-bold text-xs text-white uppercase tracking-wider mb-3">Company</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/about" className="hover:text-blue-400 transition-colors">About DigiBazar</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-blue-400 transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>
        </div>

        {/* Social / Payment Area & Copyright */}
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>&copy; 2026 DigiBazar. All rights reserved.</div>

          {/* Payment Method Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300">Visa</span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300">Mastercard</span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-bold text-blue-400">Stripe</span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-bold text-emerald-400">Cash on Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
