"use client";

import React, { useState, useEffect } from "react";
import { useAdminApi, useAdminMutation } from "@/lib/hooks/useAdminApi";
import { adminSettingsApi } from "@/lib/api/admin";
import { useToast } from "@/components/admin/shared/AdminToast";

export default function GeneralSettingsPage() {
  const [platformName, setPlatformName] = useState("digiBazar");
  const [currency, setCurrency] = useState("PKR");
  const { toast } = useToast();

  const { data: settings, isLoading, refetch } = useAdminApi(
    adminSettingsApi.get
  );

  const { execute: updateSettings, isLoading: isSaving } = useAdminMutation(
    adminSettingsApi.update
  );

  useEffect(() => {
    if (settings?.general) {
      const g = settings.general as Record<string, string>;
      if (g.platform_name) setPlatformName(g.platform_name);
      if (g.currency) setCurrency(g.currency);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        general: { platform_name: platformName, currency },
      });
      toast("General settings saved successfully", "success");
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save settings";
      toast(msg, "error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-base font-bold text-[var(--text-primary)]">General Settings</h2>
        <p className="text-xs text-[var(--text-tertiary)]">Basic marketplace details and display currency</p>
      </div>

      <div className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-[var(--text-secondary)] mb-1">Platform Name</label>
          <input
            type="text"
            required
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)]"
          />
        </div>

        <div>
          <label className="block font-semibold text-[var(--text-secondary)] mb-1">Operating Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none text-[var(--text-primary)]"
          >
            <option value="PKR">PKR - Pakistani Rupee</option>
            <option value="USD">USD - US Dollar ($)</option>
          </select>
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--border-primary)] flex justify-end">
        <button
          type="submit"
          disabled={isSaving || isLoading}
          className="px-4 py-2 text-xs bg-[var(--accent)] text-[var(--accent-foreground)] rounded-md font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save General Settings"}
        </button>
      </div>
    </form>
  );
}
