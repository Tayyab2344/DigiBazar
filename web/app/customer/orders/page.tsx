"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/marketplace/Header";
import { Footer } from "@/components/marketplace/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { companyApi } from "@/lib/api/company";
import { reviewApi } from "@/lib/api/review";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  RefreshCw,
  XCircle,
  CreditCard,
  Store,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ExternalLink,
  MapPin,
  Calendar,
  Star,
} from "lucide-react";
import { WriteReviewModal } from "@/components/marketplace/WriteReviewModal";

interface CustomerOrderItem {
  id?: string;
  product_id?: string;
  product_name?: string;
  name?: string;
  qty?: number;
  quantity?: number;
  unit_price_cents?: number;
  unit_price?: number;
  price?: number;
  total_cents?: number;
  total_price?: number;
  image?: string;
}

interface CustomerOrder {
  id: string;
  company_id: string;
  company_name?: string;
  items: CustomerOrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  payment_status: string;
  order_status: string;
  payment_reference?: string;
  created_at: string;
  updated_at: string;
}

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "history">("active");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [reviewModalTarget, setReviewModalTarget] = useState<{ id: string; name: string } | null>(null);
  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>([]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const [res, reviewedIds] = await Promise.all([
        companyApi.getMyOrders(),
        reviewApi.getMyReviewedProductIds().catch(() => []),
      ]);
      setOrders(res || []);
      setReviewedProductIds(reviewedIds || []);
      // Expand first order by default if available
      if (res && res.length > 0) {
        setExpandedOrderId(res[0].id);
      }
    } catch (err) {
      console.error("Failed to load customer orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const formatPKR = (cents: number) =>
    `Rs. ${(cents / 100).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const activeOrders = orders.filter((o) =>
    ["pending", "confirmed", "processing", "shipped"].includes(o.order_status?.toLowerCase())
  );
  const historyOrders = orders.filter((o) =>
    ["delivered", "cancelled", "refunded"].includes(o.order_status?.toLowerCase())
  );

  const displayedOrders =
    activeTab === "active"
      ? activeOrders
      : activeTab === "history"
      ? historyOrders
      : orders;

  const getStatusBadge = (statusStr: string) => {
    const st = statusStr.toLowerCase();
    switch (st) {
      case "pending":
        return { label: "Pending", bg: "bg-amber-50 text-amber-800 border-amber-200" };
      case "confirmed":
        return { label: "Confirmed", bg: "bg-blue-50 text-blue-800 border-blue-200" };
      case "processing":
        return { label: "Processing", bg: "bg-indigo-50 text-indigo-800 border-indigo-200" };
      case "shipped":
        return { label: "Shipped", bg: "bg-purple-50 text-purple-800 border-purple-200" };
      case "delivered":
        return { label: "Delivered", bg: "bg-emerald-50 text-emerald-800 border-emerald-200" };
      case "cancelled":
        return { label: "Cancelled", bg: "bg-rose-50 text-rose-800 border-rose-200" };
      default:
        return { label: st.toUpperCase(), bg: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  const getStepIndex = (statusStr: string) => {
    const st = statusStr.toLowerCase();
    switch (st) {
      case "pending":
        return 0;
      case "confirmed":
        return 1;
      case "processing":
        return 2;
      case "shipped":
        return 3;
      case "delivered":
        return 4;
      default:
        return -1;
    }
  };

  const timelineSteps = [
    { label: "Order Placed" },
    { label: "Confirmed" },
    { label: "Processing" },
    { label: "Shipped" },
    { label: "Delivered" },
  ];

  return (
    <ProtectedRoute allowedRoles={["CUSTOMER", "COMPANY", "SUPER_ADMIN"]}>
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans antialiased text-slate-900">
        <Header />

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-amber-950/80 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">
                <ShoppingBag className="w-4 h-4" /> My Account
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Your Orders & Fulfillment</h1>
              <p className="text-xs text-slate-300 mt-1">
                Track active packages in real-time and view your complete order purchase history.
              </p>
            </div>
            <button
              onClick={loadOrders}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 flex items-center gap-2 self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Status</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "active"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Active Orders</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === "active" ? "bg-slate-950/15 text-slate-950" : "bg-amber-100 text-amber-900"
                }`}
              >
                {activeOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "history"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Order History</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === "history" ? "bg-slate-950/15 text-slate-950" : "bg-slate-100 text-slate-700"
                }`}
              >
                {historyOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>All Orders</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === "all" ? "bg-slate-950/15 text-slate-950" : "bg-slate-100 text-slate-700"
                }`}
              >
                {orders.length}
              </span>
            </button>
          </div>

          {/* Orders List Container */}
          {loading ? (
            <div className="py-24 text-center text-xs text-slate-500 font-semibold space-y-3 bg-white rounded-3xl border border-slate-200">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <span>Fetching your order updates...</span>
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200 shadow-2xs p-8">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">No {activeTab} orders found</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {activeTab === "active"
                    ? "You currently have no active orders in transit."
                    : "You haven't completed any orders yet."}
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-amber-500/20"
              >
                <span>Browse Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {displayedOrders.map((order) => {
                const badge = getStatusBadge(order.order_status);
                const stepIdx = getStepIndex(order.order_status);
                const isExpanded = expandedOrderId === order.id;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    {/* Order Card Header */}
                    <div
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="p-5 sm:p-6 cursor-pointer bg-gradient-to-b from-white to-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm text-slate-900">
                            #{order.id.slice(0, 8)}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                            <Store className="w-3.5 h-3.5 text-amber-600" />
                            <span>{order.company_name}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(order.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span>•</span>
                          <span className="font-extrabold text-slate-900">{formatPKR(order.total)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors">
                          {isExpanded ? "Hide Details" : "View Order Details"}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Active Order Visual Timeline Progress Bar */}
                    {stepIdx >= 0 && stepIdx < 4 && (
                      <div className="p-5 bg-slate-900 text-white border-b border-slate-800 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-300">Package Status Tracker</span>
                          <span className="text-emerald-400 font-extrabold uppercase text-[10px] tracking-wider">
                            In Transit ({timelineSteps[stepIdx].label})
                          </span>
                        </div>

                        <div className="flex items-center justify-between relative max-w-2xl mx-auto py-2">
                          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -translate-y-1/2 z-0" />
                          {timelineSteps.map((step, idx) => {
                            const isCompleted = stepIdx >= idx;
                            return (
                              <div key={step.label} className="relative z-10 flex flex-col items-center gap-1">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-[10px] transition-all ${
                                    isCompleted
                                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/50 ring-2 ring-amber-400/30"
                                      : "bg-slate-800 text-slate-500 border border-slate-700"
                                  }`}
                                >
                                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" /> : idx + 1}
                                </div>
                                <span className={`text-[10px] font-bold ${isCompleted ? "text-white" : "text-slate-500"}`}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Expanded Order Details Accordion Body */}
                    {isExpanded && (
                      <div className="p-5 sm:p-6 space-y-6 bg-white animate-in fade-in duration-150">
                        {/* Order Items Table */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Items ({order.items.length})</h4>
                          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                            {order.items.map((item, idx) => {
                              const title = item.product_name || item.name || "Purchased Item";
                              const qty = item.qty || item.quantity || 1;
                              const unitPrice = item.unit_price_cents || item.unit_price || item.price || 0;
                              const itemTotal = item.total_cents || item.total_price || unitPrice * qty;
                              const productId = item.product_id || item.productId || item.id;

                              return (
                                <div key={idx} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                                  <div className="flex items-center gap-3.5 min-w-0">
                                    <img
                                      src={img}
                                      alt={title}
                                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                                    />
                                    <div className="min-w-0">
                                      <span className="font-bold text-xs text-slate-900 block truncate">{title}</span>
                                      <span className="text-[11px] text-slate-500">
                                        Qty: {qty} × {formatPKR(unitPrice)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <div className="font-extrabold text-xs text-slate-900">
                                      {formatPKR(itemTotal)}
                                    </div>
                                    {order.order_status?.toLowerCase() === "delivered" && (
                                      productId && reviewedProductIds.includes(productId) ? (
                                        <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Reviewed</span>
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => setReviewModalTarget({ id: productId || "", name: title })}
                                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                                        >
                                          <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                                          <span>Write Review</span>
                                        </button>
                                      )
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Breakdown Grid: Payment & Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                            <span className="font-bold text-slate-900 block text-xs border-b border-slate-200 pb-2">Payment Info</span>
                            <div className="flex justify-between text-slate-600">
                              <span>Payment Status:</span>
                              <span className="font-bold uppercase text-emerald-600">{order.payment_status}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>Reference Code:</span>
                              <span className="font-mono text-[11px] text-slate-800">{order.payment_reference || "N/A"}</span>
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                            <span className="font-bold text-slate-900 block text-xs border-b border-slate-200 pb-2">Financial Breakdown</span>
                            <div className="flex justify-between text-slate-600">
                              <span>Subtotal:</span>
                              <span>{formatPKR(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>Shipping:</span>
                              <span>{order.shipping > 0 ? formatPKR(order.shipping) : "FREE"}</span>
                            </div>
                            <div className="flex justify-between font-extrabold text-slate-900 border-t border-slate-200 pt-2 text-xs">
                              <span>Total Paid:</span>
                              <span className="text-amber-600 font-black">{formatPKR(order.total)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {reviewModalTarget && (
          <WriteReviewModal
            isOpen={!!reviewModalTarget}
            onClose={() => setReviewModalTarget(null)}
            productId={reviewModalTarget.id}
            productName={reviewModalTarget.name}
            onSuccess={loadOrders}
          />
        )}

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
