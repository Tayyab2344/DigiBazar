import React from "react";
import Link from "next/link";
import { Store } from "lucide-react";
import { AuthBranding } from "./AuthBranding";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col lg:flex-row overflow-hidden antialiased">
      {/* Desktop Left Side Branding - Fixed/Sticky to frame (No Scroll) */}
      <div className="hidden lg:block lg:w-[40%] xl:w-[42%] h-screen sticky top-0 shrink-0 overflow-hidden shadow-md z-10">
        <AuthBranding />
      </div>

      {/* Main Content Area - Dedicated Scrollable Right Form Panel */}
      <div className="flex-1 h-screen overflow-y-auto flex flex-col justify-between px-4 py-8 sm:px-6 lg:px-12">
        {/* Mobile Header with Logo */}
        <div className="lg:hidden flex items-center justify-between pb-6 mb-2 border-b border-slate-200">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Commerce<span className="text-blue-600">Hub</span>
            </span>
          </Link>
          <span className="text-xs text-slate-500 font-medium">Marketplace</span>
        </div>

        {/* Center Container for Auth Card */}
        <div className="my-auto py-6 flex justify-center items-center w-full">
          {children}
        </div>

        {/* Mobile / Shared Bottom Footer Disclaimer */}
        <div className="pt-6 pb-2 text-center text-xs text-slate-500 shrink-0">
          <p>© {new Date().getFullYear()} digiBazar. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
