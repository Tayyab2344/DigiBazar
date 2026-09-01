"use client";

import React, { useState, useEffect } from "react";
import { CompanyShell } from "@/components/company/CompanyShell";
import { companyApi } from "@/lib/api/company";
import type { CompanyProductRead, InventoryMovementRead } from "@/types/company";
import {
  Boxes,
  DollarSign,
  AlertTriangle,
  PackageX,
  Edit,
  Plus,
  Minus,
  X,
  RefreshCw,
  History,
} from "lucide-react";

export default function InventoryPage() {
  const [products, setProducts] = useState<CompanyProductRead[]>([]);
  const [movements, setMovements] = useState<InventoryMovementRead[]>([]);
  const [loading, setLoading] = useState(true);

  // Stock Adjustment Modal state
  const [selectedProduct, setSelectedProduct] = useState<CompanyProductRead | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const [prodsRes, movRes] = await Promise.all([
        companyApi.listProducts({ page: 1, page_size: 100 }),
        companyApi.listMovements({ page: 1, page_size: 20 }).catch(() => ({ items: [], total: 0 })),
      ]);
      setProducts(prodsRes.items);
      setMovements(movRes.items);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const openAdjustModal = (product: CompanyProductRead) => {
    setSelectedProduct(product);
    setNewStock(product.stock);
    setReason("Routine inventory audit restock");
    setModalOpen(true);
  };

  const handleStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await companyApi.updateStock(selectedProduct.id, newStock, reason);
      setModalOpen(false);
      loadInventory();
    } catch (err) {
      alert("Failed to update inventory stock.");
    }
  };

  const formatPKR = (cents: number) => `PKR ${(cents / 100).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`;

  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const totalValue = products.reduce((acc, p) => acc + p.stock * p.price, 0);
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= (p.low_stock_threshold || 5)).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <CompanyShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-xs text-slate-500 mt-1">Audit stock levels, update quantities, and track stock movements.</p>
        </div>
      </div>

      {/* 4 Inventory Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="p-2.5 w-fit rounded-xl bg-amber-50 text-amber-600">
            <Boxes className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-500 block">Total Units in Stock</span>
          <span className="text-2xl font-extrabold text-slate-900 block">{totalUnits.toLocaleString()}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="p-2.5 w-fit rounded-xl bg-emerald-50 text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-500 block">Total Inventory Value</span>
          <span className="text-2xl font-extrabold text-slate-900 block">{formatPKR(totalValue)}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="p-2.5 w-fit rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-500 block">Low-Stock Items</span>
          <span className="text-2xl font-extrabold text-amber-600 block">{lowStockCount}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="p-2.5 w-fit rounded-xl bg-rose-50 text-rose-600">
            <PackageX className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-500 block">Out-of-Stock Items</span>
          <span className="text-2xl font-extrabold text-rose-600 block">{outOfStockCount}</span>
        </div>
      </div>

      {/* Inventory Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Current Stock Levels</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Available Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {products.length > 0 ? (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.sku || "N/A"}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">{p.stock} units</td>
                    <td className="py-3 px-4">
                      {p.stock === 0 ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-700 border border-rose-200">
                          Out of Stock
                        </span>
                      ) : p.stock <= (p.low_stock_threshold || 5) ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openAdjustModal(p)}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 font-bold hover:bg-amber-100 transition-colors"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {modalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Adjust Stock Level</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStockUpdate} className="p-6 space-y-4 text-xs">
              <div>
                <span className="block text-slate-500 font-medium">Product</span>
                <span className="block text-sm font-bold text-slate-900 mt-0.5">{selectedProduct.name}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Stock Quantity</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newStock}
                  onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 font-bold text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Adjustment</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Restocked 20 units, Damaged unit removal"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black transition-colors shadow-2xs"
                >
                  Save Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CompanyShell>
  );
}
