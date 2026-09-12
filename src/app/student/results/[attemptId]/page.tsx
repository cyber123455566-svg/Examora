import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireServerRole } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  Calendar,
  HelpCircle,
} from "lucide-react";

export default async function StudentResultDetailPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const session = await requireServerRole(["STUDENT"]);
  const { attemptId } = await params;

  // 1. Fetch attempt and enforce student ownership strictly
  const attempt = await db.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: {
        select: {
          id: true,
          title: true,
          subject: true,
          durationMinutes: true,
          totalMarks: true,
          passingPercentage: true,
          _count: {
            select: { questions: true },
          },
        },
      },
    },
  });

  if (!attempt) {
    notFound();
  }

  // Strictly block other students
  if (attempt.studentId !== session.userId) {
    notFound();
  }

  const isTerminated = attempt.status === "TERMINATED";
  const isSubmitted = attempt.status === "SUBMITTED";
  const isInProgress = attempt.status === "IN_PROGRESS";
  const isExpired = attempt.status === "EXPIRED";

  const isPassed =
    attempt.isPassed !== null && attempt.isPassed !== undefined
      ? attempt.isPassed
      : attempt.percentage !== null
      ? attempt.percentage >= attempt.test.passingPercentage
      : false;

  return (
    <>
      <DashboardHeader
        title="Examination Performance Record"
        subtitle={`Official student report for ${attempt.test.title}`}
        role="STUDENT"
        user={session}
      />

      <main className="p-4 sm:p-8 space-y-6 max-w-4xl mx-auto">
        {/* Navigation */}
        <div>
          <Link
            href="/student/results"
            className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Results
          </Link>
        </div>

        {/* If Terminated */}
        {isTerminated ? (
          <div className="p-8 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-100 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-900/60 border border-rose-700 flex items-center justify-center mx-auto text-rose-400">
              <XCircle className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                EXAMINATION TERMINATED
              </h1>
              <p className="text-sm text-rose-300 max-w-md mx-auto">
                Your attempt was terminated during the examination due to a proctoring policy violation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-900/80 max-w-md mx-auto text-left space-y-2 text-xs">
              <div className="text-rose-400 font-semibold uppercase text-[10px] tracking-wider">
                Termination Reason
              </div>
              <div className="font-medium text-white text-sm">
                {attempt.terminationReason || "Browser window or focus violation"}
              </div>
              <div className="text-rose-400/80 text-[11px] pt-1 border-t border-rose-900/60">
                Timestamp:{" "}
                {attempt.terminatedAt
                  ? new Date(attempt.terminatedAt).toLocaleString()
                  : "Recorded on server"}
              </div>
            </div>

            <p className="text-xs text-rose-400/70 max-w-lg mx-auto">
              Please contact your instructor or examination administrator if you believe this termination occurred in error.
            </p>
          </div>
        ) : (
          /* Normal Submitted / Evaluated Report */
          <div className="space-y-6">
            {/* Header Summary Card */}
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60 shadow-xl text-white relative overflow-hidden">
              <div className="relative z-10 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="indigo" size="sm">
                    {attempt.test.subject}
                  </Badge>
                  <Badge variant={isSubmitted ? "success" : "warning"} size="sm">
                    {attempt.status}
                  </Badge>
                  {attempt.score !== null && (
                    <Badge variant={isPassed ? "success" : "danger"} size="sm" className="font-bold">
                      {isPassed ? "PASS" : "FAIL"}
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {attempt.test.title}
                </h1>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-indigo-900/60 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-medium">
                      Submission Time
                    </span>
                    <span className="font-semibold text-white">
                      {attempt.submittedAt
                        ? new Date(attempt.submittedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "In Progress"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-medium">
                      Date Completed
                    </span>
                    <span className="font-semibold text-white">
                      {new Date(attempt.startedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-medium">
                      Total Questions
                    </span>
                    <span className="font-semibold text-white">
                      {attempt.test._count.questions} Questions
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-medium">
                      Pass Threshold
                    </span>
                    <span className="font-semibold text-white">
                      {attempt.test.passingPercentage}% Required
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Score & Evaluation Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center p-6">
                <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">
                  Marks Awarded
                </div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {attempt.score !== null ? attempt.score : "—"}
                  <span className="text-base font-normal text-slate-400 ml-1">
                    / {attempt.test.totalMarks}
                  </span>
                </div>
              </Card>

              <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center p-6">
                <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">
                  Final Percentage
                </div>
                <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {attempt.percentage !== null ? `${attempt.percentage}%` : "Pending"}
                </div>
              </Card>

              <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center p-6">
                <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">
                  Official Result
                </div>
                <div className="text-2xl font-black mt-1">
                  {attempt.score !== null ? (
                    <span className={isPassed ? "text-emerald-500" : "text-rose-500"}>
                      {isPassed ? "PASSED" : "FAILED"}
                    </span>
                  ) : (
                    <span className="text-amber-500 text-lg">Evaluation Pending</span>
                  )}
                </div>
              </Card>
            </div>

            {/* Privacy & Integrity Statement */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-2">
              <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Verified Academic Submission
              </div>
              <p>
                Your answers were securely logged and recorded. In compliance with institutional examination guidelines, individual question answer keys and instructor notes are retained on the faculty evaluation portal.
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
