"use client";

import React, { useState, use } from "react";
import { useAdminApi, useAdminMutation } from "@/lib/hooks/useAdminApi";
import { adminCustomersApi } from "@/lib/api/admin";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import { AdminSkeleton } from "@/components/admin/shared/AdminSkeleton";
import { AdminErrorState } from "@/components/admin/shared/AdminErrorState";
import { ConfirmDialog } from "@/components/admin/shared/AdminModal";
import { useToast } from "@/components/admin/shared/AdminToast";
import { formatCents, formatDate, formatNumber, getInitials } from "@/lib/utils/format";
import { Mail, Phone, Calendar, UserCheck, PauseCircle, ShieldAlert } from "lucide-react";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;

  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: customer, isLoading, error, refetch } = useAdminApi(
    () => adminCustomersApi.get(customerId),
    [customerId]
  );

  const { execute: updateStatus, isLoading: isUpdating } = useAdminMutation(
    async (action: string) => {
      if (action === "activate") return adminCustomersApi.activate(customerId);
      if (action === "suspend") return adminCustomersApi.suspend(customerId);
      if (action === "block") return adminCustomersApi.block(customerId);
      throw new Error("Invalid action");
    }
  );

  const handleAction = async () => {
    if (!confirmAction) return;
    try {
      await updateStatus(confirmAction);
      toast(`Customer status updated to ${confirmAction}`, "success");
      setConfirmAction(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Action failed";
      toast(msg, "error");
    }
  };

  if (isLoading) return <AdminSkeleton />;
  if (error || !customer) return <AdminErrorState message={error?.message || "Customer not found"} />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[var(--surface-tertiary)] flex items-center justify-center font-bold text-lg text-[var(--text-secondary)] flex-shrink-0">
              {getInitials(`${customer.first_name} ${customer.last_name}`)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-[var(--text-primary)]">
                  {customer.first_name} {customer.last_name}
                </h1>
                <AdminStatusBadge status={customer.is_active ? "active" : "suspended"} />
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5 font-mono">
                ID: {customer.id} • Role: {customer.role}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {customer.is_active ? (
              <>
                <button
                  onClick={() => setConfirmAction("suspend")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[var(--border-primary)] rounded-md hover:bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition-colors"
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  Suspend Customer
                </button>
                <button
                  onClick={() => setConfirmAction("block")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--status-danger-bg)] text-[var(--status-danger)] border border-[var(--status-danger-border)] rounded-md hover:bg-red-100 transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Block Account
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmAction("activate")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--accent)] text-[var(--accent-foreground)] rounded-md hover:bg-[var(--accent-hover)] transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Activate Account
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--border-primary)]">
          <div>
            <div className="text-[11px] text-[var(--text-tertiary)] uppercase font-semibold">Total Spent</div>
            <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{formatCents(customer.total_spending)}</div>
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-tertiary)] uppercase font-semibold">Total Orders</div>
            <div className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{formatNumber(customer.total_orders)}</div>
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-tertiary)] uppercase font-semibold">Verification</div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">{customer.is_verified ? "Verified" : "Unverified"}</div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg p-5 space-y-3">
        <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2">
          Contact Details
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Mail className="w-4 h-4 text-[var(--text-tertiary)]" />
            <span className="font-medium text-[var(--text-primary)]">{customer.email}</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Phone className="w-4 h-4 text-[var(--text-tertiary)]" />
            <span>{customer.phone || "No phone registered"}</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
            <span>Customer since {formatDate(customer.created_at)}</span>
          </div>
        </div>
      </div>

      {confirmAction && (
        <ConfirmDialog
          open={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleAction}
          title={`${confirmAction.toUpperCase()} Customer`}
          description={`Are you sure you want to ${confirmAction} this customer account?`}
          isDestructive={["suspend", "block"].includes(confirmAction)}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
}
