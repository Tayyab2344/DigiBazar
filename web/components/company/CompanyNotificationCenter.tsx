"use client";

import React, { useState } from "react";
import { X, Bell, ShoppingBag, Boxes, ShieldAlert, Sparkles, Check } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: "order" | "inventory" | "system";
  timestamp: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "Low Stock Warning",
    message: "Wireless Noise-Canceling Headphones has only 3 units remaining.",
    category: "inventory",
    timestamp: "10m ago",
    read: false,
  },
  {
    id: "2",
    title: "New Order Received",
    message: "Order #DB-10293 for PKR 12,999 has been placed by Customer.",
    category: "order",
    timestamp: "25m ago",
    read: false,
  },
  {
    id: "3",
    title: "Payout Released",
    message: "Monthly vendor payout of PKR 148,290 has been transferred.",
    category: "system",
    timestamp: "2h ago",
    read: true,
  },
];

interface CompanyNotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

export const CompanyNotificationCenter: React.FC<CompanyNotificationCenterProps> = ({
  open,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [tab, setTab] = useState<"all" | "order" | "inventory">("all");

  if (!open) return null;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filtered = notifications.filter((n) => (tab === "all" ? true : n.category === tab));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" />
              <h2 className="font-bold text-slate-900 text-sm">Notifications</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={markAllRead}
                className="text-xs font-bold text-amber-700 hover:text-amber-800"
              >
                Mark all read
              </button>
              <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-xs">
            <button
              onClick={() => setTab("all")}
              className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                tab === "all" ? "bg-amber-500 text-slate-950 font-black" : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTab("order")}
              className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                tab === "order" ? "bg-amber-500 text-slate-950 font-black" : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setTab("inventory")}
              className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                tab === "inventory" ? "bg-amber-500 text-slate-950 font-black" : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Inventory
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl transition-colors flex items-start gap-3 ${
                  item.read ? "bg-white" : "bg-amber-50/50"
                }`}
              >
                <div className="p-2 rounded-lg bg-amber-100 text-amber-900 shrink-0">
                  {item.category === "inventory" ? (
                    <Boxes className="w-4 h-4" />
                  ) : item.category === "order" ? (
                    <ShoppingBag className="w-4 h-4" />
                  ) : (
                    <ShieldAlert className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{item.title}</span>
                    <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
