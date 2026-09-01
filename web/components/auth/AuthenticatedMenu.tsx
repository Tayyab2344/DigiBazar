"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  LogOut,
  ShoppingBag,
  Heart,
  MapPin,
  Star,
  Settings,
  Store,
  Tag,
  BarChart3,
  Users,
  Building2,
  Package,
  Shield,
  ChevronDown,
} from "lucide-react";

export const AuthenticatedMenu: React.FC = () => {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="text-sm font-semibold px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
        >
          Create Account
        </Link>
      </div>
    );
  }

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.push("/login");
  };

  const getRoleBadge = () => {
    switch (user.role) {
      case "SUPER_ADMIN":
        return { label: "Super Admin", color: "bg-zinc-100 text-zinc-900 border-zinc-300 font-bold" };
      case "COMPANY":
        return { label: "Seller / Vendor", color: "bg-amber-50 text-amber-900 border-amber-200 font-bold" };
      default:
        return { label: "Customer", color: "bg-zinc-100 text-zinc-700 border-zinc-200 font-medium" };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 text-left group focus:outline-none"
      >
        <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
          {user.first_name[0]}
          {user.last_name[0]}
        </div>
        <div className="hidden xl:flex flex-col text-left leading-tight">
          <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-tight">
            Hello, {user.first_name}
          </span>
          <span className="text-xs font-bold text-zinc-900 flex items-center gap-1 group-hover:text-zinc-600 transition-colors">
            Account & Orders
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-zinc-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* User Profile Header */}
          <div className="px-4 py-3 border-b border-zinc-100">
            <p className="text-xs font-extrabold text-zinc-900 truncate">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-[11px] text-zinc-500 truncate mb-2">{user.email}</p>
            <span
              className={`inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border ${roleBadge.color}`}
            >
              {roleBadge.label}
            </span>
          </div>

          {/* Menu Sections based on Role */}
          <div className="py-1">
            {user.role === "CUSTOMER" && (
              <>
                <Link
                  href="/customer/orders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 text-zinc-400" />
                  <span>My Orders & Tracking</span>
                </Link>
                <Link
                  href="/customer/wishlist"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                >
                  <Heart className="w-4 h-4 text-zinc-400" />
                  <span>My Wishlist</span>
                </Link>
                <Link
                  href="/customer/addresses"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-zinc-400" />
                  <span>Shipping Addresses</span>
                </Link>
                <Link
                  href="/customer/reviews"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                >
                  <Star className="w-4 h-4 text-zinc-400" />
                  <span>Product Reviews</span>
                </Link>
                <Link
                  href="/account/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                >
                  <Settings className="w-4 h-4 text-zinc-400" />
                  <span>Account Settings</span>
                </Link>
              </>
            )}

            {user.role === "COMPANY" && (
              <>
                <Link
                  href="/company/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-50 transition-colors"
                >
                  <Store className="w-4 h-4 text-amber-600" />
                  <span>Seller Portal</span>
                </Link>
                <Link
                  href="/company/orders"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 text-zinc-400" />
                  <span>Store Orders</span>
                </Link>
                <Link
                  href="/company/products"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                >
                  <Package className="w-4 h-4 text-zinc-400" />
                  <span>Products Catalog</span>
                </Link>
                <Link
                  href="/company/coupons"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                >
                  <Tag className="w-4 h-4 text-zinc-400" />
                  <span>Promotions & Coupons</span>
                </Link>
                <Link
                  href="/account/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                >
                  <Settings className="w-4 h-4 text-zinc-400" />
                  <span>Settings</span>
                </Link>
              </>
            )}

            {user.role === "SUPER_ADMIN" && (
              <>
                <Link
                  href="/admin/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-zinc-900 hover:bg-zinc-50 transition-colors"
                >
                  <Shield className="w-4 h-4 text-zinc-900" />
                  <span>Admin Console</span>
                </Link>
                <Link
                  href="/admin/companies"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-zinc-400" />
                  <span>Vendors Directory</span>
                </Link>
                <Link
                  href="/admin/customers"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                >
                  <Users className="w-4 h-4 text-zinc-400" />
                  <span>Platform Users</span>
                </Link>
                <Link
                  href="/admin/analytics"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                >
                  <BarChart3 className="w-4 h-4 text-zinc-400" />
                  <span>Analytics</span>
                </Link>
              </>
            )}
          </div>

          {/* Logout Button */}
          <div className="pt-1 mt-1 border-t border-zinc-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
