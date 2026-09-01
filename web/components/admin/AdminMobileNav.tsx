"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ShoppingBag } from "lucide-react";
import { NAV_GROUPS } from "./AdminNavigation";

interface AdminMobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function AdminMobileNav({ open, onClose }: AdminMobileNavProps) {
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 animate-overlay"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-[var(--surface-primary)] border-r border-[var(--border-primary)] animate-slide-in-right flex flex-col"
        style={{ animationName: "slideInLeft" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 border-b border-[var(--border-primary)]" style={{ height: "var(--header-height)" }}>
          <Link href="/admin" className="flex items-center gap-2" onClick={onClose}>
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[var(--accent)] text-[var(--accent-foreground)]">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Commerce<span className="text-[var(--text-tertiary)]">Hub</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[var(--surface-secondary)] text-[var(--text-secondary)] focus-ring"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-1">
              <div className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-quaternary)]">
                {group.label}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={`${group.label}-${item.label}`}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 rounded-md px-2 py-2 text-[13px] font-medium transition-colors ${
                      active
                        ? "bg-[var(--surface-tertiary)] text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
