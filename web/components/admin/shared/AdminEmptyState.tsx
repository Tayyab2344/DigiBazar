"use client";

import React from "react";
import { SearchX } from "lucide-react";

interface AdminEmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClearFilters?: () => void;
}

export function AdminEmptyState({
  icon: Icon = SearchX,
  title,
  description,
  action,
  onClearFilters,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-10 h-10 rounded-lg bg-[var(--surface-secondary)] flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-[var(--text-tertiary)]" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      {description && (
        <p className="text-[13px] text-[var(--text-tertiary)] max-w-sm">{description}</p>
      )}
      <div className="flex items-center gap-3 mt-4">
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline underline-offset-2"
          >
            Clear filters
          </button>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="px-3 py-1.5 text-[13px] font-medium bg-[var(--accent)] text-[var(--accent-foreground)] rounded-md hover:bg-[var(--accent-hover)] transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
