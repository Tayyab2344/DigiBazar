"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAdminApi } from "@/lib/hooks/useAdminApi";
import { adminPayoutsApi } from "@/lib/api/admin";
import { AdminDataTable, Column } from "@/components/admin/shared/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import { formatCents, formatDate } from "@/lib/utils/format";
import { PayoutAdminRead } from "@/types/admin";

export default function AdminPayoutsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useAdminApi(
    () => adminPayoutsApi.list({ page, page_size: 20 }),
    [page]
  );

  const columns: Column<PayoutAdminRead>[] = [
    {
      key: "company",
      label: "Company",
      render: (p) => (
        <Link
          href={`/admin/companies/${p.company_id}`}
          className="font-semibold text-[var(--text-primary)] hover:underline"
        >
          {p.company_name || `Company ID: ${p.company_id.slice(0, 8)}`}
        </Link>
      ),
    },
    {
      key: "gross",
      label: "Gross Sales",
      render: (p) => <span className="tabular-nums font-medium">{formatCents(p.gross_sales)}</span>,
    },
    {
      key: "commission",
      label: "Commission",
      hideOnMobile: true,
      render: (p) => <span className="tabular-nums font-medium text-[var(--status-success)]">-{formatCents(p.platform_commission)}</span>,
    },
    {
      key: "refunds",
      label: "Refunds",
      hideOnMobile: true,
      render: (p) => <span className="tabular-nums font-medium text-[var(--status-danger)]">-{formatCents(p.refunds)}</span>,
    },
    {
      key: "net",
      label: "Net Payable",
      render: (p) => <span className="tabular-nums font-bold text-[var(--text-primary)]">{formatCents(p.net_payable)}</span>,
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
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Vendor Payouts</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Financial operations interface: gross sales, commission deductions, net vendor payouts
        </p>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyTitle="No payouts scheduled"
        emptyDescription="Weekly automated payout runs will register here."
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
