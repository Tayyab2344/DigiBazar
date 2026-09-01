"use client";

import React, { useState } from "react";
import { useAdminApi, useAdminMutation } from "@/lib/hooks/useAdminApi";
import { adminReviewsApi } from "@/lib/api/admin";
import { AdminDataTable, Column } from "@/components/admin/shared/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import { AdminDropdownMenu, DropdownAction } from "@/components/admin/shared/AdminDropdownMenu";
import { useToast } from "@/components/admin/shared/AdminToast";
import { formatDate } from "@/lib/utils/format";
import { ReviewAdminRead } from "@/types/admin";
import { Star, EyeOff, Eye, Trash2, CheckCircle2 } from "lucide-react";

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useAdminApi(
    () => adminReviewsApi.list({ page, page_size: 20 }),
    [page]
  );

  const { execute: hideReview } = useAdminMutation(adminReviewsApi.hide);
  const { execute: restoreReview } = useAdminMutation(adminReviewsApi.restore);
  const { execute: deleteReview } = useAdminMutation(adminReviewsApi.delete);

  const handleAction = async (id: string, action: "hide" | "restore" | "delete") => {
    try {
      if (action === "hide") await hideReview(id);
      if (action === "restore") await restoreReview(id);
      if (action === "delete") await deleteReview(id);
      toast(`Review ${action}d successfully`, "success");
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Action failed";
      toast(msg, "error");
    }
  };

  const getRowActions = (r: ReviewAdminRead): DropdownAction[] => {
    const actions: DropdownAction[] = [];
    if (r.is_hidden) {
      actions.push({
        label: "Restore review",
        icon: Eye,
        onClick: () => handleAction(r.id, "restore"),
      });
    } else {
      actions.push({
        label: "Hide review",
        icon: EyeOff,
        onClick: () => handleAction(r.id, "hide"),
      });
    }
    actions.push({
      label: "Delete permanently",
      icon: Trash2,
      variant: "danger",
      onClick: () => handleAction(r.id, "delete"),
    });
    return actions;
  };

  const columns: Column<ReviewAdminRead>[] = [
    {
      key: "rating",
      label: "Rating",
      render: (r) => (
        <div className="flex items-center gap-1 font-bold text-xs">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>{r.rating}</span>
        </div>
      ),
    },
    {
      key: "product",
      label: "Product",
      render: (r) => (
        <div>
          <div className="font-semibold text-xs text-[var(--text-primary)]">{r.product_name || `Product: ${r.product_id.slice(0, 8)}`}</div>
          <div className="text-[11px] text-[var(--text-tertiary)]">{r.company_name || "Company"}</div>
        </div>
      ),
    },
    {
      key: "comment",
      label: "Review Comment",
      render: (r) => (
        <p className="text-xs text-[var(--text-secondary)] line-clamp-2 italic">
          &quot;{r.comment || "No comment text"}&quot;
        </p>
      ),
    },
    {
      key: "verified",
      label: "Verified",
      hideOnMobile: true,
      render: (r) => (
        r.is_verified_purchase ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--status-success)]">
            <CheckCircle2 className="w-3 h-3" /> Verified
          </span>
        ) : (
          <span className="text-[11px] text-[var(--text-quaternary)]">Unverified</span>
        )
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <AdminStatusBadge status={r.is_hidden ? "disabled" : "active"} />,
    },
    {
      key: "created_at",
      label: "Date",
      hideOnMobile: true,
      render: (r) => <span className="text-[12px] text-[var(--text-tertiary)]">{formatDate(r.created_at)}</span>,
    },
    {
      key: "actions",
      label: "",
      render: (r) => <AdminDropdownMenu actions={getRowActions(r)} />,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Reviews Moderation</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Audit customer product ratings, purchase verification, and moderation controls
        </p>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyTitle="No reviews found"
        emptyDescription="Customer product reviews will appear here."
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
