"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useAdminApi, useAdminMutation } from "@/lib/hooks/useAdminApi";
import { adminCompaniesApi } from "@/lib/api/admin";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import { AdminTabs } from "@/components/admin/shared/AdminTabs";
import { AdminSkeleton } from "@/components/admin/shared/AdminSkeleton";
import { AdminErrorState } from "@/components/admin/shared/AdminErrorState";
import { ConfirmDialog } from "@/components/admin/shared/AdminModal";
import { useToast } from "@/components/admin/shared/AdminToast";
import { formatCents, formatDate, formatNumber } from "@/lib/utils/format";
import { CompanyStatus } from "@/types/admin";
import {
  Globe,
  Mail,
  Phone,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  PauseCircle,
  PlayCircle,
  ShieldAlert,
} from "lucide-react";

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const companyId = resolvedParams.id;

  const [activeTab, setActiveTab] = useState("overview");
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: company, isLoading, error, refetch } = useAdminApi(
    () => adminCompaniesApi.get(companyId),
    [companyId]
  );

  const { execute: updateStatus, isLoading: isUpdating } = useAdminMutation(
    async (action: string) => {
      if (action === "approve") return adminCompaniesApi.approve(companyId);
      if (action === "reject") return adminCompaniesApi.reject(companyId);
      if (action === "suspend") return adminCompaniesApi.suspend(companyId);
      if (action === "activate") return adminCompaniesApi.activate(companyId);
      if (action === "block") return adminCompaniesApi.block(companyId);
      throw new Error("Invalid action");
    }
  );

  const handleAction = async () => {
    if (!confirmAction) return;
    try {
      await updateStatus(confirmAction);
      toast(`Company status updated to ${confirmAction}`, "success");
      setConfirmAction(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Action failed";
      toast(msg, "error");
    }
  };

  if (isLoading) return <AdminSkeleton />;
  if (error || !company) return <AdminErrorState message={error?.message || "Company not found"} />;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "products", label: "Products", count: company.product_count },
    { key: "orders", label: "Orders", count: company.order_count },
    { key: "coupons", label: "Coupons" },
    { key: "reviews", label: "Reviews" },
    { key: "analytics", label: "Analytics" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Header Card */}
      <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border-primary)] flex items-center justify-center font-bold text-lg text-[var(--text-secondary)] flex-shrink-0">
              {company.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                company.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-[var(--text-primary)]">{company.name}</h1>
                <AdminStatusBadge status={company.status} />
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5 font-mono">
                ID: {company.id} • Slug: /{company.slug}
              </p>
            </div>
          </div>

          {/* Contextual Header Actions */}
          <div className="flex items-center gap-2">
            {company.status === CompanyStatus.PENDING && (
              <>
                <button
                  onClick={() => setConfirmAction("approve")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--status-success)] text-white rounded-md hover:opacity-90 transition-opacity"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approve Company
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

            {company.status === CompanyStatus.ACTIVE && (
              <>
                <button
                  onClick={() => setConfirmAction("suspend")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--border-primary)] rounded-md hover:bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition-colors"
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  Suspend
                </button>
                <button
                  onClick={() => setConfirmAction("block")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--status-danger-bg)] text-[var(--status-danger)] border border-[var(--status-danger-border)] rounded-md hover:bg-red-100 transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Block
                </button>
              </>
            )}

            {(company.status === CompanyStatus.SUSPENDED || company.status === CompanyStatus.BLOCKED) && (
              <button
                onClick={() => setConfirmAction("activate")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--accent)] text-[var(--accent-foreground)] rounded-md hover:bg-[var(--accent-hover)] transition-colors"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                Reactivate
              </button>
            )}
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[var(--border-primary)]">
          <div>
            <div className="text-[11px] text-[var(--text-tertiary)] uppercase font-semibold">Total Revenue</div>
            <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{formatCents(company.revenue)}</div>
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-tertiary)] uppercase font-semibold">Orders</div>
            <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{formatNumber(company.order_count)}</div>
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-tertiary)] uppercase font-semibold">Products</div>
            <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{formatNumber(company.product_count)}</div>
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-tertiary)] uppercase font-semibold">Business Type</div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">{company.business_type}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <AdminTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Business Info */}
          <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2">
              Business Profile
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <Mail className="w-4 h-4 text-[var(--text-tertiary)]" />
                <span className="font-medium text-[var(--text-primary)]">{company.business_email}</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <Phone className="w-4 h-4 text-[var(--text-tertiary)]" />
                <span>{company.phone}</span>
              </div>
              {company.website && (
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Globe className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <a href={company.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {company.website}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
                <span>Joined {formatDate(company.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Owner Info */}
          <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2">
              Owner Account
            </h3>
            {company.owner ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <User className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <span className="font-semibold text-[var(--text-primary)]">
                    {company.owner.first_name} {company.owner.last_name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Mail className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <span>{company.owner.email}</span>
                </div>
                {company.owner.phone && (
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <Phone className="w-4 h-4 text-[var(--text-tertiary)]" />
                    <span>{company.owner.phone}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-tertiary)]">No owner account linked.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div className="p-8 text-center bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg">
          <p className="text-xs text-[var(--text-tertiary)]">
            Viewing products for {company.name}. Filtered view directly linked.
          </p>
          <Link
            href={`/admin/products?company_id=${company.id}`}
            className="mt-3 inline-block text-xs font-semibold text-blue-600 hover:underline"
          >
            Open Products Catalog →
          </Link>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmDialog
          open={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleAction}
          title={`${confirmAction.toUpperCase()} ${company.name}`}
          description={`Are you sure you want to perform action: ${confirmAction}?`}
          isDestructive={["reject", "suspend", "block"].includes(confirmAction)}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
}
