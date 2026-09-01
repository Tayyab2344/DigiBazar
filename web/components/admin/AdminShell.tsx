"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminNavigation } from "./AdminNavigation";
import { AdminHeader } from "./AdminHeader";
import { AdminMobileNav } from "./AdminMobileNav";
import { CommandMenu } from "./CommandMenu";
import { useKeyboardShortcut } from "@/lib/hooks/useKeyboardShortcut";

const COLLAPSED_KEY = "commercehub_nav_collapsed";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);

  // Restore collapsed state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  // CMD/CTRL + K → command menu
  useKeyboardShortcut(
    { key: "k", metaKey: true },
    () => setCommandMenuOpen(true)
  );
  useKeyboardShortcut(
    { key: "k", ctrlKey: true },
    () => setCommandMenuOpen(true)
  );

  return (
    <div className="h-screen flex overflow-hidden bg-[var(--background)]">
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col border-r border-slate-200 bg-white shadow-2xs transition-[width] duration-200 ease-in-out flex-shrink-0 z-20"
        style={{ width: collapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)" }}
      >
        <AdminNavigation
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
      </aside>

      {/* Mobile Nav Drawer */}
      <AdminMobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          onMenuClick={() => setMobileNavOpen(true)}
          onCommandMenuClick={() => setCommandMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto admin-scrollbar">
          <div className="animate-in">
            {children}
          </div>
        </main>
      </div>

      {/* Command Menu */}
      <CommandMenu
        open={commandMenuOpen}
        onClose={() => setCommandMenuOpen(false)}
      />
    </div>
  );
}
