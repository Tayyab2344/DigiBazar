"use client";

import React, { useState } from "react";
import { useAdminApi, useAdminMutation } from "@/lib/hooks/useAdminApi";
import { adminReportsApi } from "@/lib/api/admin";
import { AdminDataTable, Column } from "@/components/admin/shared/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import { AdminModal } from "@/components/admin/shared/AdminModal";
import { useToast } from "@/components/admin/shared/AdminToast";
import { formatDate } from "@/lib/utils/format";
import { ReportAdminRead, ReportStatus } from "@/types/admin";
import { Flag } from "lucide-react";

export default function AdminReportsPage() {
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<ReportAdminRead | null>(null);
  const [resolution, setResolution] = useState("");
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useAdminApi(
    () => adminReportsApi.list({ page, page_size: 20 }),
    [page]
  );

  const { execute: resolveReport, isLoading: isResolving } = useAdminMutation(
    ({ id, status, resolution }: { id: string; status: ReportStatus; resolution: string }) =>
      adminReportsApi.resolve(id, { status, resolution })
  );

  const handleResolve = async (status: ReportStatus) => {
    if (!selectedReport || !resolution) return;
    try {
      await resolveReport({ id: selectedReport.id, status, resolution });
      toast(`Report resolved with status ${status}`, "success");
      setSelectedReport(null);
      setResolution("");
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resolve report";
      toast(msg, "error");
    }
  };

  const columns: Column<ReportAdminRead>[] = [
    {
      key: "id",
      label: "Report ID",
      render: (r) => (
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-red-500" />
          <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">{r.id.slice(0, 8)}…</span>
        </div>
      ),
    },
    {
      key: "target",
      label: "Target Entity",
      render: (r) => (
        <div>
          <span className="font-semibold text-xs text-[var(--text-primary)] capitalize">{r.target_type}</span>
          <div className="text-[11px] text-[var(--text-tertiary)] font-mono">{r.target_id.slice(0, 8)}</div>
        </div>
      ),
    },
    {
      key: "reason",
      label: "Reason",
      render: (r) => <span className="text-xs text-[var(--text-secondary)]">{r.reason}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <AdminStatusBadge status={r.status} />,
    },
    {
      key: "created_at",
      label: "Reported Date",
      hideOnMobile: true,
      render: (r) => <span className="text-[12px] text-[var(--text-tertiary)]">{formatDate(r.created_at)}</span>,
    },
    {
      key: "actions",
      label: "",
      render: (r) => (
        <button
          onClick={() => setSelectedReport(r)}
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          Review →
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Trust & Safety Queue</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Investigate reported products, vendor accounts, and fraudulent reviews
        </p>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyTitle="No safety reports queue"
        emptyDescription="Reported entities requiring review will appear here."
        page={data?.page || 1}
        totalPages={data?.total_pages || 1}
        total={data?.total || 0}
        pageSize={data?.page_size || 20}
        onPageChange={setPage}
        getRowKey={(r) => r.id}
      />

      {selectedReport && (
        <AdminModal
          open={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={`Review Report: ${selectedReport.id.slice(0, 8)}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-[var(--surface-secondary)] p-3 rounded-md space-y-1">
              <div><strong className="text-[var(--text-primary)]">Target Type:</strong> {selectedReport.target_type}</div>
              <div><strong className="text-[var(--text-primary)]">Target ID:</strong> <span className="font-mono">{selectedReport.target_id}</span></div>
              <div><strong className="text-[var(--text-primary)]">Reason:</strong> {selectedReport.reason}</div>
              {selectedReport.description && (
                <div><strong className="text-[var(--text-primary)]">Details:</strong> {selectedReport.description}</div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">Resolution Summary</label>
              <textarea
                required
                rows={3}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Explain the moderation action taken..."
                className="w-full px-3 py-2 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleResolve(ReportStatus.REJECTED)}
                disabled={isResolving || !resolution}
                className="px-3 py-1.5 text-xs bg-[var(--status-danger-bg)] text-[var(--status-danger)] border border-[var(--status-danger-border)] rounded-md font-semibold disabled:opacity-50"
              >
                Dismiss Report
              </button>
              <button
                type="button"
                onClick={() => handleResolve(ReportStatus.RESOLVED)}
                disabled={isResolving || !resolution}
                className="px-3 py-1.5 text-xs bg-[var(--accent)] text-[var(--accent-foreground)] rounded-md font-semibold disabled:opacity-50"
              >
                Resolve & Take Action
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
