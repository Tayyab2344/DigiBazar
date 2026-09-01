"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAdminApi, useAdminMutation } from "@/lib/hooks/useAdminApi";
import { adminCouponsApi } from "@/lib/api/admin";
import { AdminDataTable, Column } from "@/components/admin/shared/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import { AdminModal } from "@/components/admin/shared/AdminModal";
import { useToast } from "@/components/admin/shared/AdminToast";
import { formatCents, formatDate, formatNumber } from "@/lib/utils/format";
import { CouponAdminRead, DiscountType } from "@/types/admin";
import { Plus, Ticket } from "lucide-react";

export default function AdminCouponsPage() {
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>(DiscountType.PERCENTAGE);
  const [discountValue, setDiscountValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useAdminApi(
    () => adminCouponsApi.list({ page, page_size: 20 }),
    [page]
  );

  const { execute: createCoupon, isLoading: isCreating } = useAdminMutation(
    adminCouponsApi.create
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue) return;

    // Convert value appropriately: if percentage, raw number; if fixed, integer cents
    const val = discountType === DiscountType.FIXED
      ? Math.round(parseFloat(discountValue) * 100)
      : parseInt(discountValue, 10);

    const minCents = minOrder ? Math.round(parseFloat(minOrder) * 100) : 0;

    try {
      await createCoupon({
        code: code.toUpperCase(),
        discount_type: discountType,
        discount_value: val,
        minimum_order: minCents,
        is_platform: true,
      });
      toast(`Coupon ${code.toUpperCase()} created successfully`, "success");
      setIsCreateOpen(false);
      setCode("");
      setDiscountValue("");
      setMinOrder("");
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create coupon";
      toast(msg, "error");
    }
  };

  const columns: Column<CouponAdminRead>[] = [
    {
      key: "code",
      label: "Coupon Code",
      render: (c) => (
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-purple-600" />
          <Link href={`/admin/coupons/${c.id}`} className="font-mono font-bold text-sm text-[var(--text-primary)] hover:underline">
            {c.code}
          </Link>
        </div>
      ),
    },
    {
      key: "type",
      label: "Discount",
      render: (c) => (
        <span className="font-semibold text-xs text-[var(--text-primary)]">
          {c.discount_type === DiscountType.PERCENTAGE
            ? `${c.discount_value}% OFF`
            : `${formatCents(c.discount_value)} OFF`}
        </span>
      ),
    },
    {
      key: "scope",
      label: "Scope",
      hideOnMobile: true,
      render: (c) => (
        <span className="text-xs text-[var(--text-secondary)] font-medium">
          {c.is_platform ? "Platform-Wide" : "Company Specific"}
        </span>
      ),
    },
    {
      key: "usage",
      label: "Usage",
      render: (c) => (
        <span className="tabular-nums text-xs font-medium">
          {formatNumber(c.usage_count)} / {c.usage_limit === 0 ? "∞" : formatNumber(c.usage_limit)}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (c) => <AdminStatusBadge status={c.is_active ? "active" : "disabled"} />,
    },
    {
      key: "created_at",
      label: "Created",
      hideOnMobile: true,
      render: (c) => <span className="text-[12px] text-[var(--text-tertiary)]">{formatDate(c.created_at)}</span>,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Coupons</h1>
          <p className="text-[13px] text-[var(--text-tertiary)]">
            Platform discounts, promotional codes, and usage tracking
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--accent)] text-[var(--accent-foreground)] rounded-md hover:bg-[var(--accent-hover)] transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyTitle="No coupons found"
        emptyDescription="Create platform-wide or vendor promotional coupons."
        page={data?.page || 1}
        totalPages={data?.total_pages || 1}
        total={data?.total || 0}
        pageSize={data?.page_size || 20}
        onPageChange={setPage}
        getRowKey={(c) => c.id}
      />

      <AdminModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Platform Coupon"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Coupon Code</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. SUMMER2026"
              className="w-full px-3 py-2 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)] font-mono uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                className="w-full px-3 py-2 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none text-[var(--text-primary)]"
              >
                <option value={DiscountType.PERCENTAGE}>Percentage (%)</option>
                <option value={DiscountType.FIXED}>Fixed Amount (PKR)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Discount Value</label>
              <input
                type="number"
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === DiscountType.PERCENTAGE ? "e.g. 15" : "e.g. 500"}
                className="w-full px-3 py-2 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)] tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Minimum Order Value (Optional, PKR)</label>
            <input
              type="number"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              placeholder="e.g. 2000"
              className="w-full px-3 py-2 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)] tabular-nums"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-3 py-1.5 text-xs border border-[var(--border-primary)] rounded-md text-[var(--text-secondary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-3 py-1.5 text-xs bg-[var(--accent)] text-[var(--accent-foreground)] rounded-md hover:bg-[var(--accent-hover)] font-semibold disabled:opacity-50"
            >
              {isCreating ? "Creating…" : "Create Coupon"}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
