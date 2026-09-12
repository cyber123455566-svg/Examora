import React from "react";
import { requireServerRole } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { TeacherResultsTable, TeacherAttemptRow } from "@/components/teacher/TeacherResultsTable";

export const metadata = {
  title: "Results",
};

export default async function TeacherResultsPage() {
  const session = await requireServerRole(["TEACHER"]);

  // Fetch all attempts for tests authored by this teacher
  const [attempts, teacherTests] = await Promise.all([
    db.testAttempt.findMany({
      where: {
        test: {
          teacherId: session.userId,
        },
      },
      include: {
        test: true,
        student: true,
      },
      orderBy: { startedAt: "desc" },
    }),
    db.test.findMany({
      where: { teacherId: session.userId },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const formattedAttempts: TeacherAttemptRow[] = attempts.map((a) => ({
    id: a.id,
    testId: a.test.id,
    testTitle: a.test.title,
    testSubject: a.test.subject,
    totalMarks: a.test.totalMarks,
    passingPercentage: a.test.passingPercentage,
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
        title="Student Examination Results"
        subtitle="Monitor examinee performance, completion records, and proctoring integrity"
        role="TEACHER"
        user={session}
      />
      <main className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              All Examination Attempts ({attempts.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Filter by student, examination, or proctoring status; review answers; export audit CSVs
            </p>
          </div>
        </div>

        <TeacherResultsTable
          attempts={formattedAttempts}
          tests={teacherTests}
        />
      </main>
    </>
  );
}
