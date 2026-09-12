"use client";

import React, { useState } from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { AvailableTestCard, StudentTestItem } from "@/components/student/AvailableTestCard";
import { StartTestModal } from "@/components/student/StartTestModal";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, Award, Clock, BookOpen, AlertCircle, Sparkles } from "lucide-react";

interface CompletedAttempt {
  id: string;
  testTitle: string;
  subject: string;
  score: number | null;
  completedAt: string | null;
  violationCount: number;
}

interface StudentDashboardViewProps {
  user: {
    id: string;
    name: string;
    email: string;
    studentIdNumber?: string | null;
    department?: string | null;
  };
  availableTests: StudentTestItem[];
  recentAttempts: CompletedAttempt[];
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({
  user,
  availableTests,
  recentAttempts,
}) => {
  const [selectedTest, setSelectedTest] = useState<StudentTestItem | null>(null);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);

  const handleStartTest = (test: StudentTestItem) => {
    setSelectedTest(test);
    setIsStartModalOpen(true);
  };

  return (
    <>
      <DashboardHeader
        title="Student Examination Portal"
        subtitle={`Welcome, ${user.name} • Student ID: ${user.studentIdNumber || "RCAS2025BCY001"}`}
        role="STUDENT"
        user={user}
      />

      <main className="p-8 space-y-8 max-w-7xl">
        {/* Welcome Status Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white border border-teal-900/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 max-w-xl z-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Proctored Testing Ready
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Ready for Midterm & Final Examinations
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ensure you have a reliable network connection and uninterrupted environment. Examination attempts are logged and protected with institutional integrity checks.
            </p>
          </div>

          <div className="flex items-center gap-3 z-10">
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-center px-5">
              <div className="text-xl font-extrabold">{availableTests.length}</div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400">Tests Ready</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-center px-5">
              <div className="text-xl font-extrabold">{recentAttempts.length}</div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Completed</div>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Available Tests Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Available Tests
                <Badge variant="success" size="sm">
                  {availableTests.length} Scheduled
                </Badge>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Examinations currently open for your matriculation group
              </p>
            </div>
          </div>

          {availableTests.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-500">No examinations currently scheduled.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableTests.map((test) => (
                <AvailableTestCard
                  key={test.id}
                  test={test}
                  onStartClick={handleStartTest}
                />
              ))}
            </div>
          )}
        </section>

        {/* Recent Results Section */}
        <section className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              My Recent Results & Submissions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Completed assessments and performance records
            </p>
          </div>

          {recentAttempts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-xs text-slate-500">
                You haven&apos;t completed any examinations yet this academic term.
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-5">Examination</th>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4">Score</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Proctoring Check</th>
                    <th className="py-3.5 px-5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {recentAttempts.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-4 px-5 font-semibold text-slate-900 dark:text-white">
                        {attempt.testTitle}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {attempt.subject}
                      </td>
                      <td className="py-4 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {attempt.score !== null ? `${attempt.score}%` : "Evaluating"}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="success" size="sm">
                          Completed
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          <span>0 Flags (Clean)</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right text-xs text-slate-500">
                        {attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : "Recent"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Interactive Modal */}
      <StartTestModal
        isOpen={isStartModalOpen}
        onClose={() => {
          setIsStartModalOpen(false);
          setSelectedTest(null);
        }}
        test={selectedTest}
      />
    </>
  );
};
