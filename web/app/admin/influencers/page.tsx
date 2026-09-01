"use client";

import React, { useState } from "react";
import { useAdminApi } from "@/lib/hooks/useAdminApi";
import { adminInfluencersApi } from "@/lib/api/admin";
import { AdminDataTable, Column } from "@/components/admin/shared/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import { formatCents, formatDate, formatNumber } from "@/lib/utils/format";
import { InfluencerAdminRead } from "@/types/admin";
import { UserCheck } from "lucide-react";

export default function AdminInfluencersPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useAdminApi(
    () => adminInfluencersApi.list({ page, page_size: 20 }),
    [page]
  );

  const columns: Column<InfluencerAdminRead>[] = [
    {
      key: "handle",
      label: "Influencer",
      render: (inf) => (
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-indigo-600" />
          <div>
            <div className="font-semibold text-xs text-[var(--text-primary)]">@{inf.handle}</div>
            <div className="text-[11px] text-[var(--text-tertiary)]">{inf.platform}</div>
          </div>
        </div>
      ),
    },
    {
      key: "followers",
      label: "Followers",
      hideOnMobile: true,
      render: (inf) => <span className="tabular-nums font-medium text-xs">{formatNumber(inf.followers_count)}</span>,
    },
    {
      key: "campaigns",
      label: "Campaigns",
      render: (inf) => <span className="tabular-nums font-medium text-xs">{formatNumber(inf.campaign_count)}</span>,
    },
    {
      key: "revenue",
      label: "Driven Revenue",
      render: (inf) => <span className="tabular-nums font-semibold text-xs text-[var(--text-primary)]">{formatCents(inf.total_revenue)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (inf) => <AdminStatusBadge status={inf.status} />,
    },
    {
      key: "joined",
      label: "Joined",
      hideOnMobile: true,
      render: (inf) => <span className="text-[12px] text-[var(--text-tertiary)]">{formatDate(inf.created_at)}</span>,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Influencers</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Manage creator marketplace partnerships, followers, and attribution performance
        </p>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyTitle="No influencers found"
        emptyDescription="Creator profiles registered with the platform will appear here."
        page={data?.page || 1}
        totalPages={data?.total_pages || 1}
        total={data?.total || 0}
        pageSize={data?.page_size || 20}
        onPageChange={setPage}
        getRowKey={(inf) => inf.id}
      />
    </div>
  );
}
