export type UserRole = "SUPER_ADMIN" | "COMPANY" | "CUSTOMER";

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  company_id?: string;
  avatar_url?: string;
}

export interface CustomerRegisterData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  landmark?: string;
  password: string;
  confirm_password: string;
  terms_accepted: boolean;
}

export interface CompanyRegisterData {
  logo_url?: string;
  logo_file?: File | null;
  business_name: string;
  business_email: string;
  business_phone: string;
  website?: string;
  business_type: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  landmark?: string;
  first_name: string;
  last_name: string;
  account_email: string;
  account_phone: string;
  password: string;
  confirm_password: string;
  terms_accepted: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  password: string;
  confirm_password: string;
  token?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}
