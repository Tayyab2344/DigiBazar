"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAdminApi, useAdminMutation } from "@/lib/hooks/useAdminApi";
import { adminCompaniesApi } from "@/lib/api/admin";
import { AdminDataTable, Column } from "@/components/admin/shared/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import { AdminDropdownMenu, DropdownAction } from "@/components/admin/shared/AdminDropdownMenu";
import { ConfirmDialog } from "@/components/admin/shared/AdminModal";
import { useToast } from "@/components/admin/shared/AdminToast";
import { formatCents, formatDate, formatNumber } from "@/lib/utils/format";
import { CompanyAdminRead, CompanyStatus } from "@/types/admin";
import { Search, CheckCircle, XCircle, PauseCircle, ShieldAlert, PlayCircle } from "lucide-react";

export default function AdminCompaniesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<{ company: CompanyAdminRead; action: string } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useAdminApi(
    () =>
      adminCompaniesApi.list({
        page,
        page_size: 20,
        search: search || undefined,
        status: (statusFilter as CompanyStatus) || undefined,
      }),
    [page, search, statusFilter]
  );

  const { execute: updateStatus, isLoading: isUpdating } = useAdminMutation(
    async ({ id, action, reason }: { id: string; action: string; reason?: string }) => {
      if (action === "approve") return adminCompaniesApi.approve(id);
      if (action === "reject") return adminCompaniesApi.reject(id, reason);
      if (action === "suspend") return adminCompaniesApi.suspend(id, reason);
      if (action === "activate") return adminCompaniesApi.activate(id);
      if (action === "block") return adminCompaniesApi.block(id, reason);
      throw new Error("Invalid action");
    }
  );

  const handleConfirmAction = async () => {
    if (!selectedCompany) return;
    try {
      await updateStatus({
        id: selectedCompany.company.id,
        action: selectedCompany.action,
        reason: actionReason || undefined,
      });
      toast(`Company ${selectedCompany.company.name} updated successfully`, "success");
      setSelectedCompany(null);
      setActionReason("");
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update company status";
      toast(msg, "error");
    }
  };

  const getRowActions = (company: CompanyAdminRead): DropdownAction[] => {
    const actions: DropdownAction[] = [
      {
        label: "View details",
        onClick: () => (window.location.href = `/admin/companies/${company.id}`),
      },
    ];

    if (company.status === CompanyStatus.PENDING) {
      actions.push(
        {
          label: "Approve",
          icon: CheckCircle,
          onClick: () => setSelectedCompany({ company, action: "approve" }),
        },
        {
          label: "Reject",
          icon: XCircle,
          variant: "danger",
          onClick: () => setSelectedCompany({ company, action: "reject" }),
        }
      );
    }

    if (company.status === CompanyStatus.ACTIVE) {
      actions.push(
        {
          label: "Suspend",
          icon: PauseCircle,
          onClick: () => setSelectedCompany({ company, action: "suspend" }),
        },
        {
          label: "Block",
          icon: ShieldAlert,
          variant: "danger",
          onClick: () => setSelectedCompany({ company, action: "block" }),
        }
      );
    }

    if (company.status === CompanyStatus.SUSPENDED || company.status === CompanyStatus.BLOCKED) {
      actions.push({
        label: "Activate",
        icon: PlayCircle,
        onClick: () => setSelectedCompany({ company, action: "activate" }),
      });
    }

    return actions;
  };

  const columns: Column<CompanyAdminRead>[] = [
    {
      key: "name",
      label: "Company",
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[var(--surface-secondary)] border border-[var(--border-primary)] flex items-center justify-center font-bold text-xs text-[var(--text-secondary)] flex-shrink-0">
            {c.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.logo_url} alt={c.name} className="w-full h-full object-cover rounded-md" />
            ) : (
              c.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <Link
              href={`/admin/companies/${c.id}`}
              className="font-semibold text-[var(--text-primary)] hover:underline block"
            >
              {c.name}
            </Link>
            <span className="text-[12px] text-[var(--text-tertiary)]">{c.business_email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "owner",
      label: "Owner",
      hideOnMobile: true,
      render: (c) => (
        <div>
          <div className="font-medium text-[var(--text-primary)]">
            {c.owner ? `${c.owner.first_name} ${c.owner.last_name}` : "N/A"}
          </div>
          <div className="text-[12px] text-[var(--text-tertiary)]">{c.owner?.phone || "No phone"}</div>
        </div>
      ),
    },
    {
      key: "products",
      label: "Products",
      hideOnMobile: true,
      render: (c) => <span className="tabular-nums font-medium">{formatNumber(c.product_count)}</span>,
    },
    {
      key: "orders",
      label: "Orders",
      hideOnMobile: true,
      render: (c) => <span className="tabular-nums font-medium">{formatNumber(c.order_count)}</span>,
    },
    {
      key: "revenue",
      label: "Revenue",
      render: (c) => <span className="tabular-nums font-semibold">{formatCents(c.revenue)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (c) => <AdminStatusBadge status={c.status} />,
    },
    {
      key: "created_at",
      label: "Created",
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Companies
          </h1>
          <p className="text-[13px] text-[var(--text-tertiary)]">
            Manage vendor storefronts, approvals, and platform status
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search companies…"
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
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <AdminDataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyTitle="No companies found"
        emptyDescription="Try adjusting your search query or status filter."
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
        getRowKey={(c) => c.id}
      />

      {/* Confirmation Dialog */}
      {selectedCompany && (
        <ConfirmDialog
          open={!!selectedCompany}
          onClose={() => {
            setSelectedCompany(null);
            setActionReason("");
          }}
          onConfirm={handleConfirmAction}
          title={`${selectedCompany.action.toUpperCase()} ${selectedCompany.company.name}`}
          description={`Are you sure you want to ${selectedCompany.action} this company?`}
          isDestructive={["reject", "suspend", "block"].includes(selectedCompany.action)}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
}
