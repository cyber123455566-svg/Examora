import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireServerRole } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Award,
  AlertTriangle,
  HelpCircle,
  Eye,
  FileText,
} from "lucide-react";

export default async function TestAnalyticsPage({
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
          answers: true,
        },
      },
    },
  });

  if (!test) {
    notFound();
  }

  // Verify ownership
  if (test.teacherId !== session.userId) {
    notFound();
  }

  const attempts = test.attempts;
  const totalAttempts = attempts.length;
  const uniqueStudents = new Set(attempts.map((a) => a.studentId)).size;
  const completedCount = attempts.filter((a) => a.status === "SUBMITTED").length;
  const inProgressCount = attempts.filter((a) => a.status === "IN_PROGRESS").length;
  const terminatedCount = attempts.filter((a) => a.status === "TERMINATED").length;

  const validPercentages = attempts
    .filter((a) => a.percentage !== null && a.percentage !== undefined)
    .map((a) => a.percentage as number);

  const averageScore =
    validPercentages.length > 0
      ? Math.round(
          (validPercentages.reduce((sum, p) => sum + p, 0) / validPercentages.length) * 10
        ) / 10
      : 0;

  const highestScore = validPercentages.length > 0 ? Math.max(...validPercentages) : 0;
  const lowestScore = validPercentages.length > 0 ? Math.min(...validPercentages) : 0;

  const passedCount = validPercentages.filter((p) => p >= test.passingPercentage).length;
  const passRate =
    validPercentages.length > 0
      ? Math.round((passedCount / validPercentages.length) * 1000) / 10
      : 0;

  // Question Analytics Breakdown
  const questionAnalytics = test.questions.map((q, idx) => {
    const answersForQ = attempts.flatMap((att) =>
      att.answers.filter((ans) => ans.questionId === q.id)
    );

    const answeredCount = answersForQ.filter(
      (a) => a.answer !== null && a.answer !== undefined && a.answer.trim().length > 0
    ).length;

    const correctCount = answersForQ.filter((a) => a.isCorrect === true).length;
    const incorrectCount = answersForQ.filter((a) => a.isCorrect === false).length;
    const unansweredCount = Math.max(0, totalAttempts - answeredCount);

    const correctRate =
      answeredCount > 0
        ? Math.round((correctCount / answeredCount) * 1000) / 10
        : 0;

    const totalMarksAwarded = answersForQ.reduce(
      (sum, a) => sum + (a.marksAwarded || 0),
      0
    );
    const averageMarks =
      answeredCount > 0
        ? Math.round((totalMarksAwarded / answeredCount) * 10) / 10
        : 0;

    return {
      id: q.id,
      number: idx + 1,
      text: q.questionText,
      type: q.questionType,
      marks: q.marks,
      answeredCount,
      correctCount,
      incorrectCount,
      unansweredCount,
      correctRate,
      averageMarks,
    };
  });

  return (
    <>
      <DashboardHeader
        title={`${test.title} — Analytics & Performance`}
        subtitle={`${test.subject} • Candidate Metrics & Question Item Analysis`}
        role="TEACHER"
        user={session}
      />

      <main className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Navigation & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href={`/teacher/tests/${test.id}`}
            className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Examination Overview
          </Link>

          <div className="flex items-center gap-3">
            <Link href={`/teacher/tests/${test.id}/results`}>
              <Button variant="outline" size="sm" leftIcon={<FileText className="w-4 h-4" />}>
                View All Student Attempts
              </Button>
            </Link>
          </div>
        </div>

        {/* Aggregate Test Analytics Cards */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Examination Cohort Metrics
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Students */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <CardContent className="p-5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Total Students</span>
                  <Users className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {uniqueStudents}
                </div>
                <div className="text-[11px] text-slate-400">
                  {totalAttempts} total attempts recorded
                </div>
              </CardContent>
            </Card>

            {/* Completed */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <CardContent className="p-5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Completed</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {completedCount}
                </div>
                <div className="text-[11px] text-slate-400">
                  Successfully submitted
                </div>
              </CardContent>
            </Card>

            {/* In Progress */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <CardContent className="p-5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">In Progress</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                  {inProgressCount}
                </div>
                <div className="text-[11px] text-slate-400">
                  Active in examination room
                </div>
              </CardContent>
            </Card>

            {/* Terminated */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <CardContent className="p-5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Terminated</span>
                  <XCircle className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                  {terminatedCount}
                </div>
                <div className="text-[11px] text-slate-400">
                  Locked due to proctoring infractions
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {/* Average Score */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <CardContent className="p-5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Average Score</span>
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {averageScore}%
                </div>
                <div className="text-[11px] text-slate-400">
                  Mean across completed papers
                </div>
              </CardContent>
            </Card>

            {/* Highest Score */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <CardContent className="p-5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Highest Score</span>
                  <Award className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {highestScore}%
                </div>
                <div className="text-[11px] text-slate-400">
                  Top performing student
                </div>
              </CardContent>
            </Card>

            {/* Lowest Score */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <CardContent className="p-5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Lowest Score</span>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-200">
                  {lowestScore}%
                </div>
                <div className="text-[11px] text-slate-400">
                  Minimum submitted score
                </div>
              </CardContent>
            </Card>

            {/* Pass Rate */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <CardContent className="p-5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Pass Rate</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {passRate}%
                </div>
                <div className="text-[11px] text-slate-400">
                  Threshold: &ge; {test.passingPercentage}%
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Question Item Analysis Breakdown */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Question Item Analysis ({test.questions.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluate difficulty indices, student response rates, and average mark yields per question
            </p>
          </div>

          {questionAnalytics.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-500">No questions configured for this test.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questionAnalytics.map((qa) => (
                <Card
                  key={qa.id}
                  className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
                >
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold">
                          {qa.number}
                        </span>
                        <Badge variant="indigo" size="sm">
                          {qa.type}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {qa.marks} {qa.marks === 1 ? "Mark" : "Marks"}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-medium block">
                          Correct Rate
                        </span>
                        <span
                          className={`text-sm font-extrabold ${
                            qa.correctRate >= 70
                              ? "text-emerald-600 dark:text-emerald-400"
                              : qa.correctRate >= 40
                              ? "text-amber-500"
                              : "text-rose-500"
                          }`}
                        >
                          {qa.correctRate}%
                        </span>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2 line-clamp-2">
                      {qa.text}
                    </p>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
                        <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">
                          Correct
                        </span>
                        <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                          {qa.correctCount}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50">
                        <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 block">
                          Incorrect
                        </span>
                        <span className="text-sm font-bold text-rose-800 dark:text-rose-300">
                          {qa.incorrectCount}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Unanswered
                        </span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {qa.unansweredCount}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
                      <span>
                        Students Answered: <strong className="text-slate-700 dark:text-slate-200">{qa.answeredCount}</strong>
                      </span>
                      <span>
                        Avg Marks: <strong className="text-slate-700 dark:text-slate-200">{qa.averageMarks} / {qa.marks}</strong>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
