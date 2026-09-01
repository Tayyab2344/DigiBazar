"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";

export interface DropdownAction {
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}

interface AdminDropdownMenuProps {
  actions: DropdownAction[];
  align?: "left" | "right";
}

export function AdminDropdownMenu({ actions, align = "right" }: AdminDropdownMenuProps) {
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
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-1 rounded-md hover:bg-[var(--surface-secondary)] text-[var(--text-tertiary)] transition-colors focus-ring"
        aria-label="Actions"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div
          className={`absolute top-full mt-1 w-48 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg py-1 z-50 animate-in ${
            align === "right" ? "right-0" : "left-0"
          }`}
          role="menu"
        >
          {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  action.onClick();
                }}
                disabled={action.disabled}
                className={`flex items-center gap-2 w-full px-3 py-2 text-[13px] text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  action.variant === "danger"
                    ? "text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
                }`}
                role="menuitem"
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
