"use client";

import React from "react";
import { ShieldCheck, Truck, RotateCcw, Headphones, Award } from "lucide-react";

export const MarketplaceBenefits: React.FC = () => {
  const benefits = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
      bg: "bg-blue-50",
      title: "100% Verified Sellers",
      desc: "Shop with peace of mind from audited official brand stores.",
    },
    {
      icon: <Truck className="w-6 h-6 text-emerald-600" />,
      bg: "bg-emerald-50",
      title: "Express Free Delivery",
      desc: "Fast dispatch nationwide on orders above Rs. 3,000.",
    },
    {
      icon: <RotateCcw className="w-6 h-6 text-amber-600" />,
      bg: "bg-amber-50",
      title: "14-Day Easy Returns",
      desc: "Hassle-free replacement or money back guarantee.",
    },
    {
      icon: <Headphones className="w-6 h-6 text-purple-600" />,
      bg: "bg-purple-50",
      title: "24/7 Dedicated Support",
      desc: "Customer experience team ready to assist anytime.",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-12">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>Why Shop on DigiBazar</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Built for Trust, Speed & Simplicity
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-white hover:shadow-md transition-all">
              <div className={`p-3 rounded-2xl ${b.bg} shrink-0`}>{b.icon}</div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 mb-1">{b.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
