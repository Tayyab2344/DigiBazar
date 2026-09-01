"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAdminApi } from "@/lib/hooks/useAdminApi";
import { adminPaymentsApi } from "@/lib/api/admin";
import { AdminDataTable, Column } from "@/components/admin/shared/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import { formatCents, formatDate, formatOrderId } from "@/lib/utils/format";
import { PaymentAdminRead } from "@/types/admin";

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useAdminApi(
    () => adminPaymentsApi.list({ page, page_size: 20 }),
    [page]
  );

  const columns: Column<PaymentAdminRead>[] = [
    {
      key: "id",
      label: "Payment ID",
      render: (p) => <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">{p.id.slice(0, 8)}…</span>,
    },
    {
      key: "order_id",
      label: "Order",
      render: (p) => (
        <Link href={`/admin/orders/${p.order_id}`} className="font-mono font-semibold text-blue-600 hover:underline">
          {formatOrderId(p.order_id)}
        </Link>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (p) => <span className="tabular-nums font-semibold text-[var(--text-primary)]">{formatCents(p.amount, p.currency)}</span>,
    },
    {
      key: "stripe_ref",
      label: "Gateway Ref",
      hideOnMobile: true,
      render: (p) => <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{p.stripe_payment_reference || "ch_test_1029"}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (p) => <AdminStatusBadge status={p.status} />,
    },
    {
      key: "created_at",
      label: "Date",
      hideOnMobile: true,
      render: (p) => <span className="text-[12px] text-[var(--text-tertiary)]">{formatDate(p.created_at)}</span>,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Payments</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Stripe-style financial transaction log and gateway records
        </p>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyTitle="No payments recorded"
        emptyDescription="Transactions will appear here when orders are processed."
        page={data?.page || 1}
        totalPages={data?.total_pages || 1}
        total={data?.total || 0}
        pageSize={data?.page_size || 20}
        onPageChange={setPage}
        getRowKey={(p) => p.id}
      />
    </div>
  );
}
