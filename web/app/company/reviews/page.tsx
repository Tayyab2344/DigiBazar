"use client";

import React, { useState, useEffect } from "react";
import { CompanyShell } from "@/components/company/CompanyShell";
import { companyApi } from "@/lib/api/company";
import type { CompanyReviewRead } from "@/types/company";
import { Star, ShieldCheck, Reply } from "lucide-react";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<CompanyReviewRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await companyApi.listReviews();
      setReviews(data);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleSendReply = (id: string) => {
    if (!replyText.trim()) return;
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, reply: replyText.trim() } : r))
    );
    setReplyId(null);
    setReplyText("");
  };

  return (
    <CompanyShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Reviews</h1>
          <p className="text-xs text-slate-500 mt-1">Manage customer ratings, feedback, and vendor responses.</p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((rev) => (
            <div key={rev.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block text-sm">{rev.product_name || "Store Item"}</span>
                  <span className="text-slate-500">Reviewed by <strong className="text-slate-800">{rev.customer_name || "Verified Customer"}</strong></span>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < rev.rating ? "fill-current text-amber-400" : "text-slate-200"}`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-slate-700 leading-relaxed text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                &quot;{rev.comment}&quot;
              </p>

              {rev.reply && (
                <div className="ml-6 p-3 bg-amber-50/60 border-l-4 border-amber-500 rounded-r-xl text-amber-900 space-y-1">
                  <span className="font-bold block text-[11px]">Vendor Response:</span>
                  <p>{rev.reply}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {rev.verified_purchase && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Verified Purchase
                    </span>
                  )}
                  <span className="text-slate-400 text-[11px]">{new Date(rev.created_at).toLocaleDateString()}</span>
                </div>

                {!rev.reply && (
                  <button
                    onClick={() => setReplyId(replyId === rev.id ? null : rev.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Reply className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reply</span>
                  </button>
                )}
              </div>

              {/* Reply Drawer Input */}
              {replyId === rev.id && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your public vendor reply to this customer..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-xs text-slate-900"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setReplyId(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSendReply(rev.id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black shadow-2xs hover:bg-amber-600"
                    >
                      Post Reply
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No customer reviews posted yet for your products.
          </div>
        )}
      </div>
    </CompanyShell>
  );
}
