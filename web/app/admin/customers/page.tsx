"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAdminApi, useAdminMutation } from "@/lib/hooks/useAdminApi";
import { adminCustomersApi } from "@/lib/api/admin";
import { AdminDataTable, Column } from "@/components/admin/shared/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import { AdminDropdownMenu, DropdownAction } from "@/components/admin/shared/AdminDropdownMenu";
import { ConfirmDialog } from "@/components/admin/shared/AdminModal";
import { useToast } from "@/components/admin/shared/AdminToast";
import { formatCents, formatDate, formatNumber, getInitials } from "@/lib/utils/format";
import { CustomerAdminRead } from "@/types/admin";
import { Search, UserCheck, PauseCircle, ShieldAlert } from "lucide-react";

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<{ customer: CustomerAdminRead; action: string } | null>(null);
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useAdminApi(
    () =>
      adminCustomersApi.list({
        page,
        page_size: 20,
        search: search || undefined,
        is_active: activeFilter === "" ? undefined : activeFilter === "true",
      }),
    [page, search, activeFilter]
  );

  const { execute: updateStatus, isLoading: isUpdating } = useAdminMutation(
    async ({ id, action }: { id: string; action: string }) => {
      if (action === "activate") return adminCustomersApi.activate(id);
      if (action === "suspend") return adminCustomersApi.suspend(id);
      if (action === "block") return adminCustomersApi.block(id);
      throw new Error("Invalid action");
    }
  );

  const handleConfirmAction = async () => {
    if (!selectedCustomer) return;
    try {
      await updateStatus({ id: selectedCustomer.customer.id, action: selectedCustomer.action });
      toast(`Customer status updated successfully`, "success");
      setSelectedCustomer(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      toast(msg, "error");
    }
  };

  const getRowActions = (customer: CustomerAdminRead): DropdownAction[] => {
    const actions: DropdownAction[] = [
      {
        label: "View customer",
        onClick: () => (window.location.href = `/admin/customers/${customer.id}`),
      },
    ];

    if (customer.is_active) {
      actions.push(
        {
          label: "Suspend",
          icon: PauseCircle,
          onClick: () => setSelectedCustomer({ customer, action: "suspend" }),
        },
        {
          label: "Block",
          icon: ShieldAlert,
          variant: "danger",
          onClick: () => setSelectedCustomer({ customer, action: "block" }),
        }
      );
    } else {
      actions.push({
        label: "Activate",
        icon: UserCheck,
        onClick: () => setSelectedCustomer({ customer, action: "activate" }),
      });
    }

    return actions;
  };

  const columns: Column<CustomerAdminRead>[] = [
    {
      key: "name",
      label: "Customer",
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--surface-tertiary)] flex items-center justify-center font-bold text-xs text-[var(--text-secondary)] flex-shrink-0">
            {getInitials(`${c.first_name} ${c.last_name}`)}
          </div>
          <div>
            <Link
              href={`/admin/customers/${c.id}`}
              className="font-semibold text-[var(--text-primary)] hover:underline block"
            >
              {c.first_name} {c.last_name}
            </Link>
            <span className="text-[12px] text-[var(--text-tertiary)]">{c.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      hideOnMobile: true,
      render: (c) => <span className="text-[12px] text-[var(--text-secondary)]">{c.phone || "—"}</span>,
    },
    {
      key: "orders",
      label: "Orders",
      render: (c) => <span className="tabular-nums font-medium">{formatNumber(c.total_orders)}</span>,
    },
    {
      key: "total_spending",
      label: "Total Spent",
      render: (c) => <span className="tabular-nums font-semibold">{formatCents(c.total_spending)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (c) => <AdminStatusBadge status={c.is_active ? "active" : "suspended"} />,
    },
    {
      key: "created_at",
      label: "Joined",
      hideOnMobile: true,
      render: (c) => <span className="text-[12px] text-[var(--text-tertiary)]">{formatDate(c.created_at)}</span>,
    },
    {
      key: "actions",
      label: "",
      render: (c) => <AdminDropdownMenu actions={getRowActions(c)} />,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Customers</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Manage buyer accounts, order statistics, and account status
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search customers…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)]"
          />
        </div>

        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none text-[var(--text-primary)]"
        >
          <option value="">All Statuses</option>
          <option value="true">Active</option>
          <option value="false">Suspended / Inactive</option>
        </select>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyTitle="No customers found"
        emptyDescription="Try adjusting your search criteria."
        onClearFilters={() => {
          setSearch("");
          setActiveFilter("");
          setPage(1);
        }}
        page={data?.page || 1}
        totalPages={data?.total_pages || 1}
        total={data?.total || 0}
        pageSize={data?.page_size || 20}
        onPageChange={setPage}
        getRowKey={(c) => c.id}
      />

      {selectedCustomer && (
        <ConfirmDialog
          open={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onConfirm={handleConfirmAction}
          title={`${selectedCustomer.action.toUpperCase()} Customer`}
          description={`Are you sure you want to ${selectedCustomer.action} ${selectedCustomer.customer.first_name}?`}
          isDestructive={["suspend", "block"].includes(selectedCustomer.action)}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
}
