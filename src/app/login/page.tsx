"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight, GraduationCap, UserCheck, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ExamoraLogo } from "@/components/brand/ExamoraLogo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");
  const isJustRegistered = searchParams.get("registered") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = "Please enter your academic email address.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email format.";
    }
    if (!password) {
      errors.password = "Please enter your password.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed. Please verify your credentials.");
        return;
      }

      // Role-based redirection
      if (
        redirectTarget &&
        ((data.user.role === "TEACHER" && redirectTarget.startsWith("/teacher")) ||
          (data.user.role === "STUDENT" && redirectTarget.startsWith("/student")))
      ) {
        router.push(redirectTarget);
      } else {
        router.push(data.redirectUrl);
      }
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("Network connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setFieldErrors({});
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-xl">
      <div className="flex flex-col items-center text-center mb-6">
        <ExamoraLogo size="lg" showTagline={true} className="flex-col !gap-2 items-center text-center" textClassName="text-center" />
        <h2 className="text-xl font-bold tracking-tight text-white mt-4">
          Sign In
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Access your examination schedule, results, and proctored sessions
        </p>
      </div>

      {/* Registration Success Banner */}
      {isJustRegistered && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">Registration successful. Please sign in with your credentials.</div>
        </div>
      )}

      {/* Error Alert State */}
      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="Academic Email"
          type="email"
          placeholder="name@examora.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
          disabled={isLoading}
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          leftIcon={<Lock className="w-4 h-4" />}
          autoComplete="current-password"
          disabled={isLoading}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-semibold shadow-md"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In to Examora
          </Button>
        </div>

        <div className="text-center pt-3">
          <p className="text-xs text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 transition-colors cursor-pointer"
            >
              Register
            </Link>
          </p>
        </div>
      </form>

      {/* Quick Demo Switcher for fast evaluation */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
          1-Click Demo Login (Pre-seeded Accounts)
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleQuickFill("teacher@securetest.edu", "TeacherPass123!")}
            className="p-2.5 rounded-xl border border-slate-800 hover:border-indigo-500/60 bg-slate-950/50 hover:bg-indigo-950/20 text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 group-hover:text-indigo-200">
              <GraduationCap className="w-3.5 h-3.5" />
              Teacher
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">Dr. Sarah Jenkins</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill("student@securetest.edu", "StudentPass123!")}
            className="p-2.5 rounded-xl border border-slate-800 hover:border-emerald-500/60 bg-slate-950/50 hover:bg-emerald-950/20 text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 group-hover:text-emerald-200">
              <UserCheck className="w-3.5 h-3.5" />
              Student
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">Alex Morgan</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative selection:bg-indigo-500 selection:text-white">
      {/* Subtle Background Glow Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/40 backdrop-blur-md relative z-10">
        <Link href="/" className="flex items-center gap-3">
          <ExamoraLogo size="md" />
        </Link>

        <div className="flex items-center gap-2">
          <Badge variant="indigo" size="sm" className="hidden sm:inline-flex">
            Smart Examination Portal
          </Badge>
        </div>
      </header>

      {/* Main Login Form Container wrapped in Suspense */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          <Suspense
            fallback={
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
                <span className="text-xs">Loading authentication portal...</span>
              </div>
            }
          >
            <LoginForm />
          </Suspense>

          <div className="mt-6 text-center text-xs text-slate-500">
            Protected by Examora Defense-in-Depth Proctoring Architecture
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
