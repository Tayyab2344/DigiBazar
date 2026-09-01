"use client";

import React from "react";
import { CheckCircle2, Eye, Save, Send, Sparkles, RefreshCw } from "lucide-react";
import { ProductStatus } from "@/types/product";

interface Props {
  completionPct: number;
  sectionStatus: Record<string, boolean>;
  isEditing: boolean;
  productStatus: ProductStatus;
  isSaving: boolean;
  onSaveDraft: () => void;
  onPreview: () => void;
  onPublish: () => void;
}

export function ProductFormHeader({
  completionPct,
  sectionStatus,
  isEditing,
  productStatus,
  isSaving,
  onSaveDraft,
  onPreview,
  onPublish,
}: Props) {
  return (
    <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Title & Progress */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">
              {isEditing ? "Edit Marketplace Product" : "Create New Product"}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                productStatus === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {productStatus}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Product Completion:</span>
            <div className="w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className="font-bold text-amber-700">{completionPct}%</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 text-slate-500 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{isSaving ? "Saving..." : "Save Draft"}</span>
          </button>

          <button
            type="button"
            onClick={onPreview}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Preview Product</span>
          </button>

          <button
            type="button"
            onClick={onPublish}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-600 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 text-slate-950 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-slate-950" />
            )}
            <span>
              {isSaving
                ? "Publishing..."
                : productStatus === "ACTIVE"
                ? "Save Changes"
                : "Publish Product"}
            </span>
          </button>
        </div>
      </div>

      {/* Completion Section Badges */}
      <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px]">
        {Object.entries(sectionStatus).map(([label, isDone]) => (
          <span
            key={label}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium transition-colors ${
              isDone
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-slate-100 text-slate-400 border border-slate-200"
            }`}
          >
            <CheckCircle2 className={`w-3 h-3 ${isDone ? "text-emerald-600" : "text-slate-300"}`} />
            <span>{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
