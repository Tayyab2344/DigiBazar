"use client";

import React, { useState } from "react";
import { GripVertical, Eye, EyeOff, Layout } from "lucide-react";

interface SectionItem {
  id: string;
  name: string;
  type: string;
  active: boolean;
}

export default function AdminHomepageBuilderPage() {
  const [sections, setSections] = useState<SectionItem[]>([
    { id: "s1", name: "Hero Carousel", type: "hero", active: true },
    { id: "s2", name: "Top Categories Grid", type: "categories", active: true },
    { id: "s3", name: "Featured Products Carousel", type: "products", active: true },
    { id: "s4", name: "Promotional Banner Strip", type: "banner", active: true },
    { id: "s5", name: "Featured Stores & Vendors", type: "companies", active: true },
    { id: "s6", name: "Influencer Picks & Trending", type: "influencers", active: false },
  ]);

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Homepage Section Builder</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Reorder, enable, or disable layout sections for the consumer marketplace homepage
        </p>
      </div>

      <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg p-6 max-w-2xl space-y-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2 flex items-center gap-2">
          <Layout className="w-4 h-4 text-[var(--text-tertiary)]" />
          Active Homepage Layout
        </h3>

        <div className="space-y-2">
          {sections.map((section, idx) => (
            <div
              key={section.id}
              className={`flex items-center justify-between p-3 rounded-md border transition-all ${
                section.active
                  ? "bg-[var(--surface-primary)] border-[var(--border-primary)]"
                  : "bg-[var(--surface-secondary)] border-transparent opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-[var(--text-quaternary)] cursor-grab" />
                <span className="text-xs font-mono font-bold text-[var(--text-tertiary)] w-6">#{idx + 1}</span>
                <span className="text-xs font-semibold text-[var(--text-primary)]">{section.name}</span>
              </div>

              <button
                onClick={() => toggleSection(section.id)}
                className={`p-1.5 rounded-md transition-colors ${
                  section.active
                    ? "text-[var(--status-success)] bg-[var(--status-success-bg)]"
                    : "text-[var(--text-quaternary)] hover:text-[var(--text-secondary)]"
                }`}
                title={section.active ? "Disable Section" : "Enable Section"}
              >
                {section.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
