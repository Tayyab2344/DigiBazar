"use client";

import React, { useState } from "react";
import { useAdminApi, useAdminMutation } from "@/lib/hooks/useAdminApi";
import { adminCategoriesApi } from "@/lib/api/admin";
import { AdminSkeleton } from "@/components/admin/shared/AdminSkeleton";
import { AdminErrorState } from "@/components/admin/shared/AdminErrorState";
import { AdminModal, ConfirmDialog } from "@/components/admin/shared/AdminModal";
import { useToast } from "@/components/admin/shared/AdminToast";
import { CategoryRead } from "@/types/admin";
import { Plus, Trash2, Folder, ChevronRight } from "lucide-react";

export default function AdminCategoriesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteCat, setDeleteCat] = useState<CategoryRead | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const { toast } = useToast();

  const { data: categories, isLoading, error, refetch } = useAdminApi(
    adminCategoriesApi.list
  );

  const { execute: createCategory, isLoading: isCreating } = useAdminMutation(
    adminCategoriesApi.create
  );

  const { execute: deleteCategory, isLoading: isDeleting } = useAdminMutation(
    adminCategoriesApi.delete
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;
    try {
      await createCategory({
        name,
        slug,
        description: description || undefined,
        parent_id: parentId || undefined,
      });
      toast(`Category "${name}" created successfully`, "success");
      setIsCreateOpen(false);
      setName("");
      setSlug("");
      setDescription("");
      setParentId("");
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create category";
      toast(msg, "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteCat) return;
    try {
      await deleteCategory(deleteCat.id);
      toast(`Category "${deleteCat.name}" deleted successfully`, "success");
      setDeleteCat(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete category";
      toast(msg, "error");
    }
  };

  // Build tree structure
  const rootCategories = (categories || []).filter((c) => !c.parent_id);
  const getChildren = (id: string) => (categories || []).filter((c) => c.parent_id === id);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Category Manager</h1>
          <p className="text-[13px] text-[var(--text-tertiary)]">
            Hierarchical taxonomy tree and catalog structure
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--accent)] text-[var(--accent-foreground)] rounded-md hover:bg-[var(--accent-hover)] transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Category
        </button>
      </div>

      {isLoading && <AdminSkeleton />}
      {error && <AdminErrorState message={error.message} onRetry={refetch} />}

      {!isLoading && !error && (
        <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg divide-y divide-[var(--border-primary)]">
          {rootCategories.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-tertiary)]">
              No categories defined. Click &quot;Create Category&quot; to start.
            </div>
          ) : (
            rootCategories.map((root) => {
              const children = getChildren(root.id);
              return (
                <div key={root.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-2.5">
                      <Folder className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-sm text-[var(--text-primary)]">{root.name}</span>
                      <span className="text-xs text-[var(--text-tertiary)] font-mono">/{root.slug}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-secondary)] text-[var(--text-tertiary)] font-medium">
                        {root.product_count} products
                      </span>
                    </div>

                    <button
                      onClick={() => setDeleteCat(root)}
                      className="p-1 text-[var(--text-tertiary)] hover:text-[var(--status-danger)] transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Children */}
                  {children.length > 0 && (
                    <div className="pl-6 border-l-2 border-[var(--border-primary)] ml-2 space-y-2 pt-2">
                      {children.map((child) => (
                        <div key={child.id} className="flex items-center justify-between group py-1">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-quaternary)]" />
                            <span className="font-medium text-xs text-[var(--text-primary)]">{child.name}</span>
                            <span className="text-[11px] text-[var(--text-tertiary)] font-mono">/{child.slug}</span>
                          </div>

                          <button
                            onClick={() => setDeleteCat(child)}
                            className="p-1 text-[var(--text-tertiary)] hover:text-[var(--status-danger)] transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Create Modal */}
      <AdminModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Category"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
              }}
              placeholder="e.g. Electronics"
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
              placeholder="e.g. electronics"
              className="w-full px-3 py-2 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)] font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Parent Category (Optional)</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none text-[var(--text-primary)]"
            >
              <option value="">None (Top-level Category)</option>
              {rootCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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
              {isCreating ? "Creating…" : "Create Category"}
            </button>
          </div>
        </form>
      </AdminModal>

      {deleteCat && (
        <ConfirmDialog
          open={!!deleteCat}
          onClose={() => setDeleteCat(null)}
          onConfirm={handleDelete}
          title={`Delete Category "${deleteCat.name}"`}
          description="Are you sure you want to delete this category? This action cannot be undone."
          isDestructive={true}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
