"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCentsCompact, formatNumber } from "@/lib/utils/format";
import type { DashboardStats } from "@/types/admin";
import { SkeletonMetric } from "../shared/AdminSkeleton";

interface DashboardOverviewProps {
  stats: DashboardStats | null;
  isLoading: boolean;
}

interface MetricProps {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
}

function MetricBlock({ label, value, change, isPositive }: MetricProps) {
  return (
    <div className="p-4 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg">
      <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
        {label}
      </div>
      <div className="text-xl font-semibold text-[var(--text-primary)] tabular-nums">
        {value}
      </div>
      {change && (
        <div className={`flex items-center gap-1 mt-1 text-[12px] font-medium tabular-nums ${
          isPositive ? "text-[var(--status-success)]" : "text-[var(--status-danger)]"
        }`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change} vs previous period
        </div>
      )}
    </div>
  );
}

export function DashboardOverview({ stats, isLoading }: DashboardOverviewProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg">
            <SkeletonMetric />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricBlock
        label="GMV"
        value={formatCentsCompact(stats.total_gmv)}
      />
      <MetricBlock
        label="Revenue"
        value={formatCentsCompact(stats.total_revenue)}
      />
      <MetricBlock
        label="Orders"
        value={formatNumber(stats.total_orders)}
      />
      <MetricBlock
        label="Commission"
        value={formatCentsCompact(stats.platform_commission)}
      />
    </div>
  );
}
