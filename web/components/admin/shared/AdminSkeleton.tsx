"use client";

import React from "react";

export function SkeletonLine({ width = "100%" }: { width?: string }) {
  return <div className="skeleton h-4" style={{ width }} />;
}

export function SkeletonBlock({ height = "80px", width = "100%" }: { height?: string; width?: string }) {
  return <div className="skeleton rounded" style={{ height, width }} />;
}

export function SkeletonMetric() {
  return (
    <div className="space-y-2">
      <div className="skeleton h-3 w-20" />
      <div className="skeleton h-7 w-28" />
      <div className="skeleton h-3 w-16" />
    </div>
  );
}

export function SkeletonTableRow({ columns = 6 }: { columns?: number }) {
  return (
    <tr className="border-b border-[var(--border-primary)]">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden border border-[var(--border-primary)] rounded-lg">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border-primary)] bg-[var(--surface-secondary)]">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <div className="skeleton h-3" style={{ width: `${50 + Math.random() * 30}%` }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 p-6">
      {/* Metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 border border-[var(--border-primary)] rounded-lg bg-[var(--surface-primary)]">
            <SkeletonMetric />
          </div>
        ))}
      </div>
      {/* Chart */}
      <SkeletonBlock height="280px" />
      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonBlock height="240px" />
        <SkeletonBlock height="240px" />
      </div>
    </div>
  );
}

export function AdminSkeleton() {
  return <SkeletonDashboard />;
}
