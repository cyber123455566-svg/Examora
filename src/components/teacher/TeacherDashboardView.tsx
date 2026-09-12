"use client";

import React from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { StatsOverview } from "@/components/teacher/StatsOverview";
import { TestManagementTable, ManagedTestItem } from "@/components/teacher/TestManagementTable";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Plus, Sparkles, ShieldAlert, ArrowRight, BookOpen } from "lucide-react";

interface TeacherDashboardViewProps {
  user: {
    id: string;
    name: string;
    email: string;
    department?: string | null;
  };
  tests: ManagedTestItem[];
  stats: {
    totalTests: number;
    draftTests?: number;
    publishedTests: number;
    totalAttempts: number;
    completedAttempts?: number;
    terminatedAttempts?: number;
    averageScore?: number;
  };
  recentAttempts?: {
    id: string;
    studentName: string;
    testTitle: string;
    status: string;
    score: number | null;
    percentage: number | null;
    startedAt: string;
  }[];
}

export const TeacherDashboardView: React.FC<TeacherDashboardViewProps> = ({
  user,
  tests,
  stats,
  recentAttempts = [],
}) => {
  return (
    <>
      <DashboardHeader
        title="Faculty Examination Dashboard"
        subtitle={`Welcome back, ${user.name} • ${user.department || "Faculty of Computer Science"}`}
        role="TEACHER"
        user={user}
      />

      <main className="p-8 space-y-8 max-w-7xl">
        {/* Banner with prominent "Create New Test" Action */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-900/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 max-w-xl z-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Examora Examination Management
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Create & Manage Examination Papers
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Author examination papers with Multiple Choice, True/False, and Short Answer questions. Review student answers, evaluate scores, and inspect proctoring reports.
            </p>
          </div>

          <div className="z-10 shrink-0">
            <Link href="/teacher/tests/create">
              <Button
                size="lg"
                variant="primary"
                leftIcon={<Plus className="w-5 h-5" />}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30 px-6 py-3 cursor-pointer"
              >
                Create New Test
              </Button>
            </Link>
          </div>

          {/* Background decoration */}
          <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Dynamic Database Statistics Overview */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Examination Overview & Student Activity
            </h3>
            {stats.averageScore !== undefined && stats.averageScore > 0 && (
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                Cohort Average Score: {stats.averageScore}%
              </span>
            )}
          </div>
          <StatsOverview
            totalTests={stats.totalTests}
            draftTests={stats.draftTests}
            publishedTests={stats.publishedTests}
            totalAttempts={stats.totalAttempts}
            completedAttempts={stats.completedAttempts}
            terminatedAttempts={stats.terminatedAttempts}
            averageScore={stats.averageScore}
          />
        </section>

        {/* Recent Attempts Section */}
        {recentAttempts.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recent Examination Attempts
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Latest examinee submissions and proctoring activity
                </p>
              </div>
              <Link
                href="/teacher/results"
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
              >
                View All Results <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Test</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Score</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {recentAttempts.map((att) => {
                    const isSubmitted = att.status === "SUBMITTED";
                    const isTerminated = att.status === "TERMINATED";

                    return (
                      <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {att.studentName}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                          {att.testTitle}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              isSubmitted
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                : isTerminated
                                ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                                : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            {att.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          {att.percentage !== null ? `${att.percentage}%` : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/teacher/results/${att.id}`}
                            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                          >
                            View &rarr;
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Recent Tests Table */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Examinations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage, edit questions, preview, or publish examination papers
              </p>
            </div>
            <Link href="/teacher/tests/create">
              <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Paper
              </Button>
            </Link>
          </div>

          <TestManagementTable initialTests={tests} showCreateButton={false} />
        </section>
      </main>
    </>
  );
};
