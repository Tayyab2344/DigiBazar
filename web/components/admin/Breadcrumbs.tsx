"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  admin: "Admin",
  companies: "Companies",
  customers: "Customers",
  products: "Products",
  categories: "Categories",
  orders: "Orders",
  payments: "Payments",
  refunds: "Refunds",
  payouts: "Payouts",
  coupons: "Coupons",
  influencers: "Influencers",
  campaigns: "Campaigns",
  cms: "CMS",
  banners: "Banners",
  homepage: "Homepage",
  pages: "Pages",
  reviews: "Reviews",
  reports: "Reports",
  analytics: "Analytics",
  notifications: "Notifications",
  "audit-logs": "Audit Logs",
  settings: "Settings",
  general: "General",
  commerce: "Commerce",
  marketplace: "Marketplace",
  "admin-users": "Admin Users",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Remove "admin" from display since we're always in admin context
  if (segments[0] === "admin") {
    segments.shift();
  }

  if (segments.length === 0) {
    return (
      <div className="text-sm font-medium text-[var(--text-primary)]">
        Dashboard
      </div>
    );
  }

  return (
    <nav className="flex items-center gap-1 text-[13px] min-w-0" aria-label="Breadcrumb">
      <Link
        href="/admin"
        className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors truncate"
      >
        Dashboard
      </Link>
      {segments.map((segment, i) => {
        const href = "/admin/" + segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        // UUID detection: if segment looks like a UUID, show truncated version
        const isUuid = /^[0-9a-f]{8}-/.test(segment);
        const label = isUuid
          ? segment.slice(0, 8) + "…"
          : ROUTE_LABELS[segment] || segment;

        return (
          <React.Fragment key={href}>
            <ChevronRight className="w-3 h-3 text-[var(--text-quaternary)] flex-shrink-0" />
            {isLast ? (
              <span className="text-[var(--text-primary)] font-medium truncate">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors truncate"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
