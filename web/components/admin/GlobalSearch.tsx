"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, Users, Package, X } from "lucide-react";
import { adminCompaniesApi, adminCustomersApi, adminProductsApi } from "@/lib/api/admin";
import type { CompanyAdminRead, CustomerAdminRead, ProductAdminRead } from "@/types/admin";
import { formatCents } from "@/lib/utils/format";

interface SearchResults {
  companies: CompanyAdminRead[];
  customers: CustomerAdminRead[];
  products: ProductAdminRead[];
}

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ companies: [], customers: [], products: [] });
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults({ companies: [], customers: [], products: [] });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults({ companies: [], customers: [], products: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const [companies, customers, products] = await Promise.allSettled([
        adminCompaniesApi.list({ search: q, page_size: 3 }),
        adminCustomersApi.list({ search: q, page_size: 3 }),
        adminProductsApi.list({ search: q, page_size: 3 }),
      ]);

      setResults({
        companies: companies.status === "fulfilled" ? companies.value.items : [],
        customers: customers.status === "fulfilled" ? customers.value.items : [],
        products: products.status === "fulfilled" ? products.value.items : [],
      });
    } catch {
      // Silently handle search errors
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(value), 300);
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    onClose();
  };

  const hasResults =
    results.companies.length > 0 ||
    results.customers.length > 0 ||
    results.products.length > 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/40 animate-overlay" onClick={onClose} />
      <div className="relative w-full max-w-[560px] mx-4 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg shadow-2xl animate-in overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-[var(--border-primary)]">
          <Search className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search companies, customers, products…"
            className="flex-1 py-3 text-sm bg-transparent outline-none placeholder:text-[var(--text-quaternary)] text-[var(--text-primary)]"
          />
          <button onClick={onClose} className="p-1 hover:bg-[var(--surface-secondary)] rounded">
            <X className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto admin-scrollbar">
          {isSearching && (
            <div className="px-4 py-8 text-center text-sm text-[var(--text-tertiary)]">
              Searching…
            </div>
          )}

          {!isSearching && query.trim() && !hasResults && (
            <div className="px-4 py-8 text-center text-sm text-[var(--text-tertiary)]">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {!isSearching && hasResults && (
            <div className="py-1">
              {results.companies.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-quaternary)] flex items-center gap-1.5">
                    <Building2 className="w-3 h-3" />
                    Companies
                  </div>
                  {results.companies.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleNavigate(`/admin/companies/${c.id}`)}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-[var(--surface-secondary)] transition-colors"
                    >
                      <span className="font-medium text-[var(--text-primary)] truncate">{c.name}</span>
                      <span className="text-[12px] text-[var(--text-tertiary)] ml-auto flex-shrink-0">{c.status}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.customers.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-quaternary)] flex items-center gap-1.5">
                    <Users className="w-3 h-3" />
                    Customers
                  </div>
                  {results.customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleNavigate(`/admin/customers/${c.id}`)}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-[var(--surface-secondary)] transition-colors"
                    >
                      <span className="font-medium text-[var(--text-primary)] truncate">
                        {c.first_name} {c.last_name}
                      </span>
                      <span className="text-[12px] text-[var(--text-tertiary)] ml-auto flex-shrink-0">{c.email}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.products.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-quaternary)] flex items-center gap-1.5">
                    <Package className="w-3 h-3" />
                    Products
                  </div>
                  {results.products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleNavigate(`/admin/products/${p.id}`)}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-[var(--surface-secondary)] transition-colors"
                    >
                      <span className="font-medium text-[var(--text-primary)] truncate">{p.name}</span>
                      <span className="text-[12px] text-[var(--text-tertiary)] ml-auto flex-shrink-0 tabular-nums">
                        {formatCents(p.price)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!query.trim() && (
            <div className="px-4 py-8 text-center text-sm text-[var(--text-tertiary)]">
              Start typing to search across companies, customers, and products
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
