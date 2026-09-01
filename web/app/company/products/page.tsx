"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CompanyShell } from "@/components/company/CompanyShell";
import { companyApi } from "@/lib/api/company";
import { productApi } from "@/lib/api/product";
import type { CompanyProductRead } from "@/types/company";
import type { EnhancedProduct } from "@/types/product";
import {
  Plus,
  Search,
  Package,
  Edit,
  Trash2,
  Download,
  Upload,
  CheckSquare,
  Square,
  Eye,
  X,
  Tag,
  Boxes,
  DollarSign,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ImageIcon,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

// Helper to safely extract image URL string from string/object/array
function getImageUrl(item: any): string | undefined {
  if (!item) return undefined;
  if (typeof item === "string") return item;
  if (typeof item === "object") {
    if (item.url && typeof item.url === "string") return item.url;
    if (Array.isArray(item.images) && item.images.length > 0) {
      return getImageUrl(item.images[0]);
    }
    if (Array.isArray(item.product_images) && item.product_images.length > 0) {
      return getImageUrl(item.product_images[0]);
    }
    if (item.primary_image && typeof item.primary_image === "string") return item.primary_image;
  }
  return undefined;
}

// Safe Image Thumbnail component (no hardcoded fallback images)
function ProductThumbnail({ src, alt }: { src?: string; alt: string }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-slate-400">
        <Package className="w-5 h-5" />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 shrink-0 overflow-hidden relative">
      <img
        src={src}
        alt={alt}
        onError={() => setError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

// Modal Image Component rendering user uploaded image without hardcoded fallbacks
function ModalImage({ src, alt }: { src?: string; alt: string }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-slate-400 p-2 text-center space-y-1">
        <ImageIcon className="w-6 h-6 text-slate-300" />
        <span className="text-[10px]">Image Unavailable</span>
      </div>
    );
  }

  return (
    <div className="aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative">
      <img
        src={src}
        alt={alt}
        onError={() => setError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export default function CompanyProductsPage() {
  const [products, setProducts] = useState<CompanyProductRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Quick View Detail Modal State
  const [viewProduct, setViewProduct] = useState<EnhancedProduct | CompanyProductRead | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Custom Delete Modal & Toast State
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await companyApi.listProducts({ page: 1, page_size: 50, search });
      setProducts(res.items);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search]);

  const handleExecuteSingleDelete = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      await companyApi.deleteProduct(productToDelete.id);
      showToast(`Product "${productToDelete.name}" deleted successfully.`, "success");
      setProductToDelete(null);
      loadProducts();
    } catch (err: any) {
      console.error("Delete failed:", err);
      showToast(err?.detail || err?.message || "Failed to delete product. Please try again.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExecuteBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsDeleting(true);
      await Promise.all(selectedIds.map((id) => companyApi.deleteProduct(id)));
      showToast(`${selectedIds.length} products deleted successfully.`, "success");
      setSelectedIds([]);
      setShowBulkDeleteModal(false);
      loadProducts();
    } catch (err: any) {
      console.error("Bulk delete failed:", err);
      showToast("Failed to delete selected products. Please try again.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (product: CompanyProductRead) => {
    const nextStatus = product.status === "active" ? "draft" : "active";
    try {
      await companyApi.updateProduct(product.id, { status: nextStatus });
      showToast(`Status updated to ${nextStatus.toUpperCase()}`);
      loadProducts();
    } catch (err) {
      showToast("Failed to update product status", "error");
    }
  };

  const handleOpenDetailModal = async (product: CompanyProductRead) => {
    setViewProduct(product);
    setLoadingDetail(true);
    try {
      const fullDetail = await productApi.getEnhancedProduct(product.id);
      setViewProduct(fullDetail);
    } catch (err) {
      // Keep basic info if enhanced endpoint fails
    } finally {
      setLoadingDetail(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) setSelectedIds([]);
    else setSelectedIds(products.map((p) => p.id));
  };

  const formatPKR = (cents: number) => `PKR ${(cents / 100).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`;

  const filteredProducts = products.filter((p) => {
    if (statusFilter === "all") return true;
    return p.status === statusFilter;
  });

  return (
    <CompanyShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">Manage your merchant inventory listings, prices, and stock.</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors">
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <Link
            href="/company/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-600 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name or SKU..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {["all", "active", "draft", "archived"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                  statusFilter === st
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-950">
            <span className="font-semibold">{selectedIds.length} products selected</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 bg-white border border-amber-300 rounded-lg font-medium hover:bg-amber-100 transition-colors">
                Archive Selected
              </button>
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="px-3 py-1 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold">
                <th className="py-3 px-4 w-10">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600">
                    {selectedIds.length === products.length && products.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Product Info</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Sales</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <button onClick={() => toggleSelect(p.id)} className="text-slate-400 hover:text-slate-600">
                        {selectedIds.includes(p.id) ? (
                          <CheckSquare className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <ProductThumbnail src={getImageUrl(p)} alt={p.name} />
                        <div>
                          <span className="truncate max-w-xs block font-bold text-slate-900">{p.name}</span>
                          {p.brand && <span className="text-[10px] text-slate-400 font-medium">{p.brand}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 font-medium">
                      {p.sku ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] font-bold">
                          {p.sku}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not Set</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>
                        <span>{formatPKR(p.price)}</span>
                        {p.cost_price && (
                          <span className="block text-[10px] text-emerald-600 font-semibold">
                            Cost: {formatPKR(p.cost_price)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-extrabold ${p.stock <= 5 ? "text-rose-600" : "text-slate-900"}`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-semibold">{p.sales_count || 0}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(p)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          p.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                        }`}
                        title="Click to toggle status"
                      >
                        {p.status}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Quick View Details Modal */}
                        <button
                          onClick={() => handleOpenDetailModal(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                          title="View product details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Edit Link */}
                        <Link
                          href={`/company/products/${p.id}/edit`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                          title="Edit product details"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        {/* Delete Button */}
                        <button
                          onClick={() => setProductToDelete({ id: p.id, name: p.name })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))

              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No products matching filter. Click &quot;Add Product&quot; to create your first listing.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Quick View / Detail Modal */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 rounded-2xl border border-amber-500/30 text-amber-400">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{viewProduct.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400 font-mono">SKU: {viewProduct.sku || "N/A"}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold uppercase text-[10px]">
                      {viewProduct.status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewProduct(null)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
              {/* Product Gallery */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-amber-600" />
                  <span>Media Gallery</span>
                </h4>
                {(() => {
                  const rawList = (viewProduct as any).images || (viewProduct as any).product_images || [];
                  const validUrls = (Array.isArray(rawList) ? rawList : [])
                    .map((img: any) => getImageUrl(img))
                    .filter((url: string | undefined): url is string => Boolean(url));

                  if (validUrls.length === 0) {
                    return (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs flex flex-col items-center gap-1">
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                        <p>No valid images uploaded for this product.</p>
                        <p className="text-[10px] text-slate-400">Click &quot;Edit Product&quot; to upload your image files.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {validUrls.map((imgUrl: string, idx: number) => (
                        <ModalImage key={idx} src={imgUrl} alt={viewProduct.name} />
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Specs & Pricing Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <span className="block text-[11px] text-slate-500 font-medium">Regular Price</span>
                  <span className="text-sm font-bold text-slate-900">{formatPKR(viewProduct.price)}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-500 font-medium">Stock Count</span>
                  <span className="text-sm font-bold text-slate-900">{viewProduct.stock} units</span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-500 font-medium">Brand</span>
                  <span className="text-sm font-bold text-slate-900">{"brand" in viewProduct && viewProduct.brand ? viewProduct.brand : "N/A"}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-500 font-medium">Total Sales</span>
                  <span className="text-sm font-bold text-amber-700">{viewProduct.sales_count || 0} orders</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Description</h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200 whitespace-pre-line">
                  {viewProduct.description || "No description provided."}
                </p>
              </div>

              {"short_description" in viewProduct && viewProduct.short_description && (
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900">Short Summary</h4>
                  <p className="text-slate-600">{viewProduct.short_description}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Product ID: {viewProduct.id}</span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/company/products/${viewProduct.id}/edit`}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition-colors flex items-center gap-1.5 text-xs shadow-2xs"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-950" />
                  <span>Edit Product</span>
                </Link>
                <button
                  onClick={() => setViewProduct(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition-colors text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Single Product Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100 border border-rose-200 text-rose-600 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Product</h3>
                <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 space-y-1">
              <p>Are you sure you want to permanently delete this product?</p>
              <p className="font-bold text-slate-900 text-sm truncate">{productToDelete.name}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteSingleDelete}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Products Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100 border border-rose-200 text-rose-600 rounded-2xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Selected Products</h3>
                <p className="text-xs text-slate-500 mt-0.5">Bulk destructive action</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 space-y-1">
              <p>Are you sure you want to delete <span className="font-bold text-rose-600">{selectedIds.length}</span> selected items from your catalog?</p>
              <p className="text-[11px] text-slate-500">All inventory logs, variants, and product images will be permanently removed.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteBulkDelete}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete {selectedIds.length} Products</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div
            className={`px-4 py-3 rounded-2xl border shadow-xl flex items-center gap-3 text-xs font-medium text-white ${
              toast.type === "success"
                ? "bg-slate-900 border-slate-800 text-emerald-400"
                : "bg-rose-900 border-rose-800 text-rose-200"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </CompanyShell>
  );
}

