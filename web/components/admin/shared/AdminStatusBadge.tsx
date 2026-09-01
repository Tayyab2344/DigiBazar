"use client";

import React from "react";
import { getStatusVariant } from "@/lib/utils/format";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const VARIANT_STYLES = {
  success: "bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success-border)]",
  warning: "bg-[var(--status-warning-bg)] text-[var(--status-warning)] border-[var(--status-warning-border)]",
  danger: "bg-[var(--status-danger-bg)] text-[var(--status-danger)] border-[var(--status-danger-border)]",
  info: "bg-[var(--status-info-bg)] text-[var(--status-info)] border-[var(--status-info-border)]",
  neutral: "bg-[var(--status-neutral-bg)] text-[var(--status-neutral)] border-[var(--status-neutral-border)]",
};

const DOT_STYLES = {
  success: "bg-[var(--status-success)]",
  warning: "bg-[var(--status-warning)]",
  danger: "bg-[var(--status-danger)]",
  info: "bg-[var(--status-info)]",
  neutral: "bg-[var(--status-neutral)]",
};

export function AdminStatusBadge({ status, className = "" }: StatusBadgeProps) {
  const variant = getStatusVariant(status);
  const displayText = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded border ${VARIANT_STYLES[variant]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${DOT_STYLES[variant]}`} />
      {displayText}
    </span>
  );
}
