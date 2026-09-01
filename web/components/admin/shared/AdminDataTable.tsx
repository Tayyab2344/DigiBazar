"use client";

import React from "react";
import { SkeletonTableRow } from "./AdminSkeleton";
import { AdminEmptyState } from "./AdminEmptyState";
import { AdminErrorState } from "./AdminErrorState";
import { AdminPagination } from "./AdminPagination";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  hideOnMobile?: boolean;
  className?: string;
  render: (item: T) => React.ReactNode;
}

interface AdminDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  error?: { message: string } | null;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
  onClearFilters?: () => void;
  // Pagination
  page?: number;
  totalPages?: number;
  total?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  // Sorting
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (key: string) => void;
  // Row interaction
  onRowClick?: (item: T) => void;
  getRowKey: (item: T) => string;
}

export function AdminDataTable<T>({
  columns,
  data,
  isLoading,
  error,
  emptyTitle = "No results found",
  emptyDescription = "Try changing your filters or search query.",
  onRetry,
  onClearFilters,
  page = 1,
  totalPages = 1,
  total = 0,
  pageSize = 20,
  onPageChange,
  sortKey,
  sortDirection,
  onSort,
  onRowClick,
  getRowKey,
}: AdminDataTableProps<T>) {
  if (error) {
    return <AdminErrorState message={error.message} onRetry={onRetry} />;
  }

  return (
    <div className="border border-[var(--border-primary)] rounded-lg bg-[var(--surface-primary)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-primary)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] bg-[var(--surface-secondary)] whitespace-nowrap ${
                    col.hideOnMobile ? "hidden md:table-cell" : ""
                  } ${col.className || ""}`}
                >
                  {col.sortable && onSort ? (
                    <button
                      onClick={() => onSort(col.key)}
                      className="flex items-center gap-1 hover:text-[var(--text-secondary)] transition-colors"
                    >
                      {col.label}
                      {sortKey === col.key && (
                        sortDirection === "asc"
                          ? <ChevronUp className="w-3 h-3" />
                          : <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <>
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonTableRow key={i} columns={columns.length} />
                ))}
              </>
            )}
            {!isLoading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length}>
                  <AdminEmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    onClearFilters={onClearFilters}
                  />
                </td>
              </tr>
            )}
            {!isLoading &&
              data.map((item) => (
                <tr
                  key={getRowKey(item)}
                  onClick={() => onRowClick?.(item)}
                  className={`border-b border-[var(--border-primary)] last:border-b-0 transition-colors ${
                    onRowClick
                      ? "cursor-pointer hover:bg-[var(--surface-secondary)]"
                      : ""
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-[13px] text-[var(--text-primary)] ${
                        col.hideOnMobile ? "hidden md:table-cell" : ""
                      } ${col.className || ""}`}
                    >
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!isLoading && total > 0 && onPageChange && (
        <AdminPagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
