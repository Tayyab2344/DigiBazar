"use client";

import React, { useState } from "react";
import { Mail, User as UserIcon, MapPin, Lock } from "lucide-react";
import { AuthInput } from "./AuthInput";
import { PasswordInput } from "./PasswordInput";
import { PhoneInput } from "./PhoneInput";
import { SelectInput } from "./SelectInput";
import { PasswordStrength } from "./PasswordStrength";
import { AuthButton } from "./AuthButton";
import { FormError } from "./FormError";
import { FormSuccess } from "./FormSuccess";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { CustomerRegisterData } from "@/lib/auth/types";
import { PROVINCE_OPTIONS, COUNTRY_OPTIONS } from "@/lib/auth/constants";
import { validateCustomerRegistrationForm } from "@/lib/auth/validation";

export const CustomerRegistrationForm: React.FC = () => {
  const registerCustomer = useAuthStore((state) => state.registerCustomer);

  const [formData, setFormData] = useState<CustomerRegisterData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    province: "Punjab",
    postal_code: "",
    country: "Pakistan",
    landmark: "",
    password: "",
    confirm_password: "",
    terms_accepted: false,
  });

  const [countryCode, setCountryCode] = useState("+92");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (field: keyof CustomerRegisterData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const validationErrors = validateCustomerRegistrationForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    setIsLoading(true);

    try {
      await registerCustomer({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: `${countryCode} ${formData.phone}`.trim(),
        password: formData.password,
        confirm_password: formData.confirm_password,
        address: {
          address_line_1: formData.address_line1,
          address_line_2: formData.address_line2 || undefined,
          city: formData.city,
          province: formData.province,
          postal_code: formData.postal_code,
          country: formData.country,
          landmark: formData.landmark || undefined,
        },
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unable to create your account. Please check your details and try again.";
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <FormSuccess
        title="Account created successfully"
        description="Your digiBazar customer account is ready. You can now log in and start shopping from top verified vendors."
        actionText="Sign In to Your Account"
        actionHref="/login"
      />
    );
  }

  return (
    <div className="space-y-5">
      <FormError message={apiError} />

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* SECTION 1: Personal Information */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
            <UserIcon className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Personal Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AuthInput
              label="First Name"
              name="first_name"
              required
              placeholder="John"
              value={formData.first_name}
              onChange={(e) => handleChange("first_name", e.target.value)}
              error={errors.first_name}
            />
            <AuthInput
              label="Last Name"
              name="last_name"
              required
              placeholder="Doe"
              value={formData.last_name}
              onChange={(e) => handleChange("last_name", e.target.value)}
              error={errors.last_name}
            />
          </div>

          <AuthInput
            label="Email Address"
            name="email"
            type="email"
            required
            placeholder="john.doe@example.com"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            error={errors.email}
            icon={<Mail className="w-4 h-4" />}
          />

          <PhoneInput
            label="Phone Number"
            name="phone"
            required
            countryCode={countryCode}
            onCountryCodeChange={setCountryCode}
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            error={errors.phone}
          />
        </div>

        {/* SECTION 2: Delivery Address */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
            <MapPin className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Delivery Address
            </h3>
          </div>

          <AuthInput
            label="Address Line 1"
            name="address_line1"
            required
            placeholder="Street address, P.O. box, building"
            value={formData.address_line1}
            onChange={(e) => handleChange("address_line1", e.target.value)}
            error={errors.address_line1}
          />

          <AuthInput
            label="Address Line 2 (Optional)"
            name="address_line2"
            placeholder="Apartment, suite, unit, floor"
            value={formData.address_line2 || ""}
            onChange={(e) => handleChange("address_line2", e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AuthInput
              label="City"
              name="city"
              required
              placeholder="Lahore"
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              error={errors.city}
            />
            <SelectInput
              label="Province"
              name="province"
              required
              options={PROVINCE_OPTIONS}
              value={formData.province}
              onChange={(e) => handleChange("province", e.target.value)}
              error={errors.province}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AuthInput
              label="Postal Code"
              name="postal_code"
              required
              placeholder="54000"
              value={formData.postal_code}
              onChange={(e) => handleChange("postal_code", e.target.value)}
              error={errors.postal_code}
            />
            <SelectInput
              label="Country"
              name="country"
              required
              options={COUNTRY_OPTIONS}
              value={formData.country}
              onChange={(e) => handleChange("country", e.target.value)}
              error={errors.country}
            />
          </div>

          <AuthInput
            label="Landmark (Optional)"
            name="landmark"
            placeholder="Near Main Market or Plaza"
            value={formData.landmark || ""}
            onChange={(e) => handleChange("landmark", e.target.value)}
          />
        </div>

        {/* SECTION 3: Account Security */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
            <Lock className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Account Security
            </h3>
          </div>

          <PasswordInput
            label="Password"
            name="password"
            required
            placeholder="Create a password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            error={errors.password}
          />

          <PasswordStrength password={formData.password} />

          <PasswordInput
            label="Confirm Password"
            name="confirm_password"
            required
            placeholder="Re-enter your password"
            value={formData.confirm_password}
            onChange={(e) => handleChange("confirm_password", e.target.value)}
            error={errors.confirm_password}
          />
        </div>

        {/* SECTION 4: Terms & Agreement */}
        <div className="pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
            <input
              type="checkbox"
              checked={formData.terms_accepted}
              onChange={(e) => handleChange("terms_accepted", e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>
              I agree to the digiBazar{" "}
              <a href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
              .
            </span>
          </label>
          {errors.terms_accepted && (
            <p className="text-xs text-red-600 font-medium mt-1">
              {errors.terms_accepted}
            </p>
          )}
        </div>

        <div className="pt-2">
          <AuthButton isLoading={isLoading} loadingText="Creating Account...">
            Create Account
          </AuthButton>
        </div>
      </form>
    </div>
  );
};
