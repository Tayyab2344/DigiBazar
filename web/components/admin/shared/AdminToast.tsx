"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 150);
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const ICON_COLORS = {
  success: "text-[var(--status-success)]",
  error: "text-[var(--status-danger)]",
  info: "text-[var(--status-info)]",
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const Icon = ICONS[toast.type];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg ${
        toast.exiting ? "animate-toast-out" : "animate-toast-in"
      }`}
      role="alert"
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${ICON_COLORS[toast.type]}`} />
      <p className="text-[13px] text-[var(--text-primary)] flex-1">{toast.message}</p>
      <button
        onClick={onClose}
        className="p-0.5 rounded hover:bg-[var(--surface-secondary)] text-[var(--text-quaternary)] transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
