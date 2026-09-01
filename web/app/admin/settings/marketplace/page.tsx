"use client";

import React, { useState, useEffect } from "react";
import { useAdminApi, useAdminMutation } from "@/lib/hooks/useAdminApi";
import { adminSettingsApi } from "@/lib/api/admin";
import { useToast } from "@/components/admin/shared/AdminToast";

export default function MarketplaceSettingsPage() {
  const [companyApproval, setCompanyApproval] = useState(true);
  const [productApproval, setProductApproval] = useState(true);
  const { toast } = useToast();

  const { data: settings, refetch } = useAdminApi(adminSettingsApi.get);

  const { execute: updateSettings, isLoading: isSaving } = useAdminMutation(
    adminSettingsApi.update
  );

  useEffect(() => {
    if (settings?.marketplace) {
      const m = settings.marketplace as Record<string, boolean>;
      if (m.company_approval_required !== undefined) setCompanyApproval(m.company_approval_required);
      if (m.product_approval_required !== undefined) setProductApproval(m.product_approval_required);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        marketplace: {
          company_approval_required: companyApproval,
          product_approval_required: productApproval,
        },
      });
      toast("Marketplace rules saved successfully", "success");
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save settings";
      toast(msg, "error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-base font-bold text-[var(--text-primary)]">Marketplace Governance Rules</h2>
        <p className="text-xs text-[var(--text-tertiary)]">Vendor onboarding and product listing moderation policies</p>
      </div>

      <div className="space-y-4 text-xs">
        <label className="flex items-start gap-3 p-3 bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md cursor-pointer">
          <input
            type="checkbox"
            checked={companyApproval}
            onChange={(e) => setCompanyApproval(e.target.checked)}
            className="mt-0.5"
          />
          <div>
            <div className="font-semibold text-[var(--text-primary)]">Require Admin Approval for New Companies</div>
            <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
              When enabled, vendor storefronts remain in PENDING status until explicitly approved by a Super Admin.
            </div>
          </div>
        </label>

        <label className="flex items-start gap-3 p-3 bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md cursor-pointer">
          <input
            type="checkbox"
            checked={productApproval}
            onChange={(e) => setProductApproval(e.target.checked)}
            className="mt-0.5"
          />
          <div>
            <div className="font-semibold text-[var(--text-primary)]">Require Moderation for New Product Listings</div>
            <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
              When enabled, newly created products require moderation approval before appearing in search catalog.
            </div>
          </div>
        </label>
      </div>

      <div className="pt-4 border-t border-[var(--border-primary)] flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 text-xs bg-[var(--accent)] text-[var(--accent-foreground)] rounded-md font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save Governance Rules"}
        </button>
      </div>
    </form>
  );
}
