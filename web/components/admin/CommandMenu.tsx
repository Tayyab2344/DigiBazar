"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Building2,
  Users,
  Package,
  ShoppingCart,
  Ticket,
  BarChart3,
  Settings,
  FileText,
  Plus,
  ArrowRight,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  group: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string[];
}

interface CommandMenuProps {
  open: boolean;
  onClose: () => void;
}

export function CommandMenu({ open, onClose }: CommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const navigate = (path: string) => {
    router.push(path);
    onClose();
  };

  const items: CommandItem[] = useMemo(
    () => [
      // Navigation
      { id: "nav-dashboard", label: "Dashboard", group: "Navigation", icon: LayoutDashboard, action: () => navigate("/admin"), keywords: ["home", "overview"] },
      { id: "nav-companies", label: "Companies", group: "Navigation", icon: Building2, action: () => navigate("/admin/companies"), keywords: ["vendors", "stores"] },
      { id: "nav-customers", label: "Customers", group: "Navigation", icon: Users, action: () => navigate("/admin/customers"), keywords: ["users", "buyers"] },
      { id: "nav-products", label: "Products", group: "Navigation", icon: Package, action: () => navigate("/admin/products"), keywords: ["items", "catalog"] },
      { id: "nav-orders", label: "Orders", group: "Navigation", icon: ShoppingCart, action: () => navigate("/admin/orders") },
      { id: "nav-coupons", label: "Coupons", group: "Navigation", icon: Ticket, action: () => navigate("/admin/coupons"), keywords: ["discounts", "promos"] },
      { id: "nav-analytics", label: "Analytics", group: "Navigation", icon: BarChart3, action: () => navigate("/admin/analytics") },
      { id: "nav-cms", label: "CMS", group: "Navigation", icon: FileText, action: () => navigate("/admin/cms"), keywords: ["content", "pages"] },
      { id: "nav-settings", label: "Settings", group: "Navigation", icon: Settings, action: () => navigate("/admin/settings") },
      // Actions
      { id: "act-create-category", label: "Create Category", group: "Actions", icon: Plus, action: () => navigate("/admin/categories"), keywords: ["new", "add"] },
      { id: "act-create-coupon", label: "Create Coupon", group: "Actions", icon: Plus, action: () => navigate("/admin/coupons"), keywords: ["new", "discount"] },
      { id: "act-create-banner", label: "Create Banner", group: "Actions", icon: Plus, action: () => navigate("/admin/cms/banners"), keywords: ["new", "image"] },
      // Search
      { id: "search-companies", label: "Search Companies…", group: "Search", icon: Building2, action: () => navigate("/admin/companies") },
      { id: "search-customers", label: "Search Customers…", group: "Search", icon: Users, action: () => navigate("/admin/customers") },
      { id: "search-products", label: "Search Products…", group: "Search", icon: Package, action: () => navigate("/admin/products") },
      { id: "search-orders", label: "Search Orders…", group: "Search", icon: ShoppingCart, action: () => navigate("/admin/orders") },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.keywords?.some((kw) => kw.includes(q))
    );
  }, [query, items]);

  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const existing = map.get(item.group) || [];
      existing.push(item);
      map.set(item.group, existing);
    }
    return Array.from(map.entries());
  }, [filtered]);

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, selectedIndex, onClose]);

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // Reset selection on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[20vh]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 animate-overlay" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-[560px] mx-4 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg shadow-2xl animate-in overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 border-b border-[var(--border-primary)]">
          <Search className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search digiBazar…"
            className="flex-1 py-3 text-sm bg-transparent outline-none placeholder:text-[var(--text-quaternary)] text-[var(--text-primary)]"
          />
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-quaternary)] bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[320px] overflow-y-auto admin-scrollbar py-1">
          {groups.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--text-tertiary)]">
              No results found
            </div>
          ) : (
            groups.map(([group, groupItems]) => (
              <div key={group}>
                <div className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-quaternary)]">
                  {group}
                </div>
                {groupItems.map((item) => {
                  const idx = flatIndex++;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      data-index={idx}
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center gap-3 w-full px-4 py-2 text-sm text-left transition-colors ${
                        idx === selectedIndex
                          ? "bg-[var(--surface-secondary)] text-[var(--text-primary)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0 text-[var(--text-tertiary)]" />
                      <span className="flex-1 truncate">{item.label}</span>
                      <ArrowRight className="w-3 h-3 text-[var(--text-quaternary)] opacity-0 group-hover:opacity-100" />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border-primary)] text-[10px] text-[var(--text-quaternary)]">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
