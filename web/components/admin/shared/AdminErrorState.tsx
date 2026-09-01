"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface AdminErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function AdminErrorState({
  title = "Something went wrong",
  message = "Unable to load data. Please try again.",
  onRetry,
}: AdminErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-10 h-10 rounded-lg bg-[var(--status-danger-bg)] flex items-center justify-center mb-3">
        <AlertTriangle className="w-5 h-5 text-[var(--status-danger)]" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-[13px] text-[var(--text-tertiary)] max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] border border-[var(--border-primary)] rounded-md hover:bg-[var(--surface-secondary)] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
