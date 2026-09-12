"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { RegisterView } from "@/components/auth/RegisterView";
import { ExamoraLogo } from "@/components/brand/ExamoraLogo";

function RegisterContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role")?.toLowerCase();
  const initialRole = roleParam === "staff" ? "STAFF" : "STUDENT";

  return <RegisterView initialRole={initialRole} />;
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative selection:bg-indigo-500 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/40 backdrop-blur-md relative z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <ExamoraLogo size="md" />
        </Link>

        <div className="flex items-center gap-2">
          <Badge variant="indigo" size="sm" className="hidden sm:inline-flex">
            Smart Examination Portal
          </Badge>
        </div>
      </header>

      {/* Main Registration Container */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10 my-4">
        <div className="w-full max-w-lg">
          <Suspense
            fallback={
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
                <span className="text-xs">Loading registration portal...</span>
              </div>
            }
          >
            <RegisterContent />
          </Suspense>

          <div className="mt-6 text-center text-xs text-slate-500">
            Examora Defense-in-Depth Identity & Role Verification
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-4 border-t border-slate-900 text-center text-xs text-slate-600 relative z-10">
        Examora • Smart Examination & Assessment Platform
      </footer>
    </div>
  );
}
