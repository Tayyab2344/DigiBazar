"use client";

import React, { useState } from "react";
import { Star, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { reviewApi } from "@/lib/api/review";

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  initialRating?: number;
  initialComment?: string;
  onSuccess?: () => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  initialRating = 5,
  initialComment = "",
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(initialRating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>(initialComment || "");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await reviewApi.submitReview({
        product_id: productId,
        rating: rating,
        comment: comment.trim() || undefined,
      });

      setSuccessMsg("Thank you! Your verified review has been published.");
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      const msg = err?.detail || err?.message || "Failed to submit review. Please try again.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStarDisplay = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 text-[11px] font-extrabold rounded-full border border-amber-200 uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Buyer Review
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
            Write a Review for {productName}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Share your feedback to help other buyers on digiBazar make informed choices.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Rating Selection */}
          <div className="space-y-2 text-center py-2 bg-slate-50 rounded-2xl border border-slate-100 p-4">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Overall Star Rating
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-hidden transform hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= currentStarDisplay
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300 fill-slate-100"
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-extrabold text-amber-700 block">
              {currentStarDisplay === 5 && "5 / 5 — Excellent"}
              {currentStarDisplay === 4 && "4 / 5 — Very Good"}
              {currentStarDisplay === 3 && "3 / 5 — Average"}
              {currentStarDisplay === 2 && "2 / 5 — Poor"}
              {currentStarDisplay === 1 && "1 / 5 — Terrible"}
            </span>
          </div>

          {/* Comment Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Your Review & Comments
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like or dislike about this product? How was the quality and delivery?"
              className="w-full p-4 text-xs font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <span>Submit Verified Review</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
