"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md hover:bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition-colors focus-ring relative"
        aria-label="Notifications"
      >
        <Bell className="w-4.5 h-4.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg z-50 animate-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notifications</h3>
          </div>
          <div className="py-8 text-center">
            <p className="text-sm text-[var(--text-tertiary)]">No new notifications</p>
          </div>
          <div className="border-t border-[var(--border-primary)] px-4 py-2">
            <Link
              href="/admin/notifications"
              onClick={() => setOpen(false)}
              className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
