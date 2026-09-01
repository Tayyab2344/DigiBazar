import { apiClient } from "./client";
import {
  LoginRequest,
  LoginResponse,
  CustomerRegisterRequest,
  CompanyRegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  MessageResponse,
  User,
} from "@/types/auth";

export const authApi = {
  login: (data: LoginRequest): Promise<LoginResponse> =>
    apiClient<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  registerCustomer: (data: CustomerRegisterRequest): Promise<User> =>
    apiClient<User>("/api/v1/auth/register/customer", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  registerCompany: (data: CompanyRegisterRequest): Promise<User> =>
    apiClient<User>("/api/v1/auth/register/company", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: (): Promise<MessageResponse> =>
    apiClient<MessageResponse>("/api/v1/auth/logout", {
      method: "POST",
    }),

  getCurrentUser: (): Promise<User> =>
    apiClient<User>("/api/v1/auth/me", {
      method: "GET",
    }),

  forgotPassword: (data: ForgotPasswordRequest): Promise<MessageResponse> =>
    apiClient<MessageResponse>("/api/v1/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  resetPassword: (data: ResetPasswordRequest): Promise<MessageResponse> =>
    apiClient<MessageResponse>("/api/v1/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  changePassword: (data: ChangePasswordRequest): Promise<MessageResponse> =>
    apiClient<MessageResponse>("/api/v1/auth/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  uploadImage: (file: File): Promise<{ url: string; public_id: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient<{ url: string; public_id: string }>("/api/v1/upload/image", {
      method: "POST",
      body: formData,
    });
  },
};

