import React from "react";
import { requireServerRole } from "@/lib/server-auth";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { User, Mail, Building, ShieldCheck, KeyRound } from "lucide-react";

export default async function TeacherProfilePage() {
  const session = await requireServerRole(["TEACHER"]);

  return (
    <>
      <DashboardHeader
        title="Faculty Profile"
        subtitle="Manage your academic credentials and system authentication settings"
        role="TEACHER"
        user={session}
      />
      <main className="p-8 max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Academic Staff Information</CardTitle>
                <CardDescription>Verified academic account details</CardDescription>
              </div>
              <Badge variant="indigo">Verified Faculty</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <User className="w-3.5 h-3.5" /> Full Name
                </div>
                <div className="font-semibold text-slate-900 dark:text-white">{session.name}</div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <Mail className="w-3.5 h-3.5" /> Academic Email
                </div>
                <div className="font-semibold text-slate-900 dark:text-white">{session.email}</div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <Building className="w-3.5 h-3.5" /> Department
                </div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  {session.department || "Computer Science & Engineering"}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <KeyRound className="w-3.5 h-3.5" /> System Role
                </div>
                <div className="font-semibold text-indigo-600 dark:text-indigo-400">
                  TEACHER (Exam Administrator)
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>
                Account authenticated via encrypted HTTP-only session. Passwords stored using bcrypt with 10 salt rounds.
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
