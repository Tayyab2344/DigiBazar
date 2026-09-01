"use client";

import React, { useState } from "react";
import { useAdminApi } from "@/lib/hooks/useAdminApi";
import { adminAuditLogsApi } from "@/lib/api/admin";
import { AdminDataTable, Column } from "@/components/admin/shared/AdminDataTable";
import { AdminModal } from "@/components/admin/shared/AdminModal";
import { formatDateTime } from "@/lib/utils/format";
import { AuditLogRead } from "@/types/admin";

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLogRead | null>(null);

  const { data, isLoading, error } = useAdminApi(
    () => adminAuditLogsApi.list({ page, page_size: 20 }),
    [page]
  );

  const columns: Column<AuditLogRead>[] = [
    {
      key: "created_at",
      label: "Time",
      render: (a) => <span className="font-mono text-xs text-[var(--text-tertiary)]">{formatDateTime(a.created_at)}</span>,
    },
    {
      key: "admin",
      label: "Admin User",
      render: (a) => (
        <span className="font-mono text-xs text-[var(--text-primary)]">
          {a.admin_user_id ? `Admin-${a.admin_user_id.slice(0, 8)}` : "System Service"}
        </span>
      ),
    },
    {
      key: "action",
      label: "Action",
      render: (a) => (
        <span className="font-mono font-semibold text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
          {a.action}
        </span>
      ),
    },
    {
      key: "resource",
      label: "Resource",
      hideOnMobile: true,
      render: (a) => (
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {a.resource_type}/{a.resource_id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: "reason",
      label: "Reason",
      hideOnMobile: true,
      render: (a) => <span className="text-xs text-[var(--text-tertiary)] truncate max-w-xs">{a.reason || "—"}</span>,
    },
    {
      key: "actions",
      label: "",
      render: (a) => (
        <button
          onClick={() => setSelectedLog(a)}
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          View Diff →
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Security Audit Logs</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Immutable system log of all administrative actions, status mutations, and security events
        </p>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyTitle="No audit logs recorded"
        emptyDescription="System audit entries will appear here."
        page={data?.page || 1}
        totalPages={data?.total_pages || 1}
        total={data?.total || 0}
        pageSize={data?.page_size || 20}
        onPageChange={setPage}
        getRowKey={(a) => a.id}
      />

      {/* Diff Inspection Modal */}
      {selectedLog && (
        <AdminModal
          open={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={`Audit Event: ${selectedLog.action}`}
          size="lg"
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-2 gap-3 bg-[var(--surface-secondary)] p-3 rounded-md border border-[var(--border-primary)]">
              <div><strong>Admin ID:</strong> {selectedLog.admin_user_id || "System"}</div>
              <div><strong>Timestamp:</strong> {formatDateTime(selectedLog.created_at)}</div>
              <div><strong>Resource Type:</strong> {selectedLog.resource_type}</div>
              <div><strong>Resource ID:</strong> {selectedLog.resource_id}</div>
              {selectedLog.ip_address && <div><strong>IP Address:</strong> {selectedLog.ip_address}</div>}
              {selectedLog.reason && <div className="col-span-2"><strong>Reason:</strong> &quot;{selectedLog.reason}&quot;</div>}
            </div>

            {/* Diff Visualization */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-red-50/50 border border-red-200 rounded-md p-3 space-y-1">
                <div className="font-bold text-red-700 font-sans text-xs flex items-center gap-1">
                  - Previous State
                </div>
                <pre className="text-[11px] text-red-900 overflow-x-auto p-2 bg-red-100/50 rounded">
                  {JSON.stringify(selectedLog.previous_value || null, null, 2)}
                </pre>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-200 rounded-md p-3 space-y-1">
                <div className="font-bold text-emerald-700 font-sans text-xs flex items-center gap-1">
                  + New State
                </div>
                <pre className="text-[11px] text-emerald-900 overflow-x-auto p-2 bg-emerald-100/50 rounded">
                  {JSON.stringify(selectedLog.new_value || null, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
