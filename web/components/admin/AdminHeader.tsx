"use client";

import React from "react";
import { Menu, Search, Command } from "lucide-react";
import { Breadcrumbs } from "./Breadcrumbs";
import { UserMenu } from "./UserMenu";
import { NotificationCenter } from "./NotificationCenter";

interface AdminHeaderProps {
  onMenuClick: () => void;
  onCommandMenuClick: () => void;
}

export function AdminHeader({ onMenuClick, onCommandMenuClick }: AdminHeaderProps) {
  return (
    <header
      className="flex items-center justify-between border-b border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 lg:px-6 flex-shrink-0"
      style={{ height: "var(--header-height)" }}
    >
      {/* Left: mobile menu + breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 -ml-1 rounded-md hover:bg-[var(--surface-secondary)] text-[var(--text-secondary)] focus-ring"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Breadcrumbs />
      </div>

      {/* Center: search trigger */}
      <button
        onClick={onCommandMenuClick}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-[13px] text-[var(--text-tertiary)] bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md hover:border-[var(--border-secondary)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer min-w-[240px] focus-ring"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">Search digiBazar…</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-quaternary)] bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded">
          <Command className="w-2.5 h-2.5" />K
        </kbd>
      </button>

      {/* Right: notifications + user */}
      <div className="flex items-center gap-1">
        <button
          onClick={onCommandMenuClick}
          className="md:hidden p-1.5 rounded-md hover:bg-[var(--surface-secondary)] text-[var(--text-secondary)] focus-ring"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>
        <NotificationCenter />
        <UserMenu />
      </div>
    </header>
  );
}
