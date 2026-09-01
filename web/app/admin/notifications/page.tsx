"use client";

import React, { useState } from "react";
import { useAdminApi, useAdminMutation } from "@/lib/hooks/useAdminApi";
import { adminNotificationsApi } from "@/lib/api/admin";
import { AdminDataTable, Column } from "@/components/admin/shared/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import { AdminModal } from "@/components/admin/shared/AdminModal";
import { useToast } from "@/components/admin/shared/AdminToast";
import { formatDate } from "@/lib/utils/format";
import { NotificationRead, NotificationTarget } from "@/types/admin";
import { Bell, Plus, Send } from "lucide-react";

export default function AdminNotificationsPage() {
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<NotificationTarget>(NotificationTarget.ALL_CUSTOMERS);
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useAdminApi(
    () => adminNotificationsApi.list({ page, page_size: 20 }),
    [page]
  );

  const { execute: createNotification, isLoading: isCreating } = useAdminMutation(
    adminNotificationsApi.create
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    try {
      await createNotification({
        title,
        message,
        target_type: targetType,
      });
      toast(`Notification blast "${title}" dispatched`, "success");
      setIsCreateOpen(false);
      setTitle("");
      setMessage("");
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send notification";
      toast(msg, "error");
    }
  };

  const columns: Column<NotificationRead>[] = [
    {
      key: "title",
      label: "Notification",
      render: (n) => (
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          <div>
            <div className="font-semibold text-xs text-[var(--text-primary)]">{n.title}</div>
            <div className="text-[11px] text-[var(--text-tertiary)] line-clamp-1">{n.message}</div>
          </div>
        </div>
      ),
    },
    {
      key: "target",
      label: "Audience Target",
      hideOnMobile: true,
      render: (n) => <span className="font-mono text-xs text-[var(--text-secondary)]">{n.target_type}</span>,
    },
    {
      key: "status",
      label: "Delivery Status",
      render: (n) => <AdminStatusBadge status={n.status} />,
    },
    {
      key: "sent_at",
      label: "Dispatched Date",
      hideOnMobile: true,
      render: (n) => <span className="text-[12px] text-[var(--text-tertiary)]">{n.sent_at ? formatDate(n.sent_at) : "Pending"}</span>,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Notifications Center</h1>
          <p className="text-[13px] text-[var(--text-tertiary)]">
            Dispatch operational broadcasts, announcements, and push notifications to marketplace segments
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--accent)] text-[var(--accent-foreground)] rounded-md hover:bg-[var(--accent-hover)] transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Notification
        </button>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyTitle="No notifications sent"
        emptyDescription="System notification broadcasts will appear here."
        page={data?.page || 1}
        totalPages={data?.total_pages || 1}
        total={data?.total || 0}
        pageSize={data?.page_size || 20}
        onPageChange={setPage}
        getRowKey={(n) => n.id}
      />

      <AdminModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Broadcast Notification"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scheduled System Maintenance"
              className="w-full px-3 py-2 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Audience Target</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as NotificationTarget)}
              className="w-full px-3 py-2 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none text-[var(--text-primary)]"
            >
              <option value={NotificationTarget.ALL_CUSTOMERS}>All Customers</option>
              <option value={NotificationTarget.ALL_COMPANIES}>All Companies (Vendors)</option>
              <option value={NotificationTarget.SPECIFIC_CUSTOMERS}>Specific Customers</option>
              <option value={NotificationTarget.SPECIFIC_COMPANIES}>Specific Companies</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Message Body</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter announcement text..."
              className="w-full px-3 py-2 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)]"
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[var(--accent)] text-[var(--accent-foreground)] rounded-md hover:bg-[var(--accent-hover)] font-semibold disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isCreating ? "Sending…" : "Dispatch Broadcast"}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
