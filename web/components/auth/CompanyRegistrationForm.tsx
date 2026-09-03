"use client";

import React, { useState } from "react";
import { Building2, MapPin, UserCheck, Lock, Globe, Mail } from "lucide-react";
import { AuthInput } from "./AuthInput";
import { PasswordInput } from "./PasswordInput";
import { PhoneInput } from "./PhoneInput";
import { SelectInput } from "./SelectInput";
import { LogoUploader } from "./LogoUploader";
import { PasswordStrength } from "./PasswordStrength";
import { AuthButton } from "./AuthButton";
import { FormError } from "./FormError";
import { FormSuccess } from "./FormSuccess";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { authApi } from "@/lib/api/auth";
import { CompanyRegisterData } from "@/lib/auth/types";
import { PROVINCE_OPTIONS, COUNTRY_OPTIONS, BUSINESS_TYPE_OPTIONS } from "@/lib/auth/constants";
import { validateCompanyRegistrationForm } from "@/lib/auth/validation";

export const CompanyRegistrationForm: React.FC = () => {
  const registerCompany = useAuthStore((state) => state.registerCompany);

  const [formData, setFormData] = useState<CompanyRegisterData>({
    business_name: "",
    business_email: "",
    business_phone: "",
    website: "",
    business_type: "Retailer",
    address_line1: "",
    address_line2: "",
    city: "",
    province: "Punjab",
    postal_code: "",
    country: "Pakistan",
    landmark: "",
    first_name: "",
    last_name: "",
    account_email: "",
    account_phone: "",
    password: "",
    confirm_password: "",
    terms_accepted: false,
    logo_file: null,
    logo_url: "",
  });

  const [bPhoneCountryCode, setBPhoneCountryCode] = useState("+92");
  const [aPhoneCountryCode, setAPhoneCountryCode] = useState("+92");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (
    field: keyof CompanyRegisterData,
    value: string | boolean | File | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleLogoChange = (file: File | null, previewUrl: string | null) => {
    setFormData((prev) => ({
      ...prev,
      logo_file: file,
      logo_url: previewUrl || "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const validationErrors = validateCompanyRegistrationForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    setIsLoading(true);

    try {
      let logoUrl = formData.logo_url;
      if (formData.logo_file) {
        try {
          const uploadRes = await authApi.uploadImage(formData.logo_file);
          logoUrl = uploadRes.url;
        } catch {
          // If image upload fails, proceed without image
        }
      }

      await registerCompany({
        business_name: formData.business_name,
        business_email: formData.business_email,
        business_phone: `${bPhoneCountryCode} ${formData.business_phone}`.trim(),
        business_logo: logoUrl || undefined,
        website: formData.website || undefined,
        business_type: formData.business_type,
        address: {
          address_line_1: formData.address_line1,
          address_line_2: formData.address_line2 || undefined,
          city: formData.city,
          province: formData.province,
          postal_code: formData.postal_code,
          country: formData.country,
          landmark: formData.landmark || undefined,
        },
        owner: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.account_email,
          phone: `${aPhoneCountryCode} ${formData.account_phone}`.trim(),
        },
        password: formData.password,
        confirm_password: formData.confirm_password,
      });

      setIsSuccess(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unable to register company. Please verify your details and try again.";
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <FormSuccess
        title="Company account submitted!"
        description="Your company registration request has been submitted successfully. You can now log into your vendor portal to set up your storefront."
        actionText="Access Vendor Login"
        actionHref="/login"
      />
    );
  }

  return (
    <div className="space-y-5">
      <FormError message={apiError} />

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* SECTION 1: Company Information */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
            <Building2 className="w-4 h-4 text-zinc-900" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Company Information
            </h3>
          </div>

          <LogoUploader onLogoChange={handleLogoChange} error={errors.logo_file} />

          <AuthInput
            label="Business Name"
            name="business_name"
            required
            placeholder="Apex Traders Pvt Ltd"
            value={formData.business_name}
            onChange={(e) => handleChange("business_name", e.target.value)}
            error={errors.business_name}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AuthInput
              label="Business Email"
              name="business_email"
              type="email"
              required
              placeholder="contact@company.com"
              value={formData.business_email}
              onChange={(e) => handleChange("business_email", e.target.value)}
              error={errors.business_email}
              icon={<Mail className="w-4 h-4" />}
            />
            <SelectInput
              label="Business Type"
              name="business_type"
              required
              options={BUSINESS_TYPE_OPTIONS}
              value={formData.business_type}
              onChange={(e) => handleChange("business_type", e.target.value)}
              error={errors.business_type}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PhoneInput
              label="Business Phone"
              name="business_phone"
              required
              countryCode={bPhoneCountryCode}
              onCountryCodeChange={setBPhoneCountryCode}
              value={formData.business_phone}
              onChange={(e) => handleChange("business_phone", e.target.value)}
              error={errors.business_phone}
            />
            <AuthInput
              label="Website (Optional)"
              name="website"
              placeholder="https://www.company.com"
              value={formData.website || ""}
              onChange={(e) => handleChange("website", e.target.value)}
              icon={<Globe className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* SECTION 2: Business Address */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
            <MapPin className="w-4 h-4 text-zinc-900" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Business Address
            </h3>
          </div>

          <AuthInput
            label="Address Line 1"
            name="address_line1"
            required
            placeholder="Commercial Hub, Suite 402"
            value={formData.address_line1}
            onChange={(e) => handleChange("address_line1", e.target.value)}
            error={errors.address_line1}
          />

          <AuthInput
            label="Address Line 2 (Optional)"
            name="address_line2"
            placeholder="Industrial Zone / Area"
            value={formData.address_line2 || ""}
            onChange={(e) => handleChange("address_line2", e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AuthInput
              label="City"
              name="city"
              required
              placeholder="Karachi"
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
              placeholder="75500"
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
            placeholder="Near Commerce Plaza"
            value={formData.landmark || ""}
            onChange={(e) => handleChange("landmark", e.target.value)}
          />
        </div>

        {/* SECTION 3: Account Owner */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
            <UserCheck className="w-4 h-4 text-zinc-900" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Account Owner Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AuthInput
              label="First Name"
              name="first_name"
              required
              placeholder="Sarah"
              value={formData.first_name}
              onChange={(e) => handleChange("first_name", e.target.value)}
              error={errors.first_name}
            />
            <AuthInput
              label="Last Name"
              name="last_name"
              required
              placeholder="Khan"
              value={formData.last_name}
              onChange={(e) => handleChange("last_name", e.target.value)}
              error={errors.last_name}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AuthInput
              label="Account Email"
              name="account_email"
              type="email"
              required
              placeholder="sarah@company.com"
              value={formData.account_email}
              onChange={(e) => handleChange("account_email", e.target.value)}
              error={errors.account_email}
              icon={<Mail className="w-4 h-4" />}
            />
            <PhoneInput
              label="Account Phone"
              name="account_phone"
              required
              countryCode={aPhoneCountryCode}
              onCountryCodeChange={setAPhoneCountryCode}
              value={formData.account_phone}
              onChange={(e) => handleChange("account_phone", e.target.value)}
              error={errors.account_phone}
            />
          </div>
        </div>

        {/* SECTION 4: Security */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
            <Lock className="w-4 h-4 text-zinc-900" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Security Credentials
            </h3>
          </div>

          <PasswordInput
            label="Password"
            name="password"
            required
            placeholder="Create password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            error={errors.password}
          />

          <PasswordStrength password={formData.password} />

          <PasswordInput
            label="Confirm Password"
            name="confirm_password"
            required
            placeholder="Re-enter password"
            value={formData.confirm_password}
            onChange={(e) => handleChange("confirm_password", e.target.value)}
            error={errors.confirm_password}
          />
        </div>

        {/* SECTION 5: Terms Agreement */}
        <div className="pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
            <input
              type="checkbox"
              checked={formData.terms_accepted}
              onChange={(e) => handleChange("terms_accepted", e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded-sm border-slate-300 text-black focus:ring-black"
            />
            <span>
              I agree to the digiBazar Vendor Partner{" "}
              <a href="/terms" className="text-zinc-900 font-medium hover:underline">
                Terms of Service
              </a>{" "}
              and Merchant Policies.
            </span>
          </label>
          {errors.terms_accepted && (
            <p className="text-xs text-red-600 font-medium mt-1">
              {errors.terms_accepted}
            </p>
          )}
        </div>

        <div className="pt-2">
          <AuthButton isLoading={isLoading} loadingText="Creating Company Account...">
            Create Company Account
          </AuthButton>
        </div>
      </form>
    </div>
  );
};
