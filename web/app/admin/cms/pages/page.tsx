"use client";

import React, { useState } from "react";
import { useAdminApi, useAdminMutation } from "@/lib/hooks/useAdminApi";
import { adminCMSApi } from "@/lib/api/admin";
import { AdminDataTable, Column } from "@/components/admin/shared/AdminDataTable";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import { AdminModal } from "@/components/admin/shared/AdminModal";
import { useToast } from "@/components/admin/shared/AdminToast";
import { formatDate } from "@/lib/utils/format";
import { CMSPageRead } from "@/types/admin";
import { Plus, FileText } from "lucide-react";

export default function AdminCMSPagesPage() {
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useAdminApi(
    () => adminCMSApi.listPages({ page, page_size: 20 }),
    [page]
  );

  const { execute: createPage, isLoading: isCreating } = useAdminMutation(
    adminCMSApi.createPage
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !content) return;
    try {
      await createPage({ title, slug, content });
      toast(`Page "${title}" created successfully`, "success");
      setIsCreateOpen(false);
      setTitle("");
      setSlug("");
      setContent("");
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create page";
      toast(msg, "error");
    }
  };

  const columns: Column<CMSPageRead>[] = [
    {
      key: "title",
      label: "Page Title",
      render: (p) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[var(--text-tertiary)]" />
          <span className="font-semibold text-xs text-[var(--text-primary)]">{p.title}</span>
        </div>
      ),
    },
    {
      key: "slug",
      label: "Slug",
      render: (p) => <span className="font-mono text-xs text-[var(--text-tertiary)]">/{p.slug}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (p) => <AdminStatusBadge status={p.status} />,
    },
    {
      key: "updated_at",
      label: "Last Updated",
      hideOnMobile: true,
      render: (p) => <span className="text-[12px] text-[var(--text-tertiary)]">{formatDate(p.updated_at)}</span>,
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Static Pages</h1>
          <p className="text-[13px] text-[var(--text-tertiary)]">
            Manage Terms, Privacy Policy, FAQs, and custom content pages
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--accent)] text-[var(--accent-foreground)] rounded-md hover:bg-[var(--accent-hover)] transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Page
        </button>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.items || []}
        isLoading={isLoading}
        error={error}
        emptyTitle="No pages found"
        emptyDescription="Create your first content page."
        page={data?.page || 1}
        totalPages={data?.total_pages || 1}
        total={data?.total || 0}
        pageSize={data?.page_size || 20}
        onPageChange={setPage}
        getRowKey={(p) => p.id}
      />

      <AdminModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create CMS Page"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
              }}
              placeholder="e.g. Terms of Service"
              className="w-full px-3 py-2 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Slug</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="terms-of-service"
              className="w-full px-3 py-2 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)] font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Content (Markdown / HTML)</label>
            <textarea
              required
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter page body..."
              className="w-full px-3 py-2 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)] font-mono"
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
              {isCreating ? "Creating…" : "Save Draft"}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
