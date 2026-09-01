"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Search,
  ChevronRight,
  ChevronDown,
  Check,
  Folder,
  FolderOpen,
  Plus,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { CategoryItem } from "@/types/product";
import { productApi } from "@/lib/api/product";

interface CategoryPickerModalProps {
  isOpen: boolean;
  selectedCategoryId?: string;
  onSelectCategory: (category: CategoryItem) => void;
  onClose: () => void;
}

export function CategoryPickerModal({
  isOpen,
  selectedCategoryId,
  onSelectCategory,
  onClose,
}: CategoryPickerModalProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [selectedCat, setSelectedCat] = useState<CategoryItem | null>(null);

  // Create new company category state
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatParentId, setNewCatParentId] = useState<string>("");
  const [newCatDescription, setNewCatDescription] = useState("");
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState("");
  const [createErrorMsg, setCreateErrorMsg] = useState("");

  const fetchCategories = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const data = await productApi.listCategories(search);
      setCategories(data || []);

      // If search query active, auto-expand categories
      if (search && search.trim().length > 0) {
        const expandMap: Record<string, boolean> = {};
        const markExpanded = (items: CategoryItem[]) => {
          for (const item of items) {
            expandMap[item.id] = true;
            if (item.children && item.children.length > 0) {
              markExpanded(item.children);
            }
          }
        };
        markExpanded(data || []);
        setExpandedIds(expandMap);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCategories(searchQuery);
    }
  }, [isOpen, searchQuery, fetchCategories]);

  // Find category recursively by ID to set initial selection state
  useEffect(() => {
    if (selectedCategoryId && categories.length > 0) {
      const findCategory = (items: CategoryItem[]): CategoryItem | null => {
        for (const item of items) {
          if (item.id === selectedCategoryId) return item;
          if (item.children && item.children.length > 0) {
            const found = findCategory(item.children);
            if (found) return found;
          }
        }
        return null;
      };
      const foundCat = findCategory(categories);
      if (foundCat) {
        setSelectedCat(foundCat);
      }
    }
  }, [selectedCategoryId, categories]);

  if (!isOpen) return null;

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelect = (category: CategoryItem) => {
    setSelectedCat(category);
  };

  const handleConfirmSelect = () => {
    if (selectedCat) {
      onSelectCategory(selectedCat);
      onClose();
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setSubmittingCreate(true);
    setCreateSuccessMsg("");
    setCreateErrorMsg("");

    try {
      const newCategory = await productApi.createCategory({
        name: newCatName.trim(),
        parent_id: newCatParentId || undefined,
        description: newCatDescription.trim() || undefined,
      });

      setCreateSuccessMsg(`Category "${newCategory.name}" created and saved for your company!`);
      setNewCatName("");
      setNewCatDescription("");
      setNewCatParentId("");

      // Refresh list, select new category and update parent form
      await fetchCategories();
      setSelectedCat(newCategory);
      onSelectCategory(newCategory);

      setTimeout(() => {
        setIsCreatingNew(false);
        setCreateSuccessMsg("");
        onClose();
      }, 1200);
    } catch (err: any) {
      setCreateErrorMsg(err?.message || "Failed to create category for company.");
    } finally {
      setSubmittingCreate(false);
    }
  };

  const renderCategoryTree = (items: CategoryItem[], level = 0) => {
    return items.map((cat) => {
      const hasChildren = cat.children && cat.children.length > 0;
      const isExpanded = !!expandedIds[cat.id];
      const isSelected = selectedCat?.id === cat.id;

      return (
        <div key={cat.id} className="select-none">
          <div
            onClick={() => handleSelect(cat)}
            style={{ paddingLeft: `${level * 18 + 12}px` }}
            className={`group flex items-center justify-between py-2.5 pr-4 rounded-xl cursor-pointer transition-all duration-150 my-0.5 ${
              isSelected
                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => toggleExpand(cat.id, e)}
                  className={`p-1 rounded-md transition-colors ${
                    isSelected
                      ? "hover:bg-amber-600 text-slate-950"
                      : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                  }`}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <span className="w-6" />
              )}

              {isExpanded ? (
                <FolderOpen className={`w-4 h-4 ${isSelected ? "text-slate-950" : "text-amber-500"}`} />
              ) : (
                <Folder className={`w-4 h-4 ${isSelected ? "text-slate-950" : "text-amber-500"}`} />
              )}

              <span className="text-sm truncate">{cat.name}</span>
            </div>

            {isSelected && (
              <div className="flex items-center gap-1.5 bg-slate-950/20 px-2 py-0.5 rounded-full text-xs text-slate-950 font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>Selected</span>
              </div>
            )}
          </div>

          {hasChildren && isExpanded && (
            <div className="mt-0.5">{renderCategoryTree(cat.children!, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] transition-all">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Select Category</h2>
              <p className="text-xs text-slate-400">Choose or create a category for your product</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons / Switcher */}
        <div className="px-6 pt-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                !isCreatingNew
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Browse Categories
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isCreatingNew
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Create New Category
            </button>
          </div>

          {selectedCat && !isCreatingNew && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Selected: <strong className="text-slate-900 dark:text-white">{selectedCat.name}</strong>
            </span>
          )}
        </div>

        {/* Body Content */}
        {!isCreatingNew ? (
          <div className="p-6 flex-1 overflow-y-auto flex flex-col">
            {/* Search input */}
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search categories by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Tree View */}
            <div className="flex-1 min-h-[250px]">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  <span className="text-xs">Loading marketplace categories...</span>
                </div>
              ) : categories.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 mb-3 border border-amber-200 dark:border-amber-900/50">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No categories found</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                    {searchQuery
                      ? `No categories matching "${searchQuery}".`
                      : "No active categories available yet."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(true)}
                    className="mt-4 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create a category for your company
                  </button>
                </div>
              ) : (
                <div className="space-y-1">{renderCategoryTree(categories)}</div>
              )}
            </div>
          </div>
        ) : (
          /* Create New Company Category Form */
          <form onSubmit={handleCreateCategory} className="p-6 flex-1 overflow-y-auto space-y-4">
            {createSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{createSuccessMsg}</span>
              </div>
            )}

            {createErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{createErrorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Category Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Smart Wearables"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Parent Category (Optional)
              </label>
              <select
                value={newCatParentId}
                onChange={(e) => setNewCatParentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              >
                <option value="">None (Top-Level Category)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Short description of this category..."
                value={newCatDescription}
                onChange={(e) => setNewCatDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submittingCreate || !newCatName.trim()}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-md shadow-amber-500/20"
              >
                {submittingCreate ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-slate-950" />
                    Create Category for Company
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        {!isCreatingNew && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!selectedCat}
              onClick={handleConfirmSelect}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-slate-950" />
              Confirm Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}