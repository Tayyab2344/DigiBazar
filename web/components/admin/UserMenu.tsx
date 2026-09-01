"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Settings, LogOut, User } from "lucide-react";
import { getInitials } from "@/lib/utils/format";

export function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
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

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push("/login");
  };

  const displayName = user
    ? `${user.first_name} ${user.last_name}`
    : "Admin";
  const initials = getInitials(displayName);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--surface-tertiary)] text-[11px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--border-secondary)] transition-colors focus-ring"
        aria-label="User menu"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg py-1 z-50 animate-in">
          {/* User info */}
          <div className="px-3 py-2 border-b border-[var(--border-primary)]">
            <div className="text-sm font-medium text-[var(--text-primary)] truncate">
              {displayName}
            </div>
            <div className="text-[12px] text-[var(--text-tertiary)] truncate">
              {user?.email}
            </div>
          </div>

          {/* Menu items */}
          <button
            onClick={() => {
              setOpen(false);
              router.push("/admin/settings");
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors text-left"
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </button>
          <button
            onClick={() => {
              setOpen(false);
              router.push("/account/change-password");
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors text-left"
          >
            <User className="w-3.5 h-3.5" />
            Change Password
          </button>
          <div className="border-t border-[var(--border-primary)] my-1" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)] transition-colors text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
