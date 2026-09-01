"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useAdminApi, useAdminMutation } from "@/lib/hooks/useAdminApi";
import { adminProductsApi } from "@/lib/api/admin";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import { AdminSkeleton } from "@/components/admin/shared/AdminSkeleton";
import { AdminErrorState } from "@/components/admin/shared/AdminErrorState";
import { ConfirmDialog } from "@/components/admin/shared/AdminModal";
import { useToast } from "@/components/admin/shared/AdminToast";
import { formatCents, formatNumber } from "@/lib/utils/format";
import { ProductStatus } from "@/types/admin";
import { CheckCircle, XCircle, Power, PowerOff, Star, Building2, Tag } from "lucide-react";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: product, isLoading, error, refetch } = useAdminApi(
    () => adminProductsApi.get(productId),
    [productId]
  );

  const { execute: updateStatus, isLoading: isUpdating } = useAdminMutation(
    async (action: string) => {
      if (action === "approve") return adminProductsApi.approve(productId);
      if (action === "reject") return adminProductsApi.reject(productId, "Admin rejection");
      if (action === "enable") return adminProductsApi.enable(productId);
      if (action === "disable") return adminProductsApi.disable(productId, "Admin disabled");
      throw new Error("Invalid action");
    }
  );

  const handleAction = async () => {
    if (!confirmAction) return;
    try {
      await updateStatus(confirmAction);
      toast(`Product status updated to ${confirmAction}`, "success");
      setConfirmAction(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Action failed";
      toast(msg, "error");
    }
  };

  if (isLoading) return <AdminSkeleton />;
  if (error || !product) return <AdminErrorState message={error?.message || "Product not found"} />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-primary)] flex items-center justify-center font-bold text-xl text-[var(--text-secondary)] flex-shrink-0">
              {product.images && product.images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                product.name.slice(0, 2).toUpperCase()
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-[var(--text-primary)]">{product.name}</h1>
                <AdminStatusBadge status={product.status} />
              </div>
              <div className="text-xs text-[var(--text-tertiary)] flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" />
                <Link href={`/admin/companies/${product.company_id}`} className="hover:underline font-medium text-[var(--text-secondary)]">
                  {product.company_name || "Company"}
                </Link>
                <span>•</span>
                <Tag className="w-3.5 h-3.5" />
                <span>{product.category_name || "Uncategorized"}</span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] font-mono">
                ID: {product.id} • Slug: /{product.slug}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {product.status === ProductStatus.PENDING && (
              <>
                <button
                  onClick={() => setConfirmAction("approve")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--status-success)] text-white rounded-md hover:opacity-90 transition-opacity"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approve Listing
                </button>
                <button
                  onClick={() => setConfirmAction("reject")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--status-danger-bg)] text-[var(--status-danger)] border border-[var(--status-danger-border)] rounded-md hover:bg-red-100 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </button>
              </>
            )}

            {product.status === ProductStatus.ACTIVE && (
              <button
                onClick={() => setConfirmAction("disable")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--status-danger-bg)] text-[var(--status-danger)] border border-[var(--status-danger-border)] rounded-md hover:bg-red-100 transition-colors"
              >
                <PowerOff className="w-3.5 h-3.5" />
                Disable Listing
              </button>
            )}

            {product.status === ProductStatus.DISABLED && (
              <button
                onClick={() => setConfirmAction("enable")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--accent)] text-[var(--accent-foreground)] rounded-md hover:bg-[var(--accent-hover)] transition-colors"
              >
                <Power className="w-3.5 h-3.5" />
                Enable Listing
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[var(--border-primary)]">
          <div>
            <div className="text-[11px] text-[var(--text-tertiary)] uppercase font-semibold">Price</div>
            <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{formatCents(product.price)}</div>
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-tertiary)] uppercase font-semibold">Stock</div>
            <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{formatNumber(product.stock)}</div>
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-tertiary)] uppercase font-semibold">Sales Count</div>
            <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{formatNumber(product.sales_count)}</div>
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-tertiary)] uppercase font-semibold">Rating</div>
            <div className="flex items-center gap-1 text-lg font-bold text-[var(--text-primary)] tabular-nums">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg p-5 space-y-3">
        <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2">
          Description
        </h3>
        <p className="text-xs text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">
          {product.description || "No product description provided."}
        </p>
      </div>

      {confirmAction && (
        <ConfirmDialog
          open={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleAction}
          title={`${confirmAction.toUpperCase()} Product`}
          description={`Are you sure you want to ${confirmAction} this product?`}
          isDestructive={["reject", "disable"].includes(confirmAction)}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
}
