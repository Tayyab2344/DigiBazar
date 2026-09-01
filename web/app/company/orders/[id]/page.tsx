"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { CompanyShell } from "@/components/company/CompanyShell";
import { companyApi } from "@/lib/api/company";
import type { CompanyOrderRead, OrderStatus } from "@/types/company";
import {
  ArrowLeft,
  CheckCircle2,
  User,
  MapPin,
  Printer,
  X,
  AlertTriangle,
  Loader2,
  Clock,
  RefreshCw,
  Truck,
  Check,
} from "lucide-react";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<CompanyOrderRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Custom Modal State
  const [modalTargetStatus, setModalTargetStatus] = useState<OrderStatus | null>(null);
  const [modalNotes, setModalNotes] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await companyApi.getOrder(orderId);
      setOrder(data);
    } catch (err: any) {
      console.error("Failed to load order details:", err);
      setError(err?.detail || err?.message || "Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) loadOrder();
  }, [orderId]);

  const handleConfirmStatusUpdate = async () => {
    if (!modalTargetStatus) return;
    try {
      setUpdating(true);
      setModalError(null);
      await companyApi.updateOrderStatus(
        orderId,
        modalTargetStatus,
        modalNotes || `Order status updated to ${modalTargetStatus}`
      );
      setToastMessage(`Order #${orderId.slice(0, 8)} status successfully updated to ${modalTargetStatus.toUpperCase()}`);
      setModalTargetStatus(null);
      setModalNotes("");
      await loadOrder();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error("Status update failed:", err);
      setModalError(err?.detail || err?.message || "Invalid order status transition.");
    } finally {
      setUpdating(false);
    }
  };

  const formatPKR = (cents: number) => `PKR ${(cents / 100).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <CompanyShell>
        <div className="py-24 text-center text-xs text-slate-500 font-semibold space-y-3">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <span>Loading order details...</span>
        </div>
      </CompanyShell>
    );
  }

  if (error || !order) {
    return (
      <CompanyShell>
        <div className="py-16 max-w-md mx-auto text-center space-y-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto font-bold text-lg">
            !
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Order Not Found</h2>
            <p className="text-xs text-slate-500 mt-1">{error || "Could not retrieve order information."}</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => loadOrder()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push("/company/orders")}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </CompanyShell>
    );
  }

  // Visual Timeline Steps
  const timelineSteps: { status: OrderStatus; label: string }[] = [
    { status: "pending", label: "Order Placed" },
    { status: "confirmed", label: "Confirmed" },
    { status: "processing", label: "Processing" },
    { status: "shipped", label: "Shipped" },
    { status: "delivered", label: "Delivered" },
  ];

  const currentStepIndex = timelineSteps.findIndex((s) => s.status === order.order_status);

  return (
    <CompanyShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Order #{order.id.slice(0, 8)}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-900 border border-amber-200/80">
                {order.order_status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Placed on {new Date(order.created_at).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors inline-flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Fulfillment Visual Timeline Tracker */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Fulfillment Status Timeline</h2>
        <div className="flex items-center justify-between relative max-w-3xl mx-auto py-4">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />
          {timelineSteps.map((step, idx) => {
            const isCompleted = currentStepIndex >= idx;
            return (
              <div key={step.status} className="relative z-10 flex flex-col items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    isCompleted
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : "bg-slate-100 text-slate-400 border border-slate-300"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4 text-slate-950" /> : idx + 1}
                </div>
                <span className={`text-xs font-semibold ${isCompleted ? "text-slate-900" : "text-slate-400"}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* State Machine Transition Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
          {order.order_status === "pending" && (
            <button
              disabled={updating}
              onClick={() => { setModalError(null); setModalTargetStatus("confirmed"); }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black hover:bg-amber-600 transition-colors shadow-2xs"
            >
              Confirm Order
            </button>
          )}
          {order.order_status === "confirmed" && (
            <button
              disabled={updating}
              onClick={() => { setModalError(null); setModalTargetStatus("processing"); }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black hover:bg-amber-600 transition-colors shadow-2xs"
            >
              Start Processing
            </button>
          )}
          {order.order_status === "processing" && (
            <button
              disabled={updating}
              onClick={() => { setModalError(null); setModalTargetStatus("shipped"); }}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black hover:bg-amber-600 transition-colors shadow-2xs"
            >
              Mark Shipped
            </button>
          )}
          {order.order_status === "shipped" && (
            <button
              disabled={updating}
              onClick={() => { setModalError(null); setModalTargetStatus("delivered"); }}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-2xs"
            >
              Mark Delivered
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left (2 cols): Items & Pricing */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Order Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Unit Price</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {order.items.map((item: any, i: number) => {
                    const unitPrice = item.unit_price_cents ?? item.unit_price ?? 0;
                    const qty = item.qty ?? item.quantity ?? 1;
                    const totalCents = item.total_cents ?? item.total_price ?? (unitPrice * qty);
                    return (
                      <tr key={i}>
                        <td className="py-3 px-4 font-bold text-slate-900">{item.product_name || item.name || "Item"}</td>
                        <td className="py-3 px-4">{formatPKR(unitPrice)}</td>
                        <td className="py-3 px-4 font-bold">{qty}</td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                          {formatPKR(totalCents)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Money Math Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">Payment Summary</h3>
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatPKR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Discount</span>
              <span className="text-emerald-600">-{formatPKR(order.discount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping Fee</span>
              <span>{formatPKR(order.shipping)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax</span>
              <span>{formatPKR(order.tax)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-100 pt-3">
              <span>Total Paid</span>
              <span className="text-amber-700 font-black">{formatPKR(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Right (1 col): Customer & Shipping Information */}
        <div className="space-y-8">
          {/* Customer Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-amber-600" />
              <span>Customer Details</span>
            </div>
            <div>
              <span className="block font-bold text-slate-900">{order.customer_name || "Merchant Customer"}</span>
              <span className="block text-slate-500 mt-0.5">{order.customer_email || "N/A"}</span>
              <span className="block text-slate-500">{order.customer_phone || "+92 300 1234567"}</span>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Shipping Address</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {order.shipping_address?.street || "Main Boulevard, DHA Phase 6"}<br />
              {order.shipping_address?.city || "Lahore"}, {order.shipping_address?.country || "Pakistan"}
            </p>
          </div>
        </div>
      </div>

      {/* Custom Status Update Confirmation Modal */}
      {modalTargetStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => { setModalTargetStatus(null); setModalError(null); }}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Update Order Status</h3>
                <p className="text-xs text-slate-500">Order #{order.id.slice(0, 8)}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Current Status:</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                  {order.order_status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">New Target Status:</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black uppercase text-[10px]">
                  {modalTargetStatus}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Vendor Notes (Optional)</label>
              <input
                type="text"
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                placeholder="e.g. Tracking code or fulfillment notes"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={updating}
                onClick={() => { setModalTargetStatus(null); setModalError(null); }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={updating}
                onClick={handleConfirmStatusUpdate}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Confirm Update</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-200 border border-slate-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </CompanyShell>
  );
}
