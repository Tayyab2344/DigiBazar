"use client";

import React from "react";
import Link from "next/link";
import { FileText, Image, Home, ArrowRight } from "lucide-react";

export default function AdminCMSWorkspacePage() {
  const cards = [
    {
      title: "Content Pages",
      description: "Manage static pages (Privacy Policy, Terms of Service, About Us)",
      href: "/admin/cms/pages",
      icon: FileText,
      count: "Static Pages",
    },
    {
      title: "Banners & Hero Sliders",
      description: "Manage homepage hero visual banners, promotional sliders, and placements",
      href: "/admin/cms/banners",
      icon: Image,
      count: "Visual Cards",
    },
    {
      title: "Homepage Builder",
      description: "Manage section order, featured product carousels, and promotional blocks",
      href: "/admin/cms/homepage",
      icon: Home,
      count: "Section Layout",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">CMS Workspace</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Content management, banner positioning, and section-based homepage configuration
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="p-6 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-lg hover:border-[var(--border-secondary)] transition-all space-y-3 group block"
            >
              <div className="w-10 h-10 rounded-md bg-[var(--surface-secondary)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-primary)] group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-foreground)] transition-colors">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:underline flex items-center justify-between">
                  {card.title}
                  <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]" />
                </h3>
                <p className="text-xs text-[var(--text-tertiary)] mt-1 leading-relaxed">{card.description}</p>
              </div>
              <div className="pt-3 border-t border-[var(--border-primary)] text-[11px] font-semibold text-[var(--text-quaternary)] uppercase tracking-wider">
                {card.count}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
