"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, Building2, Package, RotateCcw, Flag, Wallet } from "lucide-react";
import type { DashboardStats } from "@/types/admin";

interface DashboardHealthProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

interface HealthItem {
  label: string;
  count: number;
  icon: React.ElementType;
  href: string;
  variant: "warning" | "danger" | "info";
}

export function DashboardHealth({ stats, isLoading }: DashboardHealthProps) {
  if (isLoading || !stats) {
    return (
      <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg p-4">
        <div className="skeleton h-4 w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const items: HealthItem[] = [
    { label: "Companies awaiting approval", count: stats.pending_companies, icon: Building2, href: "/admin/companies?status=pending", variant: "warning" },
    { label: "Products pending moderation", count: 0, icon: Package, href: "/admin/products?status=pending", variant: "warning" },
    { label: "Refunds pending", count: stats.pending_refunds, icon: RotateCcw, href: "/admin/refunds", variant: "danger" },
    { label: "Reports open", count: 0, icon: Flag, href: "/admin/reports", variant: "danger" },
    { label: "Payouts pending", count: stats.pending_payouts, icon: Wallet, href: "/admin/payouts", variant: "info" },
  ];

  const activeItems = items.filter((item) => item.count > 0);

  return (
    <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg">
      <div className="px-4 py-3 border-b border-[var(--border-primary)]">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[var(--text-tertiary)]" />
          Marketplace Health
        </h3>
      </div>
      <div className="p-2">
        {activeItems.length === 0 ? (
          <div className="py-6 text-center text-[13px] text-[var(--text-tertiary)]">
            All systems operational
          </div>
        ) : (
          activeItems.map((item) => {
            const Icon = item.icon;
            const colors = {
              warning: "text-[var(--status-warning)] bg-[var(--status-warning-bg)]",
              danger: "text-[var(--status-danger)] bg-[var(--status-danger-bg)]",
              info: "text-[var(--status-info)] bg-[var(--status-info-bg)]",
            };
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[var(--surface-secondary)] transition-colors group"
              >
                <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${colors[item.variant]}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="flex-1 text-[13px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                  {item.label}
                </span>
                <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                  {item.count}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
