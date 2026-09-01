"use client";

import React, { useState } from "react";
import { useAdminApi } from "@/lib/hooks/useAdminApi";
import { adminCampaignsApi } from "@/lib/api/admin";
import { AdminDataTable, Column } from "@/components/admin/shared/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import { formatCents, formatNumber } from "@/lib/utils/format";
import { CampaignAdminRead } from "@/types/admin";
import { Megaphone } from "lucide-react";

export default function AdminCampaignsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useAdminApi(
    () => adminCampaignsApi.list({ page, page_size: 20 }),
    [page]
  );

  const columns: Column<CampaignAdminRead>[] = [
    {
      key: "name",
      label: "Campaign",
      render: (c) => (
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-purple-600" />
          <div>
            <div className="font-semibold text-xs text-[var(--text-primary)]">{c.name}</div>
            <div className="text-[11px] text-[var(--text-tertiary)]">@{c.influencer_handle || "Influencer"}</div>
          </div>
        </div>
      ),
    },
    {
      key: "company",
      label: "Company",
      hideOnMobile: true,
      render: (c) => <span className="text-xs text-[var(--text-secondary)] font-medium">{c.company_name || "Company"}</span>,
    },
    {
      key: "clicks",
      label: "Clicks",
      hideOnMobile: true,
      render: (c) => <span className="tabular-nums font-medium text-xs">{formatNumber(c.clicks_count)}</span>,
    },
    {
      key: "orders",
      label: "Orders",
      render: (c) => <span className="tabular-nums font-medium text-xs">{formatNumber(c.orders_count)}</span>,
    },
    {
      key: "conversion",
      label: "Conv. Rate",
      hideOnMobile: true,
      render: (c) => <span className="tabular-nums font-medium text-xs">{c.conversion_rate.toFixed(1)}%</span>,
    },
    {
      key: "revenue",
      label: "Revenue",
      render: (c) => <span className="tabular-nums font-semibold text-xs text-[var(--text-primary)]">{formatCents(c.total_revenue)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (c) => <AdminStatusBadge status={c.status} />,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Campaigns</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Marketing campaign performance, affiliate click attribution, and conversions
        </p>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyTitle="No campaigns found"
        emptyDescription="Influencer and promotional campaigns will be tracked here."
        page={data?.page || 1}
        totalPages={data?.total_pages || 1}
        total={data?.total || 0}
        pageSize={data?.page_size || 20}
        onPageChange={setPage}
        getRowKey={(c) => c.id}
      />
    </div>
  );
}
