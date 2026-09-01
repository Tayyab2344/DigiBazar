"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CompanyShell } from "@/components/company/CompanyShell";
import { UserCheck, Sparkles, Star, TrendingUp, Send } from "lucide-react";

interface InfluencerCard {
  id: string;
  name: string;
  avatar: string;
  platform: string;
  followers: string;
  engagement: string;
  category: string;
}

const INFLUENCERS: InfluencerCard[] = [
  {
    id: "1",
    name: "Ali Raza Tech",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    platform: "Instagram / YouTube",
    followers: "450K",
    engagement: "5.8%",
    category: "Consumer Tech & Electronics",
  },
  {
    id: "2",
    name: "Zara Fashion Hub",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    platform: "Instagram / TikTok",
    followers: "820K",
    engagement: "6.4%",
    category: "Apparel & Lifestyle",
  },
  {
    id: "3",
    name: "Hamza Gadget Reviews",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    platform: "YouTube",
    followers: "1.2M",
    engagement: "8.1%",
    category: "Tech Unboxing",
  },
];

export default function InfluencersPage() {
  return (
    <CompanyShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Influencer Affiliate Marketplace
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Influencer Marketplace</h1>
          <p className="text-xs text-slate-500 mt-1">Partner with verified creators to promote your products for affiliate commissions.</p>
        </div>
        <Link
          href="/company/campaigns"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-2xs"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch Campaign</span>
        </Link>
      </div>

      {/* Influencers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {INFLUENCERS.map((inf) => (
          <div key={inf.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img src={inf.avatar} alt={inf.name} className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm truncate">{inf.name}</h3>
                  <span className="text-[11px] text-purple-600 font-semibold">{inf.platform}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                <div>
                  <span className="block text-slate-400 font-medium text-[10px]">Followers</span>
                  <span className="font-extrabold text-slate-900 text-sm">{inf.followers}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium text-[10px]">Engagement Rate</span>
                  <span className="font-extrabold text-emerald-600 text-sm">{inf.engagement}</span>
                </div>
              </div>

              <span className="inline-block text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                {inf.category}
              </span>
            </div>

            <Link
              href="/company/campaigns"
              className="w-full py-2.5 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Invite to Campaign</span>
            </Link>
          </div>
        ))}
      </div>
    </CompanyShell>
  );
}
