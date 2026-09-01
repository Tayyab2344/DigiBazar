"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAdminApi, useAdminMutation } from "@/lib/hooks/useAdminApi";
import { adminProductsApi } from "@/lib/api/admin";
import { AdminDataTable, Column } from "@/components/admin/shared/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import { AdminDropdownMenu, DropdownAction } from "@/components/admin/shared/AdminDropdownMenu";
import { ConfirmDialog } from "@/components/admin/shared/AdminModal";
import { useToast } from "@/components/admin/shared/AdminToast";
import { formatCents, formatNumber } from "@/lib/utils/format";
import { ProductAdminRead, ProductStatus } from "@/types/admin";
import { Search, CheckCircle, XCircle, Power, PowerOff, Star } from "lucide-react";

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<{ product: ProductAdminRead; action: string } | null>(null);
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useAdminApi(
    () =>
      adminProductsApi.list({
        page,
        page_size: 20,
        search: search || undefined,
        status: (statusFilter as ProductStatus) || undefined,
      }),
    [page, search, statusFilter]
  );

  const { execute: updateStatus, isLoading: isUpdating } = useAdminMutation(
    async ({ id, action }: { id: string; action: string }) => {
      if (action === "approve") return adminProductsApi.approve(id);
      if (action === "reject") return adminProductsApi.reject(id, "Admin rejection");
      if (action === "enable") return adminProductsApi.enable(id);
      if (action === "disable") return adminProductsApi.disable(id, "Admin disabled");
      throw new Error("Invalid action");
    }
  );

  const handleConfirmAction = async () => {
    if (!selectedProduct) return;
    try {
      await updateStatus({ id: selectedProduct.product.id, action: selectedProduct.action });
      toast(`Product status updated successfully`, "success");
      setSelectedProduct(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update product status";
      toast(msg, "error");
    }
  };

  const getRowActions = (product: ProductAdminRead): DropdownAction[] => {
    const actions: DropdownAction[] = [
      {
        label: "View details",
        onClick: () => (window.location.href = `/admin/products/${product.id}`),
      },
    ];

    if (product.status === ProductStatus.PENDING) {
      actions.push(
        {
          label: "Approve",
          icon: CheckCircle,
          onClick: () => setSelectedProduct({ product, action: "approve" }),
        },
        {
          label: "Reject",
          icon: XCircle,
          variant: "danger",
          onClick: () => setSelectedProduct({ product, action: "reject" }),
        }
      );
    } else if (product.status === ProductStatus.ACTIVE) {
      actions.push({
        label: "Disable",
        icon: PowerOff,
        variant: "danger",
        onClick: () => setSelectedProduct({ product, action: "disable" }),
      });
    } else if (product.status === ProductStatus.DISABLED) {
      actions.push({
        label: "Enable",
        icon: Power,
        onClick: () => setSelectedProduct({ product, action: "enable" }),
      });
    }

    return actions;
  };

  const columns: Column<ProductAdminRead>[] = [
    {
      key: "name",
      label: "Product",
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[var(--surface-secondary)] border border-[var(--border-primary)] flex items-center justify-center font-bold text-xs text-[var(--text-secondary)] flex-shrink-0">
            {p.images && p.images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover rounded-md" />
            ) : (
              p.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <Link
              href={`/admin/products/${p.id}`}
              className="font-semibold text-[var(--text-primary)] hover:underline block"
            >
              {p.name}
            </Link>
            <span className="text-[12px] text-[var(--text-tertiary)]">{p.company_name || "Company"}</span>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      hideOnMobile: true,
      render: (p) => <span className="text-[12px] text-[var(--text-secondary)]">{p.category_name || "Uncategorized"}</span>,
    },
    {
      key: "price",
      label: "Price",
      render: (p) => <span className="tabular-nums font-semibold">{formatCents(p.price)}</span>,
    },
    {
      key: "stock",
      label: "Stock",
      render: (p) => (
        <span className={`tabular-nums font-medium ${p.stock === 0 ? "text-[var(--status-danger)]" : ""}`}>
          {formatNumber(p.stock)}
        </span>
      ),
    },
    {
      key: "sales",
      label: "Sales",
      hideOnMobile: true,
      render: (p) => <span className="tabular-nums font-medium">{formatNumber(p.sales_count)}</span>,
    },
    {
      key: "rating",
      label: "Rating",
      hideOnMobile: true,
      render: (p) => (
        <div className="flex items-center gap-1 text-[12px] tabular-nums font-medium">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>{p.rating.toFixed(1)}</span>
          <span className="text-[var(--text-quaternary)]">({p.review_count})</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (p) => <AdminStatusBadge status={p.status} />,
    },
    {
      key: "actions",
      label: "",
      render: (p) => <AdminDropdownMenu actions={getRowActions(p)} />,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Products</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Moderation queue, pricing, inventory, and catalog status
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none text-[var(--text-primary)]"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending Approval</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyTitle="No products found"
        emptyDescription="Try adjusting your search criteria or status filter."
        onClearFilters={() => {
          setSearch("");
          setStatusFilter("");
          setPage(1);
        }}
        page={data?.page || 1}
        totalPages={data?.total_pages || 1}
        total={data?.total || 0}
        pageSize={data?.page_size || 20}
        onPageChange={setPage}
        getRowKey={(p) => p.id}
      />

      {selectedProduct && (
        <ConfirmDialog
          open={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onConfirm={handleConfirmAction}
          title={`${selectedProduct.action.toUpperCase()} ${selectedProduct.product.name}`}
          description={`Are you sure you want to ${selectedProduct.action} this product listing?`}
          isDestructive={["reject", "disable"].includes(selectedProduct.action)}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
}
