"use client";

import React from "react";
import { Star, CheckCircle, ThumbsUp } from "lucide-react";
import { ReviewItem, ReviewSummary } from "@/lib/api/public";

interface ProductReviewsProps {
  summary: ReviewSummary;
  reviews: ReviewItem[];
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ summary, reviews }) => {
  const total = summary.total_reviews || reviews.length || 1;
  const breakdown = summary.rating_breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-8">
      <h3 className="text-xl font-black text-slate-900 tracking-tight">Customer Reviews</h3>

      {/* Summary Header & Rating Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
        {/* Score Card */}
        <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0">
          <div className="text-5xl font-black text-slate-900">{summary.average_rating.toFixed(1)}</div>
          <div className="flex items-center text-amber-400 my-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-5 h-5 ${
                  s <= Math.round(summary.average_rating) ? "fill-amber-400" : "text-slate-300"
                }`}
              />
            ))}
          </div>
          <div className="text-xs font-semibold text-slate-500">Based on {total} verified reviews</div>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="md:col-span-2 space-y-2">
          {[5, 4, 3, 2, 1].map((ratingKey) => {
            const count = breakdown[ratingKey] || 0;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={ratingKey} className="flex items-center gap-3 text-xs font-semibold">
                <span className="w-8 text-right font-bold text-slate-700">{ratingKey} ★</span>
                <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }}></div>
                </div>
                <span className="w-12 text-slate-400 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Review Cards */}
      <div className="space-y-4">
        <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Top Customer Feedbacks</h4>
        {reviews.map((rev) => (
          <div key={rev.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${s <= rev.rating ? "fill-amber-400" : "text-slate-200"}`}
                    />
                  ))}
                </div>
                {rev.is_verified_purchase && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Verified Purchase
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400">
                {new Date(rev.created_at).toLocaleDateString()}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              &quot;{rev.comment}&quot;
            </p>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="font-semibold text-slate-600">{rev.customer_name}</span>
              <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                <ThumbsUp className="w-3 h-3" /> Helpful
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
