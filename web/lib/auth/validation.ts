import {
  CustomerRegisterData,
  CompanyRegisterData,
  LoginData,
  ForgotPasswordData,
  ResetPasswordData,
} from "./types";
import { PASSWORD_REQUIREMENTS } from "./constants";

export const validateEmail = (email: string): string | null => {
  if (!email || !email.trim()) return "Email address is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return "Please enter a valid email address";
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone || !phone.trim()) return "Phone number is required";
  // Basic validation for phone length
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, "");
  if (cleanPhone.length < 8) return "Please enter a valid phone number";
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return "Password is required";
  for (const req of PASSWORD_REQUIREMENTS) {
    if (!req.regex.test(password)) {
      return `Password must contain ${req.label.toLowerCase()}`;
    }
  }
  return null;
};

export const validatePasswordMatch = (pw: string, confirmPw: string): string | null => {
  if (!confirmPw) return "Please confirm your password";
  if (pw !== confirmPw) return "Passwords do not match";
  return null;
};

export const validateRequired = (value: string | undefined | null, fieldName: string): string | null => {
  if (!value || !value.trim()) return `${fieldName} is required`;
  return null;
};

export const validateLoginForm = (data: LoginData): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  const emailErr = validateEmail(data.email);
  if (emailErr) errors.email = emailErr;

  if (!data.password) {
    errors.password = "Password is required";
  }

  return errors;
};

export const validateCustomerRegistrationForm = (data: CustomerRegisterData): Record<string, string> => {
  const errors: Record<string, string> = {};

  const fnErr = validateRequired(data.first_name, "First name");
  if (fnErr) errors.first_name = fnErr;

  const lnErr = validateRequired(data.last_name, "Last name");
  if (lnErr) errors.last_name = lnErr;

  const emailErr = validateEmail(data.email);
  if (emailErr) errors.email = emailErr;

  const phoneErr = validatePhone(data.phone);
  if (phoneErr) errors.phone = phoneErr;

  const addrErr = validateRequired(data.address_line1, "Address Line 1");
  if (addrErr) errors.address_line1 = addrErr;

  const cityErr = validateRequired(data.city, "City");
  if (cityErr) errors.city = cityErr;

  const provErr = validateRequired(data.province, "Province");
  if (provErr) errors.province = provErr;

  const postErr = validateRequired(data.postal_code, "Postal code");
  if (postErr) errors.postal_code = postErr;

  const countryErr = validateRequired(data.country, "Country");
  if (countryErr) errors.country = countryErr;

  const pwErr = validatePassword(data.password);
  if (pwErr) errors.password = pwErr;

  const matchErr = validatePasswordMatch(data.password, data.confirm_password);
  if (matchErr) errors.confirm_password = matchErr;

  if (!data.terms_accepted) {
    errors.terms_accepted = "You must agree to the Terms of Service and Privacy Policy";
  }

  return errors;
};

export const validateCompanyRegistrationForm = (data: CompanyRegisterData): Record<string, string> => {
  const errors: Record<string, string> = {};

  const bNameErr = validateRequired(data.business_name, "Business name");
  if (bNameErr) errors.business_name = bNameErr;

  const bEmailErr = validateEmail(data.business_email);
  if (bEmailErr) errors.business_email = bEmailErr;

  const bPhoneErr = validatePhone(data.business_phone);
  if (bPhoneErr) errors.business_phone = bPhoneErr;

  const bTypeErr = validateRequired(data.business_type, "Business type");
  if (bTypeErr) errors.business_type = bTypeErr;

  const addrErr = validateRequired(data.address_line1, "Address Line 1");
  if (addrErr) errors.address_line1 = addrErr;

  const cityErr = validateRequired(data.city, "City");
  if (cityErr) errors.city = cityErr;

  const provErr = validateRequired(data.province, "Province");
  if (provErr) errors.province = provErr;

  const postErr = validateRequired(data.postal_code, "Postal code");
  if (postErr) errors.postal_code = postErr;

  const countryErr = validateRequired(data.country, "Country");
  if (countryErr) errors.country = countryErr;

  const fnErr = validateRequired(data.first_name, "First name");
  if (fnErr) errors.first_name = fnErr;

  const lnErr = validateRequired(data.last_name, "Last name");
  if (lnErr) errors.last_name = lnErr;

  const accEmailErr = validateEmail(data.account_email);
  if (accEmailErr) errors.account_email = accEmailErr;

  const accPhoneErr = validatePhone(data.account_phone);
  if (accPhoneErr) errors.account_phone = accPhoneErr;

  const pwErr = validatePassword(data.password);
  if (pwErr) errors.password = pwErr;

  const matchErr = validatePasswordMatch(data.password, data.confirm_password);
  if (matchErr) errors.confirm_password = matchErr;

  if (!data.terms_accepted) {
    errors.terms_accepted = "You must agree to the Terms of Service and Privacy Policy";
  }

  return errors;
};

export const validateForgotPasswordForm = (data: ForgotPasswordData): Record<string, string> => {
  const errors: Record<string, string> = {};
  const emailErr = validateEmail(data.email);
  if (emailErr) errors.email = emailErr;
  return errors;
};

export const validateResetPasswordForm = (data: ResetPasswordData): Record<string, string> => {
  const errors: Record<string, string> = {};
  const pwErr = validatePassword(data.password);
  if (pwErr) errors.password = pwErr;

  const matchErr = validatePasswordMatch(data.password, data.confirm_password);
  if (matchErr) errors.confirm_password = matchErr;

  return errors;
};
