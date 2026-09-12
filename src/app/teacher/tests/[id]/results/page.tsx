import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireServerRole } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { TeacherResultsTable, TeacherAttemptRow } from "@/components/teacher/TeacherResultsTable";
import { ArrowLeft, BarChart2, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Results",
};

export default async function TestSpecificResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireServerRole(["TEACHER"]);
  const { id: testId } = await params;

  const test = await db.test.findUnique({
    where: { id: testId },
    include: {
      attempts: {
        include: {
          student: true,
          test: true,
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
    notFound();
  }

  const formattedAttempts: TeacherAttemptRow[] = test.attempts.map((a) => ({
    id: a.id,
    testId: test.id,
    testTitle: test.title,
    testSubject: test.subject,
    totalMarks: test.totalMarks,
    passingPercentage: test.passingPercentage,
    studentId: a.student.id,
    studentName: a.student.name,
    studentEmail: a.student.email,
    studentIdNumber: a.student.studentIdNumber,
    startedAt: a.startedAt.toISOString(),
    submittedAt: a.submittedAt ? a.submittedAt.toISOString() : null,
    terminatedAt: a.terminatedAt ? a.terminatedAt.toISOString() : null,
    status: a.status,
    score: a.score,
    percentage: a.percentage,
    isPassed: a.isPassed,
    violationCount: a.violationCount,
    terminationReason: a.terminationReason,
  }));

  return (
    <>
      <DashboardHeader
        title={`${test.title} — Examination Results`}
        subtitle={`${test.subject} • Candidate Performance & Proctoring Roster`}
        role="TEACHER"
        user={session}
      />

      <main className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Navigation & Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href={`/teacher/tests/${test.id}`}
            className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Test Overview
          </Link>

          <div className="flex items-center gap-3">
            <Link href={`/teacher/tests/${test.id}/analytics`}>
              <Button variant="outline" size="sm" leftIcon={<BarChart2 className="w-4 h-4 text-indigo-500" />}>
                View Test Analytics
              </Button>
            </Link>
            <Link href={`/teacher/tests/${test.id}/preview`}>
              <Button variant="outline" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                Preview Examination
              </Button>
            </Link>
          </div>
        </div>

        <TeacherResultsTable
          attempts={formattedAttempts}
          tests={[{ id: test.id, title: test.title }]}
          currentTestId={test.id}
        />
      </main>
    </>
  );
}
