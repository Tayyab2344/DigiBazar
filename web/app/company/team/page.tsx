"use client";

import React, { useState, useEffect } from "react";
import { CompanyShell } from "@/components/company/CompanyShell";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { companyApi } from "@/lib/api/company";
import type { TeamMemberRead } from "@/types/company";
import { Plus, X, Trash2 } from "lucide-react";

export default function TeamPage() {
  const { user } = useAuthStore();
  const [team, setTeam] = useState<TeamMemberRead[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "product_manager" | "order_manager" | "marketing_manager">("manager");

  useEffect(() => {
    async function initTeam() {
      try {
        const profile = await companyApi.getProfile().catch(() => null);
        const ownerNameParts = (user?.first_name || profile?.name || "Store Owner").split(" ");

        const ownerMember: TeamMemberRead = {
          id: user?.id || profile?.owner_id || "1",
          first_name: user?.first_name || ownerNameParts[0] || "Store",
          last_name: user?.last_name || ownerNameParts.slice(1).join(" ") || "Owner",
          email: user?.email || profile?.business_email || "owner@store.com",
          role: "owner",
          status: "active",
          last_active: "Active now",
          created_at: profile?.created_at ? new Date(profile.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        };

        setTeam([ownerMember]);
      } catch (err) {
        console.error("Failed to load team owner info:", err);
      }
    }
    initTeam();
  }, [user]);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const newMember: TeamMemberRead = {
      id: String(Date.now()),
      first_name: email.split("@")[0],
      last_name: "Staff",
      email: email.trim(),
      role,
      status: "invited",
      last_active: "Invitation Pending",
      created_at: new Date().toISOString().split("T")[0],
    };

    setTeam((prev) => [...prev, newMember]);
    setModalOpen(false);
    setEmail("");
  };

  const handleRemove = (id: string) => {
    if (!confirm("Remove staff member access?")) return;
    setTeam((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <CompanyShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team & Role Permissions</h1>
          <p className="text-xs text-slate-500 mt-1">Manage staff members and delegate role permissions for your store.</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-600 transition-colors shadow-2xs"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>Invite Staff Member</span>
        </button>
      </div>

      {/* Team Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold">
                <th className="py-3 px-4">Staff Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {team.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {t.first_name} {t.last_name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{t.email}</td>
                  <td className="py-3 px-4 uppercase font-bold text-amber-700">{t.role.replace("_", " ")}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{t.last_active}</td>
                  <td className="py-3 px-4 text-right">
                    {t.role !== "owner" && (
                      <button
                        onClick={() => handleRemove(t.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Invite Team Member</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Staff Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@store.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role & Scope</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "manager" | "product_manager" | "order_manager" | "marketing_manager")}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500 text-slate-900"
                >
                  <option value="manager">Store Manager (Full Store Control)</option>
                  <option value="product_manager">Product Manager (Catalog & Stock)</option>
                  <option value="order_manager">Order Manager (Fulfillment & Shipping)</option>
                  <option value="marketing_manager">Marketing Manager (Coupons & Campaigns)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black transition-colors shadow-2xs"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CompanyShell>
  );
}
