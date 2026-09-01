"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAdminApi } from "@/lib/hooks/useAdminApi";
import { adminRefundsApi } from "@/lib/api/admin";
import { AdminDataTable, Column } from "@/components/admin/shared/AdminDataTable";
import { formatCents, formatDate, formatOrderId } from "@/lib/utils/format";
import { RefundAdminRead } from "@/types/admin";

export default function AdminRefundsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useAdminApi(
    () => adminRefundsApi.list({ page, page_size: 20 }),
    [page]
  );

  const columns: Column<RefundAdminRead>[] = [
    {
      key: "id",
      label: "Refund ID",
      render: (r) => <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">{r.id.slice(0, 8)}…</span>,
    },
    {
      key: "order_id",
      label: "Order",
      render: (r) => (
        <Link href={`/admin/orders/${r.order_id}`} className="font-mono font-semibold text-blue-600 hover:underline">
          {formatOrderId(r.order_id)}
        </Link>
      ),
    },
    {
      key: "amount",
      label: "Refunded Amount",
      render: (r) => <span className="tabular-nums font-semibold text-[var(--status-danger)]">{formatCents(r.amount)}</span>,
    },
    {
      key: "reason",
      label: "Reason",
      render: (r) => <span className="text-xs text-[var(--text-secondary)]">{r.reason}</span>,
    },
    {
      key: "created_at",
      label: "Date",
      hideOnMobile: true,
      render: (r) => <span className="text-[12px] text-[var(--text-tertiary)]">{formatDate(r.created_at)}</span>,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Refund Operations</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Audit of all customer refunds, order adjustments, and return reasons
        </p>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyTitle="No refunds recorded"
        emptyDescription="Processed refunds will be listed here."
        page={data?.page || 1}
        totalPages={data?.total_pages || 1}
        total={data?.total || 0}
        pageSize={data?.page_size || 20}
        onPageChange={setPage}
        getRowKey={(r) => r.id}
      />
    </div>
  );
}
