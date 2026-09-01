"use client";

import React from "react";
import { Activity, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/format";
import type { AuditLogRead } from "@/types/admin";

interface DashboardActivityProps {
  logs: AuditLogRead[];
  isLoading: boolean;
}

export function DashboardActivity({ logs, isLoading }: DashboardActivityProps) {
  return (
    <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg">
      <div className="px-4 py-3 border-b border-[var(--border-primary)] flex items-center gap-2">
        <Activity className="w-4 h-4 text-[var(--text-tertiary)]" />
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">
          Audit & System Activity
        </h3>
      </div>

      <div className="divide-y divide-[var(--border-primary)]">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 space-y-1.5">
              <div className="skeleton h-3.5 w-48" />
              <div className="skeleton h-3 w-32" />
            </div>
          ))
        ) : logs.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-[var(--text-tertiary)]">
            No recent activity recorded
          </div>
        ) : (
          logs.slice(0, 6).map((log) => {
            const isDanger = log.action.includes("REJECT") || log.action.includes("BLOCK") || log.action.includes("SUSPEND");
            const isSuccess = log.action.includes("APPROVE") || log.action.includes("ACTIVATE") || log.action.includes("CREATE");

            return (
              <div key={log.id} className="p-3 text-[13px] flex items-start gap-2.5">
                <div className="mt-0.5 flex-shrink-0">
                  {isDanger ? (
                    <ShieldAlert className="w-4 h-4 text-[var(--status-danger)]" />
                  ) : isSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-[var(--status-success)]" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[var(--text-tertiary)]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[var(--text-primary)] font-medium truncate">
                    {log.action.replace(/_/g, " ")}: <span className="font-mono text-[12px]">{log.resource_type}/{log.resource_id.slice(0, 8)}</span>
                  </div>
                  {log.reason && (
                    <div className="text-[12px] text-[var(--text-tertiary)] truncate mt-0.5">
                      &quot;{log.reason}&quot;
                    </div>
                  )}
                  <div className="text-[11px] text-[var(--text-quaternary)] mt-1">
                    {formatRelativeTime(log.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
