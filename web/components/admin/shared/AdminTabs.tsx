"use client";

import React from "react";

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface AdminTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function AdminTabs({ tabs, activeTab, onTabChange }: AdminTabsProps) {
  return (
    <div className="flex items-center gap-0 border-b border-[var(--border-primary)] overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`relative px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors focus-ring ${
            activeTab === tab.key
              ? "text-[var(--text-primary)]"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-[11px] tabular-nums text-[var(--text-quaternary)]">
              {tab.count}
            </span>
          )}
          {activeTab === tab.key && (
            <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[var(--text-primary)] rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  );
}
