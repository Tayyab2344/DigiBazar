import { apiClient } from "./client";

export interface CreateReviewPayload {
  product_id: string;
  rating: number;
  comment?: string;
}

export interface ReviewEligibilityResponse {
  can_review: boolean;
  reason?: string | null;
  has_reviewed: boolean;
  existing_rating?: number | null;
  existing_comment?: string | null;
}

export interface SubmittedReviewRead {
  id: string;
  product_id: string;
  company_id: string;
  customer_id: string;
  rating: number;
  comment?: string;
  is_verified_purchase: boolean;
  created_at: string;
}

export const reviewApi = {
  submitReview: (payload: CreateReviewPayload) =>
    apiClient<SubmittedReviewRead>("/api/v1/reviews", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  checkEligibility: (productId: string) =>
    apiClient<ReviewEligibilityResponse>(`/api/v1/reviews/eligibility/${productId}`),
};
