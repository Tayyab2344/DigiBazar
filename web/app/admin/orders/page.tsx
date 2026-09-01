"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAdminApi } from "@/lib/hooks/useAdminApi";
import { adminOrdersApi } from "@/lib/api/admin";
import { AdminDataTable, Column } from "@/components/admin/shared/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import { formatCents, formatDate, formatOrderId } from "@/lib/utils/format";
import { OrderAdminRead, OrderStatus, PaymentStatus } from "@/types/admin";
import { Search } from "lucide-react";

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("");

  const { data, isLoading, error } = useAdminApi(
    () =>
      adminOrdersApi.list({
        page,
        page_size: 20,
        search: search || undefined,
        order_status: (orderStatusFilter as OrderStatus) || undefined,
        payment_status: (paymentStatusFilter as PaymentStatus) || undefined,
      }),
    [page, search, orderStatusFilter, paymentStatusFilter]
  );

  const columns: Column<OrderAdminRead>[] = [
    {
      key: "id",
      label: "Order",
      render: (o) => (
        <Link
          href={`/admin/orders/${o.id}`}
          className="font-mono font-semibold text-[var(--text-primary)] hover:underline"
        >
          {formatOrderId(o.id)}
        </Link>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      render: (o) => (
        <div>
          <div className="font-medium text-[var(--text-primary)]">{o.customer_name || "Customer"}</div>
          <div className="text-[12px] text-[var(--text-tertiary)]">{o.customer_email}</div>
        </div>
      ),
    },
    {
      key: "company",
      label: "Company",
      hideOnMobile: true,
      render: (o) => <span className="text-[12px] font-medium text-[var(--text-secondary)]">{o.company_name || "Vendor"}</span>,
    },
    {
      key: "total",
      label: "Total",
      render: (o) => <span className="tabular-nums font-semibold text-[var(--text-primary)]">{formatCents(o.total)}</span>,
    },
    {
      key: "payment_status",
      label: "Payment",
      render: (o) => <AdminStatusBadge status={o.payment_status} />,
    },
    {
      key: "order_status",
      label: "Status",
      render: (o) => <AdminStatusBadge status={o.order_status} />,
    },
    {
      key: "created_at",
      label: "Date",
      hideOnMobile: true,
      render: (o) => <span className="text-[12px] text-[var(--text-tertiary)]">{formatDate(o.created_at)}</span>,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Orders</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          High-density order management, multi-vendor splits, and refund operations
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search orders, customers…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={orderStatusFilter}
            onChange={(e) => {
              setOrderStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none text-[var(--text-primary)]"
          >
            <option value="">All Order Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(e) => {
              setPaymentStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none text-[var(--text-primary)]"
          >
            <option value="">All Payment Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyTitle="No orders found"
        emptyDescription="Try adjusting your search or filters."
        onClearFilters={() => {
          setSearch("");
          setOrderStatusFilter("");
          setPaymentStatusFilter("");
          setPage(1);
        }}
        page={data?.page || 1}
        totalPages={data?.total_pages || 1}
        total={data?.total || 0}
        pageSize={data?.page_size || 20}
        onPageChange={setPage}
        getRowKey={(o) => o.id}
      />
    </div>
  );
}
