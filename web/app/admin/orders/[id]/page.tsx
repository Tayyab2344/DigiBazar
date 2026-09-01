"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useAdminApi, useAdminMutation } from "@/lib/hooks/useAdminApi";
import { adminOrdersApi } from "@/lib/api/admin";
import { AdminStatusBadge } from "@/components/admin/shared/AdminStatusBadge";
import { AdminSkeleton } from "@/components/admin/shared/AdminSkeleton";
import { AdminErrorState } from "@/components/admin/shared/AdminErrorState";
import { AdminModal } from "@/components/admin/shared/AdminModal";
import { useToast } from "@/components/admin/shared/AdminToast";
import { formatCents, formatDateTime, formatOrderId } from "@/lib/utils/format";
import { OrderStatus, PaymentStatus } from "@/types/admin";
import { CheckCircle2, RotateCcw, User, Building2 } from "lucide-react";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState("");
  const { toast } = useToast();

  const { data: order, isLoading, error, refetch } = useAdminApi(
    () => adminOrdersApi.get(orderId),
    [orderId]
  );

  const { execute: processRefund, isLoading: isRefunding } = useAdminMutation(
    (data: { amount: number; reason: string }) => adminOrdersApi.refund(orderId, data)
  );

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundAmount || !refundReason || !order) return;
    const amountCents = Math.round(parseFloat(refundAmount) * 100);
    try {
      await processRefund({ amount: amountCents, reason: refundReason });
      toast(`Refund of ${formatCents(amountCents)} processed successfully`, "success");
      setIsRefundOpen(false);
      setRefundAmount("");
      setRefundReason("");
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Refund failed";
      toast(msg, "error");
    }
  };

  if (isLoading) return <AdminSkeleton />;
  if (error || !order) return <AdminErrorState message={error?.message || "Order not found"} />;

  // Timeline steps
  const timeline = [
    { label: "Order Placed", done: true, date: order.created_at },
    { label: "Payment Confirmed", done: order.payment_status === PaymentStatus.PAID || order.payment_status === PaymentStatus.REFUNDED, date: order.created_at },
    { label: "Processing", done: [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(order.order_status) },
    { label: "Shipped", done: [OrderStatus.SHIPPED, OrderStatus.DELIVERED].includes(order.order_status) },
    { label: "Delivered", done: order.order_status === OrderStatus.DELIVERED },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Card */}
      <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold font-mono text-[var(--text-primary)]">
                {formatOrderId(order.id)}
              </h1>
              <AdminStatusBadge status={order.order_status} />
              <AdminStatusBadge status={order.payment_status} />
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Placed on {formatDateTime(order.created_at)} • Order ID: {order.id}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {order.payment_status === PaymentStatus.PAID && (
              <button
                onClick={() => {
                  setRefundAmount((order.total / 100).toString());
                  setIsRefundOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--status-danger-bg)] text-[var(--status-danger)] border border-[var(--status-danger-border)] rounded-md hover:bg-red-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Process Refund
              </button>
            )}
          </div>
        </div>

        {/* Visual Timeline */}
        <div className="pt-4 border-t border-[var(--border-primary)]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
            Order Status History
          </div>
          <div className="flex items-center justify-between max-w-2xl relative">
            {timeline.map((step, idx) => (
              <div key={step.label} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.done
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                      : "bg-[var(--surface-secondary)] text-[var(--text-quaternary)] border border-[var(--border-primary)]"
                  }`}
                >
                  {step.done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span className="text-[11px] font-medium text-[var(--text-secondary)] mt-1">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Items Table */}
        <div className="md:col-span-2 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg p-5 space-y-3">
          <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2">
            Order Items
          </h3>
          <div className="divide-y divide-[var(--border-primary)]">
            {(order.items || []).map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">{item.product_name || `Product ID: ${item.product_id}`}</div>
                  <div className="text-[var(--text-tertiary)]">Qty: {item.qty} × {formatCents(item.unit_price_cents)}</div>
                </div>
                <div className="font-semibold text-[var(--text-primary)] tabular-nums">
                  {formatCents(item.qty * item.unit_price_cents - item.discount_cents)}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[var(--border-primary)] space-y-1.5 text-xs text-[var(--text-secondary)]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCents(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-[var(--status-success)]">
                <span>Discount</span>
                <span className="tabular-nums">-{formatCents(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="tabular-nums">{formatCents(order.shipping)}</span>
            </div>
            <div className="flex justify-between font-bold text-[var(--text-primary)] text-sm pt-2 border-t border-[var(--border-primary)]">
              <span>Total</span>
              <span className="tabular-nums">{formatCents(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Customer & Company Details */}
        <div className="space-y-6">
          <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg p-5 space-y-2 text-xs">
            <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2 flex items-center gap-1.5">
              <User className="w-4 h-4 text-[var(--text-tertiary)]" />
              Customer
            </h3>
            <div className="font-semibold text-[var(--text-primary)]">{order.customer_name || "Customer"}</div>
            <div className="text-[var(--text-tertiary)]">{order.customer_email}</div>
          </div>

          <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg p-5 space-y-2 text-xs">
            <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[var(--text-tertiary)]" />
              Company Storefront
            </h3>
            <div className="font-semibold text-[var(--text-primary)]">{order.company_name || "Company"}</div>
            <Link href={`/admin/companies/${order.company_id}`} className="text-blue-600 hover:underline block">
              View Storefront →
            </Link>
          </div>
        </div>
      </div>

      {/* Process Refund Modal */}
      <AdminModal
        open={isRefundOpen}
        onClose={() => setIsRefundOpen(false)}
        title="Process Refund"
        size="sm"
      >
        <form onSubmit={handleProcessRefund} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Refund Amount (PKR)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)] tabular-nums"
            />
            <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
              Max refundable: {formatCents(order.total)}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Reason for Refund
            </label>
            <textarea
              required
              rows={3}
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="e.g. Customer returned damaged product"
              className="w-full px-3 py-2 text-xs bg-[var(--surface-secondary)] border border-[var(--border-primary)] rounded-md outline-none focus-ring text-[var(--text-primary)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsRefundOpen(false)}
              className="px-3 py-1.5 text-xs border border-[var(--border-primary)] rounded-md text-[var(--text-secondary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRefunding}
              className="px-3 py-1.5 text-xs bg-[var(--status-danger)] text-white rounded-md hover:bg-red-700 font-semibold disabled:opacity-50"
            >
              {isRefunding ? "Processing…" : "Confirm Refund"}
            </button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
