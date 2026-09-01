"use client";

import React, { useState, useEffect, Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CompanyNavigation } from "./CompanyNavigation";
import { CompanyHeader } from "./CompanyHeader";
import { CompanyCommandMenu } from "./CompanyCommandMenu";
import { CompanyNotificationCenter } from "./CompanyNotificationCenter";

const COLLAPSED_KEY = "digibazar_company_nav_collapsed";

export function CompanyShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  };

  // CMD+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandMenuOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <ProtectedRoute allowedRoles={["COMPANY"]}>
      <div className="h-screen flex overflow-hidden bg-slate-50 font-sans antialiased text-slate-900">
        {/* Desktop Sidebar */}
        <aside
          className="hidden lg:flex flex-col flex-shrink-0 border-r border-slate-200 bg-white shadow-2xs transition-all duration-200 ease-in-out z-20"
          style={{ width: collapsed ? "4.5rem" : "16rem" }}
        >
          <Suspense fallback={<div className="p-4 text-xs text-slate-500">Loading nav...</div>}>
            <CompanyNavigation collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
          </Suspense>
        </aside>

        {/* Mobile Drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="relative w-64 max-w-xs bg-slate-900 h-full z-10">
              <Suspense fallback={<div className="p-4 text-xs text-slate-500">Loading nav...</div>}>
                <CompanyNavigation collapsed={false} onToggleCollapse={() => setMobileNavOpen(false)} />
              </Suspense>
            </div>
          </div>
        )}

        {/* Main Content Workspace */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <CompanyHeader
            onMenuClick={() => setMobileNavOpen(true)}
            onCommandMenuClick={() => setCommandMenuOpen(true)}
            onNotificationClick={() => setNotificationOpen(true)}
          />
          <main className="flex-1 overflow-y-auto admin-scrollbar p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
              {children}
            </div>
          </main>
        </div>

        {/* Global Search CMD+K Menu */}
        <CompanyCommandMenu open={commandMenuOpen} onClose={() => setCommandMenuOpen(false)} />

        {/* Notification Center */}
        <CompanyNotificationCenter
          open={notificationOpen}
          onClose={() => setNotificationOpen(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
