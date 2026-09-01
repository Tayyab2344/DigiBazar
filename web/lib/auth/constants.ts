export interface PasswordRequirement {
  id: string;
  label: string;
  regex: RegExp;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { id: "min_length", label: "At least 8 characters", regex: /.{8,}/ },
  { id: "uppercase", label: "Uppercase letter", regex: /[A-Z]/ },
  { id: "lowercase", label: "Lowercase letter", regex: /[a-z]/ },
  { id: "number", label: "Number", regex: /[0-9]/ },
];

export const PROVINCE_OPTIONS = [
  { value: "Punjab", label: "Punjab" },
  { value: "Sindh", label: "Sindh" },
  { value: "Khyber Pakhtunkhwa", label: "Khyber Pakhtunkhwa" },
  { value: "Balochistan", label: "Balochistan" },
  { value: "Islamabad Capital Territory", label: "Islamabad Capital Territory" },
  { value: "Gilgit-Baltistan", label: "Gilgit-Baltistan" },
  { value: "Azad Jammu and Kashmir", label: "Azad Jammu and Kashmir" },
];

export const COUNTRY_OPTIONS = [
  { value: "Pakistan", label: "Pakistan" },
  { value: "United Arab Emirates", label: "United Arab Emirates" },
  { value: "Saudi Arabia", label: "Saudi Arabia" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "United States", label: "United States" },
  { value: "Canada", label: "Canada" },
];

export const BUSINESS_TYPE_OPTIONS = [
  { value: "Retailer", label: "Retailer" },
  { value: "Wholesaler", label: "Wholesaler" },
  { value: "Manufacturer", label: "Manufacturer" },
  { value: "Distributor", label: "Distributor" },
  { value: "Brand / Direct to Consumer", label: "Brand / Direct to Consumer" },
  { value: "Service Provider", label: "Service Provider" },
];

export const AUTH_ROUTES = {
  login: "/login",
  registerCustomer: "/register",
  registerCompany: "/register/company",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
};
