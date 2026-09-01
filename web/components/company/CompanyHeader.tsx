"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { companyApi } from "@/lib/api/company";
import type { CompanyProfileRead } from "@/types/company";
import {
  Menu,
  Search,
  Bell,
  ExternalLink,
  ChevronRight,
  User,
  Settings,
  LogOut,
  Store,
  ChevronDown,
  Sparkles,
  Command,
} from "lucide-react";

interface CompanyHeaderProps {
  onMenuClick: () => void;
  onCommandMenuClick: () => void;
  onNotificationClick: () => void;
}

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({
  onMenuClick,
  onCommandMenuClick,
  onNotificationClick,
}) => {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<CompanyProfileRead | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isStoreActive, setIsStoreActive] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await companyApi.getProfile();
        setProfile(data);
        setIsStoreActive(data.store_status === "open");
      } catch (err) {
        console.error("Failed to load header company profile:", err);
      }
    }
    loadProfile();
  }, []);

  const handleToggleStoreStatus = async () => {
    const nextStatus = isStoreActive ? "closed" : "open";
    setIsStoreActive(!isStoreActive);
    try {
      await companyApi.updateProfile({ store_status: nextStatus });
    } catch (err) {
      console.error("Failed to toggle store status:", err);
      setIsStoreActive(isStoreActive);
    }
  };

  // Generate dynamic breadcrumbs from path
  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length <= 1) return [{ label: "Dashboard", href: "/company/dashboard" }];

    return segments.map((seg, i) => {
      const href = "/" + segments.slice(0, i + 1).join("/");
      const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
      return { label, href };
    });
  };

  const breadcrumbs = getBreadcrumbs();
  const storeName = profile?.name || (user?.first_name ? `${user.first_name}'s Store` : "Vendor Store");
  const storeLink = profile?.slug ? `/store/${profile.slug}` : "/";

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs select-none">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
          <span className="font-medium text-slate-400">Company</span>
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={b.href}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link
                href={b.href}
                className={`hover:text-amber-700 font-medium ${
                  i === breadcrumbs.length - 1 ? "text-slate-900 font-semibold" : ""
                }`}
              >
                {b.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Center: Global Search Trigger */}
      <button
        onClick={onCommandMenuClick}
        className="hidden md:flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-500 bg-slate-100/80 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer w-64 lg:w-80 justify-between"
      >
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Search products, orders, customers…</span>
        </div>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
          <Command className="w-2.5 h-2.5" />K
        </kbd>
      </button>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Live Store Status Switch */}
        <button
          onClick={handleToggleStoreStatus}
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
            isStoreActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
          title="Toggle public store visibility"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isStoreActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`}
          />
          <span>{isStoreActive ? "Store Live" : "Maintenance"}</span>
        </button>

        {/* View Public Store */}
        <Link
          href={storeLink}
          target="_blank"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
        >
          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          <span>View Store</span>
        </Link>

        {/* Notification Bell */}
        <button
          onClick={onNotificationClick}
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
        </button>

        {/* Profile Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {profile?.logo_url ? (
              <img
                src={profile.logo_url}
                alt={storeName}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                {storeName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden lg:block text-left">
              <span className="block text-xs font-bold text-slate-900 leading-tight">{storeName}</span>
              <span className="block text-[10px] text-slate-500 font-medium">Vendor Admin</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs text-slate-700 animate-in fade-in slide-in-from-top-1"
              onMouseLeave={() => setProfileOpen(false)}
            >
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-900">{storeName}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>

              <Link
                href="/company/store"
                className="flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 transition-colors"
              >
                <Store className="w-4 h-4 text-slate-400" />
                <span>Store Profile</span>
              </Link>
              <Link
                href="/company/settings"
                className="flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </Link>

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
