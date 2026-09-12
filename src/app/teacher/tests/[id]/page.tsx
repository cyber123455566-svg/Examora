import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireServerRole } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import {
  Clock,
  HelpCircle,
  Award,
  ShieldAlert,
  ShieldCheck,
  Edit,
  Eye,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  TrendingUp,
  BarChart2,
} from "lucide-react";

export default async function TeacherTestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireServerRole(["TEACHER"]);
  const { id: testId } = await params;

  const test = await db.test.findUnique({
    where: { id: testId },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
        include: {
          options: {
            orderBy: { orderIndex: "asc" },
          },
        },
      },
      attempts: {
        include: {
          student: true,
          violations: {
            orderBy: { timestamp: "desc" },
          },
        },
        orderBy: { startedAt: "desc" },
      },
    },
  });

  if (!test) {
    notFound();
  }

  // Verify ownership
  if (test.teacherId !== session.userId) {
    redirect("/teacher/dashboard");
  }

  const totalAttempts = test.attempts.length;
  const submittedAttempts = test.attempts.filter((a) => a.status === "SUBMITTED").length;
  const terminatedAttempts = test.attempts.filter((a) => a.status === "TERMINATED").length;
  const totalViolations = test.attempts.reduce((sum, a) => sum + a.violationCount, 0);

  return (
    <>
      <DashboardHeader
        title={test.title}
        subtitle={`${test.subject} • Examination Details & Performance Metrics`}
        role="TEACHER"
        user={session}
      />

      <main className="p-8 space-y-8 max-w-7xl">
        {/* Navigation & Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/teacher/tests"
            className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Examinations
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/teacher/tests/${test.id}/results`}>
              <Button variant="outline" size="sm" leftIcon={<Award className="w-4 h-4 text-emerald-500" />}>
                Results
              </Button>
            </Link>
            <Link href={`/teacher/tests/${test.id}/analytics`}>
              <Button variant="outline" size="sm" leftIcon={<BarChart2 className="w-4 h-4 text-indigo-500" />}>
                Analytics
              </Button>
            </Link>
            <Link href={`/teacher/tests/${test.id}/preview`}>
              <Button variant="outline" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                Preview
              </Button>
            </Link>
            <Link href={`/teacher/tests/${test.id}/edit`}>
              <Button variant="primary" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                Edit Questions
              </Button>
            </Link>
          </div>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-medium">Questions</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {test.questions.length} ({test.totalMarks} pts)
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-medium">Submitted</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {submittedAttempts} / {totalAttempts}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-medium">Terminated</span>
                <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  {terminatedAttempts}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-medium">Violations Logged</span>
                <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  {totalViolations}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 1: Student Attempts Table */}
        <section className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Student Examination Attempts ({totalAttempts})
            </h3>
            <p className="text-xs text-slate-500">
              Complete records of student sessions, scores, and integrity checks
            </p>
          </div>

          {totalAttempts === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-xs text-slate-500">
                No students have taken this examination yet.
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-5">Student</th>
                    <th className="py-3.5 px-4">Timeline</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Score</th>
                    <th className="py-3.5 px-5 text-right">Integrity Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {test.attempts.map((attempt) => {
                    const isTerminated = attempt.status === "TERMINATED";
                    const isSubmitted = attempt.status === "SUBMITTED";

                    return (
                      <tr key={attempt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-4 px-5">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {attempt.student.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {attempt.student.email}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-xs text-slate-500">
                          <div>
                            Started: {new Date(attempt.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div>
                            Date: {new Date(attempt.startedAt).toLocaleDateString()}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <Badge
                            variant={isSubmitted ? "success" : isTerminated ? "danger" : "warning"}
                            size="sm"
                          >
                            {attempt.status}
                          </Badge>
                        </td>

                        <td className="py-4 px-4">
                          {attempt.score !== null ? (
                            <span className="font-bold text-slate-900 dark:text-white">
                              {attempt.score} / {test.totalMarks} ({attempt.percentage}%)
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Pending</span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-right">
                          {isTerminated ? (
                            <div className="inline-flex flex-col items-end">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-950/50 text-rose-300 border border-rose-800">
                                <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span>Terminated — {attempt.terminationReason || "Violation"}</span>
                              </span>
                              <span className="text-[10px] text-rose-400 mt-0.5">
                                {attempt.violationCount} {attempt.violationCount === 1 ? "infraction" : "infractions"}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                              <span>0 Violations (Clean)</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section 2: Questions Roster */}
        <section className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Questions Roster ({test.questions.length})
            </h3>
            <p className="text-xs text-slate-500">
              Configured examination prompts, answer keys, and point allocations
            </p>
          </div>

          <div className="space-y-3">
            {test.questions.map((q, idx) => (
              <div
                key={q.id}
                className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Q{idx + 1}.
                    </span>
                    <Badge variant="indigo" size="sm">
                      {q.questionType.replace("_", " ")}
                    </Badge>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {q.marks} {q.marks === 1 ? "Point" : "Points"}
                  </span>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {q.questionText}
                </p>

                {q.questionType === "MULTIPLE_CHOICE" && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt) => {
                      const isCorrect = q.correctAnswer === opt.optionKey;
                      return (
                        <div
                          key={opt.id}
                          className={`p-2.5 rounded-lg border text-xs flex items-center gap-2.5 ${
                            isCorrect
                              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 font-semibold text-emerald-800 dark:text-emerald-300"
                              : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] ${
                              isCorrect
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {opt.optionKey}
                          </span>
                          <span>{opt.optionText}</span>
                          {isCorrect && (
                            <span className="ml-auto text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                              Correct Key
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.questionType === "TRUE_FALSE" && (
                  <div className="text-xs text-slate-500 pt-1">
                    Correct Answer Key:{" "}
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {q.correctAnswer}
                    </strong>
                  </div>
                )}

                {q.questionType === "SHORT_ANSWER" && (
                  <div className="text-xs text-slate-500 pt-1">
                    Expected Response:{" "}
                    <strong className="text-indigo-600 dark:text-indigo-400">
                      {q.correctAnswer || "Pending manual evaluation"}
                    </strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
