"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CompanyShell } from "@/components/company/CompanyShell";
import { companyApi } from "@/lib/api/company";
import type { CompanyProfileRead } from "@/types/company";
import { Store, Save, Globe, Mail, Phone, MapPin, ExternalLink, Instagram, Facebook, Youtube } from "lucide-react";

export default function StoreProfilePage() {
  const [profile, setProfile] = useState<CompanyProfileRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await companyApi.getProfile();
      setProfile(data);
      setName(data.name || "");
      setDescription(data.description || "");
      setBusinessEmail(data.business_email || "");
      setPhone(data.phone || "");
      setAddress(data.address || "");
      setCity(data.city || "");
    } catch (err) {
      console.error("Failed to load store profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await companyApi.updateProfile({
        name,
        description,
        business_email: businessEmail,
        phone,
        address,
        city,
      });
      alert("Store profile updated successfully!");
      loadProfile();
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CompanyShell>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Store Profile & Branding</h1>
            <p className="text-xs text-slate-500 mt-1">Manage public storefront profile details, bio, and business contact info.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <span>Preview Public Store</span>
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-600 transition-colors shadow-2xs disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-slate-950" />
              <span>{saving ? "Saving…" : "Save Changes"}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 cols): Main Profile Form */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Store Branding</h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Store Display Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Store Description / Bio</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell buyers about your company, store mission, and product quality guarantees..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Business Information</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Business Email</label>
                  <input
                    type="email"
                    required
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Main Boulevard, DHA Phase 6"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lahore"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1 col): Storefront Live Preview Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Public Store Card</h2>

            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                {profile?.logo_url ? (
                  <img src={profile.logo_url} alt={name} className="w-10 h-10 rounded-lg object-cover border border-slate-700" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                    {name ? name.charAt(0).toUpperCase() : "T"}
                  </div>
                )}
                <div>
                  <span className="block font-bold text-sm text-white">{name || "TechStore Official"}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Verified Merchant</span>
                </div>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
                {description || "No store description provided yet."}
              </p>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>{businessEmail || "support@store.com"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>{phone || "+92 300 1234567"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </CompanyShell>
  );
}
