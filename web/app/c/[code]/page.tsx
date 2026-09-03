"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tag, Loader2, Sparkles } from "lucide-react";

export default function TrackingRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = params?.code as string;
  const [statusText, setStatusText] = useState("Applying promo code...");

  useEffect(() => {
    if (!rawCode) {
      router.push("/");
      return;
    }

    const code = rawCode.trim().toUpperCase();

    const processLink = async () => {
      try {
        // Record tracking click if backend tracking endpoint exists
        await fetch(`/api/v1/c/${code}`, { method: "GET" }).catch(() => null);

        // Store auto-applied coupon in localStorage for Checkout & Store pages
        if (typeof window !== "undefined") {
          localStorage.setItem("digibazar_auto_coupon", code);
        }

        setStatusText(`Promo code ${code} activated! Redirecting to marketplace...`);

        setTimeout(() => {
          router.push(`/search?coupon=${code}`);
        }, 1200);
      } catch (err) {
        console.error("Failed to process tracking link:", err);
        router.push("/search");
      }
    };

    processLink();
  }, [rawCode, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto animate-bounce">
          <Tag className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Special Promotion Link</span>
          </div>
          <h1 className="text-xl font-extrabold text-white">Promo Code {rawCode?.toUpperCase()}</h1>
          <p className="text-xs text-slate-400 font-medium">{statusText}</p>
        </div>

        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          <span>Applying discount to your session...</span>
        </div>
      </div>
    </div>
  );
}
