"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sliders, DollarSign, Store, Shield } from "lucide-react";

const SETTINGS_NAV = [
  { label: "General", href: "/admin/settings", icon: Sliders },
  { label: "Commerce & Tax", href: "/admin/settings/commerce", icon: DollarSign },
  { label: "Marketplace Rules", href: "/admin/settings/marketplace", icon: Store },
  { label: "Admin Users", href: "/admin/settings/admin-users", icon: Shield },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Platform Settings</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Configure marketplace commission rules, global platform behavior, and administrative credentials
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Settings Navigation */}
        <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg p-2 space-y-1">
          {SETTINGS_NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
                  active
                    ? "bg-[var(--surface-tertiary)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
                }`}
              >
                <Icon className="w-4 h-4 text-[var(--text-tertiary)]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Settings Content Panel */}
        <div className="md:col-span-3 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
