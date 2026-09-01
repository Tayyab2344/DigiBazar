"use client";

import React, { useState } from "react";
import { useAdminApi, useAdminMutation } from "@/lib/hooks/useAdminApi";
import { adminCMSApi } from "@/lib/api/admin";
import { AdminSkeleton } from "@/components/admin/shared/AdminSkeleton";
import { AdminErrorState } from "@/components/admin/shared/AdminErrorState";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import { AdminModal, ConfirmDialog } from "@/components/admin/shared/AdminModal";
import { useToast } from "@/components/admin/shared/AdminToast";
import { BannerRead } from "@/types/admin";
import { Plus, Trash2 } from "lucide-react";

export default function AdminBannersPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteBanner, setDeleteBanner] = useState<BannerRead | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [position, setPosition] = useState("homepage_hero");
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useAdminApi(
    () => adminCMSApi.listBanners({ page_size: 50 })
  );

  const { execute: createBanner, isLoading: isCreating } = useAdminMutation(
    adminCMSApi.createBanner
  );

  const { execute: deleteBannerApi, isLoading: isDeleting } = useAdminMutation(
    adminCMSApi.deleteBanner
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl) return;
    try {
      await createBanner({
        title,
        subtitle: subtitle || undefined,
        image_url: imageUrl,
        cta_text: ctaText || undefined,
        cta_url: ctaUrl || undefined,
        position,
      });
      toast(`Banner "${title}" created successfully`, "success");
      setIsCreateOpen(false);
      setTitle("");
      setSubtitle("");
      setImageUrl("");
      setCtaText("");
      setCtaUrl("");
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create banner";
      toast(msg, "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteBanner) return;
    try {
      await deleteBannerApi(deleteBanner.id);
      toast(`Banner deleted`, "success");
      setDeleteBanner(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete banner";
      toast(msg, "error");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Banners</h1>
          <p className="text-[13px] text-[var(--text-tertiary)]">
            Visual card management for homepage sliders and promo banners
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--accent)] text-[var(--accent-foreground)] rounded-md hover:bg-[var(--accent-hover)] transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Banner
        </button>
      </div>

      {isLoading && <AdminSkeleton />}
      {error && <AdminErrorState message={error.message} onRetry={refetch} />}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(data?.items || []).length === 0 ? (
            <div className="col-span-full py-16 text-center text-xs text-[var(--text-tertiary)] bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg">
              No banners created yet. Click &quot;Create Banner&quot; to add one.
            </div>
          ) : (
            (data?.items || []).map((b) => (
              <div
                key={b.id}
                className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg overflow-hidden flex flex-col justify-between space-y-3 p-4 group hover:border-[var(--border-secondary)] transition-all"
              >
                <div className="space-y-3">
                  <div className="relative w-full h-36 rounded-md bg-[var(--surface-secondary)] border border-[var(--border-primary)] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2">
                      <AdminStatusBadge status={b.is_active ? "active" : "disabled"} />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-[var(--text-primary)]">{b.title}</h3>
                    {b.subtitle && <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{b.subtitle}</p>}
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border-primary)] flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{b.position}</span>
                  <button
                    onClick={() => setDeleteBanner(b)}
                    className="p-1 text-[var(--text-tertiary)] hover:text-[var(--status-danger)] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <AdminModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Promotional Banner"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Banner Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Mega Sale - 50% Off"
              className="w-full px-3 py-2 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Subtitle / Tagline</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Limited time offer across all electronics"
              className="w-full px-3 py-2 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Image URL</label>
            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3 py-2 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)] font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">CTA Button Text</label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Shop Now"
                className="w-full px-3 py-2 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Placement Position</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none text-[var(--text-primary)]"
              >
                <option value="homepage_hero">Homepage Hero Slider</option>
                <option value="category_banner">Category Banner</option>
                <option value="promo_popup">Promo Popup</option>
              </select>
            </div>
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
              {isCreating ? "Creating…" : "Create Banner"}
            </button>
          </div>
        </form>
      </AdminModal>

      {deleteBanner && (
        <ConfirmDialog
          open={!!deleteBanner}
          onClose={() => setDeleteBanner(null)}
          onConfirm={handleDelete}
          title={`Delete Banner "${deleteBanner.title}"`}
          description="Are you sure you want to delete this banner?"
          isDestructive={true}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
