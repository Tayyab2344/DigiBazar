"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/common/Logo";
import {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  FolderTree,
  ShoppingCart,
  CreditCard,
  RotateCcw,
  Wallet,
  Ticket,
  Megaphone,
  UserCheck,
  FileText,
  Image,
  Home,
  Shield,
  Flag,
  BarChart3,
  Bell,
  ScrollText,
  Settings,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { label: "Companies", href: "/admin/companies", icon: Building2 },
      { label: "Customers", href: "/admin/customers", icon: Users },
      { label: "Products", href: "/admin/products", icon: Package },
      { label: "Categories", href: "/admin/categories", icon: FolderTree },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { label: "Payments", href: "/admin/payments", icon: CreditCard },
      { label: "Refunds", href: "/admin/refunds", icon: RotateCcw },
      { label: "Payouts", href: "/admin/payouts", icon: Wallet },
    ],
  },
  {
    label: "Growth",
    items: [
      { label: "Coupons", href: "/admin/coupons", icon: Ticket },
      { label: "Influencers", href: "/admin/influencers", icon: UserCheck },
      { label: "Campaigns", href: "/admin/campaigns", icon: Megaphone },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "CMS", href: "/admin/cms", icon: FileText },
      { label: "Banners", href: "/admin/cms/banners", icon: Image },
      { label: "Homepage", href: "/admin/cms/homepage", icon: Home },
    ],
  },
  {
    label: "Trust & Safety",
    items: [
      { label: "Reviews", href: "/admin/reviews", icon: Shield },
      { label: "Reports", href: "/admin/reports", icon: Flag },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

interface AdminNavigationProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function AdminNavigation({ collapsed, onToggleCollapse }: AdminNavigationProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 select-none">
      <div
        className="flex items-center border-b border-slate-200/80 px-3 flex-shrink-0"
        style={{ height: "var(--header-height)" }}
      >
        <Link href="/admin" className="flex items-center gap-2 min-w-0 focus-ring rounded-md">
          <Logo size={28} showText={!collapsed} textClassName="text-sm text-slate-900 font-bold" />
        </Link>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto admin-scrollbar py-2 px-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-1">
            {!collapsed && (
              <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </div>
            )}
            {collapsed && <div className="h-2" />}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={`${group.label}-${item.label}`}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg text-[13px] font-medium transition-all focus-ring ${
                    collapsed ? "justify-center p-2 mx-auto" : "px-2.5 py-2"
                  } ${
                    active
                      ? "bg-slate-900 text-white font-semibold shadow-xs"
                      : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-[var(--border-primary)] p-2">
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center w-full gap-2 rounded-md px-2 py-1.5 text-[13px] text-[var(--text-tertiary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-secondary)] transition-colors focus-ring"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronsLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export { NAV_GROUPS };
export type { NavItem, NavGroup };
