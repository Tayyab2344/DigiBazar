export type UserRole = "CUSTOMER" | "COMPANY" | "SUPER_ADMIN";

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  company_id?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AddressData {
  address_line_1: string;
  address_line_2?: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  landmark?: string;
}

export interface CustomerRegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  address: AddressData;
}

export interface CompanyOwnerData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface CompanyRegisterRequest {
  business_name: string;
  business_email: string;
  business_phone: string;
  business_logo?: string;
  website?: string;
  business_type: string;
  address: AddressData;
  owner: CompanyOwnerData;
  password: string;
  confirm_password: string;
}


export interface ImageUploadResponse {
  url: string;
  public_id: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  reset_token: string;
  new_password: string;
  confirm_new_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}

export interface MessageResponse {
  message: string;
  reset_token?: string;
}
