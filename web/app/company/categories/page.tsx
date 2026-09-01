"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FolderTree,
  Search,
  ArrowUpDown,
  Eye,
  Edit2,
  Trash2,
  Package,
  Globe,
  Store,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  Loader2,
  Plus,
} from "lucide-react";
import type { CategoryItem, EnhancedProduct } from "@/types/product";
import { productApi } from "@/lib/api/product";
import { CompanyShell } from "@/components/company/CompanyShell";
import { CategoryPickerModal } from "@/components/company/product/CategoryPickerModal";

type FilterType = "all" | "marketplace" | "store" | "active" | "inactive";
type SortField = "name" | "product_count" | "created_at";

export default function CompanyCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting state
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Category Details Drawer State
  const [detailCategory, setDetailCategory] = useState<CategoryItem | null>(null);

  // View Products Modal State
  const [viewProductsCategory, setViewProductsCategory] = useState<CategoryItem | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<EnhancedProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [productTotalPages, setProductTotalPages] = useState(1);

  // Edit Store Category Modal State
  const [editCategory, setEditCategory] = useState<CategoryItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editParentId, setEditParentId] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete Store Category Modal State
  const [deleteCategoryItem, setDeleteCategoryItem] = useState<CategoryItem | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Create Category Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch categories flat & tree
  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productApi.listCategories();
      setCategories(data || []);
    } catch (err: any) {
      console.error("Failed to load company categories:", err);
      setError(err?.message || "Failed to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Flatten categories for table & map parent names
  const flatCategories = useMemo(() => {
    const flatList: CategoryItem[] = [];
    const traverse = (items: CategoryItem[]) => {
      for (const item of items) {
        flatList.push(item);
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      }
    };
    traverse(categories);
    return flatList;
  }, [categories]);

  // Parent Category Name Lookup Map
  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryItem>();
    for (const c of flatCategories) {
      map.set(c.id, c);
    }
    return map;
  }, [flatCategories]);

  // Compute total product count summary
  const totalAssignedProducts = useMemo(() => {
    return flatCategories.reduce((sum, cat) => sum + (cat.product_count || 0), 0);
  }, [flatCategories]);

  // Filter & Sort Categories
  const filteredCategories = useMemo(() => {
    let result = [...flatCategories];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q)) ||
          c.slug.toLowerCase().includes(q)
      );
    }

    // Type / Status Filter
    if (filterType === "marketplace") {
      result = result.filter((c) => !c.company_id);
    } else if (filterType === "store") {
      result = result.filter((c) => !!c.company_id);
    } else if (filterType === "active") {
      result = result.filter((c) => c.is_active);
    } else if (filterType === "inactive") {
      result = result.filter((c) => !c.is_active);
    }

    // Sorting
    result.sort((a, b) => {
      let valA: any = a.name;
      let valB: any = b.name;

      if (sortField === "product_count") {
        valA = a.product_count || 0;
        valB = b.product_count || 0;
      } else if (sortField === "created_at") {
        valA = a.created_at || "";
        valB = b.created_at || "";
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [flatCategories, search, filterType, sortField, sortOrder]);

  // Fetch Category Assigned Products
  const loadCategoryProducts = useCallback(
    async (categoryId: string, pageNum = 1, searchQuery = "") => {
      setLoadingProducts(true);
      try {
        const res = await productApi.getCategoryProducts(categoryId, {
          search: searchQuery || undefined,
          page: pageNum,
          page_size: 8,
        });
        setCategoryProducts(res.items || []);
        setProductTotalPages(res.total_pages || 1);
      } catch (err) {
        console.error("Failed to load category products:", err);
      } finally {
        setLoadingProducts(false);
      }
    },
    []
  );

  const handleOpenProductsModal = (cat: CategoryItem) => {
    setViewProductsCategory(cat);
    setProductSearch("");
    setProductPage(1);
    loadCategoryProducts(cat.id, 1, "");
  };

  // Edit Store Category Handlers
  const handleOpenEditModal = (cat: CategoryItem) => {
    if (!cat.company_id) return; // Marketplace category protection
    setEditCategory(cat);
    setEditName(cat.name);
    setEditDescription(cat.description || "");
    setEditParentId(cat.parent_id || "");
    setEditIsActive(cat.is_active);
    setEditError("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategory) return;

    setSavingEdit(true);
    setEditError("");

    try {
      await productApi.updateCategory(editCategory.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        parent_id: editParentId || undefined,
        is_active: editIsActive,
      });

      setEditCategory(null);
      await loadCategories();
    } catch (err: any) {
      setEditError(err?.message || "Failed to update store category.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Store Category Handlers
  const handleConfirmDelete = async () => {
    if (!deleteCategoryItem) return;
    setDeletingCategory(true);
    setDeleteError("");

    try {
      await productApi.deleteCategory(deleteCategoryItem.id);
      setDeleteCategoryItem(null);
      await loadCategories();
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete store category.");
    } finally {
      setDeletingCategory(false);
    }
  };

  // Helper date formatter
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <CompanyShell>
      <div className="space-y-6">
        {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 bg-white p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Categories
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/80 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-amber-600" />
              {totalAssignedProducts} Products Assigned
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Organize and manage the categories used by your store.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            Create Store Category
          </button>
        </div>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search categories by name, slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
            {(
              [
                { id: "all", label: "All Categories" },
                { id: "marketplace", label: "Marketplace" },
                { id: "store", label: "Store Categories" },
                { id: "active", label: "Active" },
                { id: "inactive", label: "Inactive" },
              ] as { id: FilterType; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filterType === tab.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 bg-slate-100 hover:bg-slate-200/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="px-2.5 py-1.5 rounded-lg text-xs border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="name">Category Name</option>
              <option value="product_count">Products Count</option>
              <option value="created_at">Created Date</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              title={`Switch to ${sortOrder === "asc" ? "descending" : "ascending"}`}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Categories Display Area */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
          <span className="text-xs font-medium">Loading store categories...</span>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-rose-200 p-8 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
          <p className="text-sm font-bold text-slate-900">{error}</p>
          <button
            type="button"
            onClick={loadCategories}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
          <div className="p-3 rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <FolderTree className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No categories found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {search
              ? `No categories matching "${search}". Try adjusting your search query or filter.`
              : "No categories have been assigned or created for your store yet."}
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-slate-950" /> Create Category for Store
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Parent Category</th>
                  <th className="py-3.5 px-4">Assigned Products</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredCategories.map((cat) => {
                  const isMarketplace = !cat.company_id;
                  const parentCat = cat.parent_id ? categoryMap.get(cat.parent_id) : null;

                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Category Name & Image */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                            {cat.image_url ? (
                              <img
                                src={cat.image_url}
                                alt={cat.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FolderTree className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{cat.name}</span>
                            </div>
                            <div className="text-xs font-mono text-slate-400 truncate max-w-[200px]">
                              /{cat.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category Type Badge */}
                      <td className="py-4 px-4">
                        {isMarketplace ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/80">
                            <Globe className="w-3.5 h-3.5 text-amber-600" />
                            Marketplace
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Store className="w-3.5 h-3.5 text-emerald-600" />
                            Store Category
                          </span>
                        )}
                      </td>

                      {/* Parent Category */}
                      <td className="py-4 px-4 text-xs font-medium text-slate-600">
                        {parentCat ? (
                          <span className="inline-flex items-center gap-1 text-slate-800">
                            <FolderTree className="w-3.5 h-3.5 text-amber-500" />
                            {parentCat.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Main Category</span>
                        )}
                      </td>

                      {/* Products Count */}
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => handleOpenProductsModal(cat)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                        >
                          <Package className="w-3.5 h-3.5 text-slate-500" />
                          <span>{cat.product_count || 0} Products</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {cat.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                            <XCircle className="w-3.5 h-3.5" /> Inactive
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="py-4 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(cat.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Products */}
                          <button
                            type="button"
                            onClick={() => handleOpenProductsModal(cat)}
                            className="p-2 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                            title="View Products"
                          >
                            <Package className="w-4 h-4" />
                          </button>

                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => setDetailCategory(cat)}
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Store Category Actions (Edit & Delete) */}
                          {!isMarketplace && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(cat)}
                                className="p-2 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                                title="Edit Store Category"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteCategoryItem(cat)}
                                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete Store Category"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden space-y-3">
            {filteredCategories.map((cat) => {
              const isMarketplace = !cat.company_id;
              const parentCat = cat.parent_id ? categoryMap.get(cat.parent_id) : null;

              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <FolderTree className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{cat.name}</h4>
                        <span className="text-xs text-slate-400 font-mono">/{cat.slug}</span>
                      </div>
                    </div>

                    {cat.is_active ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Type</span>
                      {isMarketplace ? (
                        <span className="font-semibold text-amber-700 flex items-center gap-1 mt-0.5">
                          <Globe className="w-3 h-3" /> Marketplace
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                          <Store className="w-3 h-3" /> Store Category
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Products</span>
                      <button
                        type="button"
                        onClick={() => handleOpenProductsModal(cat)}
                        className="font-bold text-slate-900 underline mt-0.5"
                      >
                        {cat.product_count || 0} Products
                      </button>
                    </div>
                  </div>

                  {parentCat && (
                    <div className="text-xs text-slate-500">
                      Parent: <strong className="text-slate-800">{parentCat.name}</strong>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => setDetailCategory(cat)}
                      className="text-slate-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenProductsModal(cat)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 font-semibold text-slate-800 text-xs"
                      >
                        View Products
                      </button>

                      {!isMarketplace && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(cat)}
                            className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteCategoryItem(cat)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CATEGORY DETAILS DRAWER */}
      {/* ------------------------------------------------------------- */}
      {detailCategory && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex justify-end p-0">
          <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div>
              {/* Header */}
              <div className="px-6 py-4 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                    <FolderTree className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Category Details</h3>
                    <p className="text-xs text-slate-500">Metadata and store organization</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailCategory(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Managed By Indicator Banner */}
              <div className="p-6 space-y-6">
                {!detailCategory.company_id ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                    <Globe className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                        Managed by DigiBazar
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Platform category provided by DigiBazar Super Admin. Read-only for stores.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                    <Store className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                        Managed by your store
                      </h4>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Custom category created specifically for your store catalog.
                      </p>
                    </div>
                  </div>
                )}

                {/* Details List */}
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Category Name</label>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {detailCategory.name}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">URL Slug</label>
                    <p className="font-mono text-slate-700 mt-0.5">
                      /{detailCategory.slug}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Parent Category</label>
                    <p className="font-medium text-slate-800 mt-0.5">
                      {detailCategory.parent_id
                        ? categoryMap.get(detailCategory.parent_id)?.name || "Parent Category"
                        : "None (Top-Level Main Category)"}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400">Description</label>
                    <p className="text-slate-700 mt-0.5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                      {detailCategory.description || "No detailed description provided for this category."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Assigned Products</label>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {detailCategory.product_count || 0} Items
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
                      <p className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
                        {detailCategory.is_active ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Inactive
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Created Date</label>
                      <p className="text-slate-600 mt-0.5">
                        {formatDate(detailCategory.created_at)}
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Updated Date</label>
                      <p className="text-slate-600 mt-0.5">
                        {formatDate(detailCategory.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => handleOpenProductsModal(detailCategory)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5"
              >
                <Package className="w-4 h-4 text-slate-950" /> View Assigned Products
              </button>

              <button
                type="button"
                onClick={() => setDetailCategory(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CATEGORY ASSIGNED PRODUCTS MODAL */}
      {/* ------------------------------------------------------------- */}
      {viewProductsCategory && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    Products in "{viewProductsCategory.name}"
                  </h3>
                  <p className="text-xs text-slate-500">
                    Store items organized under this category
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewProductsCategory(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Controls Bar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter category products..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    loadCategoryProducts(viewProductsCategory.id, 1, e.target.value);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <span className="text-xs font-semibold text-slate-500">
                Category ID: <code className="font-mono text-slate-700">{viewProductsCategory.id.slice(0, 8)}...</code>
              </span>
            </div>

            {/* Products Table */}
            <div className="p-6 flex-1 overflow-y-auto min-h-[300px]">
              {loadingProducts ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
                  <span className="text-xs">Fetching assigned store products...</span>
                </div>
              ) : categoryProducts.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <Package className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-800">
                    No products assigned yet
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    No active store items have been categorized under "{viewProductsCategory.name}".
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Product Name</th>
                        <th className="py-3 px-3">SKU</th>
                        <th className="py-3 px-3">Price</th>
                        <th className="py-3 px-3">Stock</th>
                        <th className="py-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categoryProducts.map((p) => {
                        const mainImg = p.images.find((i) => i.is_primary)?.url || p.images[0]?.url;
                        const priceFormatted = (p.price / 100).toLocaleString("en-PK", {
                          style: "currency",
                          currency: "PKR",
                        });

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                  {mainImg ? (
                                    <img src={mainImg} alt={p.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="w-4 h-4 text-slate-400 m-auto mt-2" />
                                  )}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block">{p.name}</span>
                                  <span className="text-[10px] text-slate-400">{p.product_type}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3 font-mono text-slate-600">
                              {p.sku || "N/A"}
                            </td>

                            <td className="py-3 px-3 font-bold text-slate-900">
                              {priceFormatted}
                            </td>

                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  p.stock > 10
                                    ? "bg-slate-100 text-slate-700"
                                    : p.stock > 0
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-rose-50 text-rose-700"
                                }`}
                              >
                                {p.stock} in stock
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  p.status === "ACTIVE"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Page {productPage} of {productTotalPages}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={productPage <= 1}
                  onClick={() => {
                    const p = productPage - 1;
                    setProductPage(p);
                    loadCategoryProducts(viewProductsCategory.id, p, productSearch);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-50 text-slate-700"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={productPage >= productTotalPages}
                  onClick={() => {
                    const p = productPage + 1;
                    setProductPage(p);
                    loadCategoryProducts(viewProductsCategory.id, p, productSearch);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold disabled:opacity-50 text-slate-700"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* EDIT STORE CATEGORY MODAL */}
      {/* ------------------------------------------------------------- */}
      {editCategory && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Edit Store Category</h3>
                  <p className="text-xs text-slate-500">Update custom store category details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditCategory(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Parent Category (Optional)
                </label>
                <select
                  value={editParentId}
                  onChange={(e) => setEditParentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="">None (Top-Level Category)</option>
                  {flatCategories
                    .filter((c) => c.id !== editCategory.id)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} {!cat.company_id ? "(Marketplace)" : "(Store)"}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="editIsActive" className="text-xs font-semibold text-slate-800">
                  Category is Active and visible in catalog dropdowns
                </label>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditCategory(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit || !editName.trim()}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5"
              >
                {savingEdit ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DELETE STORE CATEGORY CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {deleteCategoryItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Store Category?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete <strong className="text-slate-900">"{deleteCategoryItem.name}"</strong>?
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            {(deleteCategoryItem.product_count || 0) > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  This category currently has <strong>{deleteCategoryItem.product_count} assigned products</strong>. You must reassign or remove products before deleting this store category.
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCategoryItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingCategory || (deleteCategoryItem.product_count || 0) > 0}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5"
              >
                {deletingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CREATE CATEGORY MODAL (Existing Reusable CategoryPickerModal) */}
      {/* ------------------------------------------------------------- */}
        <CategoryPickerModal
          isOpen={isCreateModalOpen}
          onSelectCategory={() => {
            loadCategories();
          }}
          onClose={() => {
            setIsCreateModalOpen(false);
            loadCategories();
          }}
        />
      </div>
    </CompanyShell>
  );
}
