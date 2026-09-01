"use client";

import React, { useState, useEffect } from "react";
import { useAdminApi, useAdminMutation } from "@/lib/hooks/useAdminApi";
import { adminSettingsApi } from "@/lib/api/admin";
import { useToast } from "@/components/admin/shared/AdminToast";

export default function CommerceSettingsPage() {
  const [commission, setCommission] = useState("10");
  const [taxRate, setTaxRate] = useState("0");
  const { toast } = useToast();

  const { data: settings, refetch } = useAdminApi(adminSettingsApi.get);

  const { execute: updateSettings, isLoading: isSaving } = useAdminMutation(
    adminSettingsApi.update
  );

  useEffect(() => {
    if (settings?.commerce) {
      const c = settings.commerce as Record<string, number>;
      if (c.platform_commission !== undefined) setCommission(c.platform_commission.toString());
      if (c.tax_rate !== undefined) setTaxRate(c.tax_rate.toString());
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        commerce: {
          platform_commission: parseFloat(commission),
          tax_rate: parseFloat(taxRate),
        },
      });
      toast("Commerce settings saved successfully", "success");
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save settings";
      toast(msg, "error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-base font-bold text-[var(--text-primary)]">Commerce & Tax Settings</h2>
        <p className="text-xs text-[var(--text-tertiary)]">Platform commission percentage and tax calculation rules</p>
      </div>

      <div className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-[var(--text-secondary)] mb-1">Platform Commission Rate (%)</label>
          <input
            type="number"
            step="0.1"
            required
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)] tabular-nums"
          />
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
            Percentage retained by platform on each vendor transaction.
          </p>
        </div>

        <div>
          <label className="block font-semibold text-[var(--text-secondary)] mb-1">Default Sales Tax Rate (%)</label>
          <input
            type="number"
            step="0.1"
            required
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)] tabular-nums"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--border-primary)] flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 text-xs bg-[var(--accent)] text-[var(--accent-foreground)] rounded-md font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save Commerce Settings"}
        </button>
      </div>
    </form>
  );
}
