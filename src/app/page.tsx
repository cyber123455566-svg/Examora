import Link from "next/link";
import { ShieldCheck, GraduationCap, UserCheck, ArrowRight, Sparkles, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ExamoraLogo } from "@/components/brand/ExamoraLogo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative selection:bg-indigo-500 selection:text-white">
      {/* Ambient background lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Bar */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-md relative z-10">
        <Link href="/">
          <ExamoraLogo size="md" showTagline={true} />
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="primary" size="sm">
              Sign In to Portal
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center relative z-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-800/80 text-xs text-indigo-300 font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Smart Examination & Assessment Platform • Institutional Role Isolation</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Next-Generation Academic <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-teal-300">
            Online Examination Platform
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
          Examora delivers institutional-grade test management for faculty and secure, proctored testing environments for students with server-enforced role authorization.
        </p>

        {/* Portal Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mt-12 text-left">
          {/* Teacher Portal Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Teacher Portal</h2>
              <Badge variant="indigo" size="sm">Faculty</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Author examinations, manage question banks, review student submissions, and inspect proctoring statistics.
            </p>
            <div className="mt-6">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                Sign in as Faculty <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Student Portal Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Student Portal</h2>
              <Badge variant="success" size="sm">Examinee</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Take scheduled online examinations, view completed test performance, and prepare for proctored sessions.
            </p>
            <div className="mt-6">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
                Sign in as Student <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Security badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Server-side Route Protection</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Strict Role Isolation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Anti-Cheat Ready Architecture</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-5 border-t border-slate-900 text-center text-xs text-slate-600 relative z-10">
        Examora • Smart Examination & Assessment Platform
      </footer>
    </div>
  );
}
