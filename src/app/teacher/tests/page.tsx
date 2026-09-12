import React from "react";
import { requireServerRole } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { TestManagementTable } from "@/components/teacher/TestManagementTable";

export const metadata = {
  title: "Tests",
};

export default async function TeacherTestsPage() {
  const session = await requireServerRole(["TEACHER"]);

  const tests = await db.test.findMany({
    where: { teacherId: session.userId },
    include: {
      _count: {
        select: {
          questions: true,
          attempts: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedTests = tests.map((t) => ({
    id: t.id,
    title: t.title,
    subject: t.subject,
    durationMinutes: t.durationMinutes,
    totalMarks: t.totalMarks,
    totalQuestions: t._count.questions,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    startAt: t.startAt ? t.startAt.toISOString() : null,
    endAt: t.endAt ? t.endAt.toISOString() : null,
    attemptsCount: t._count.attempts,
  }));

  return (
    <>
      <DashboardHeader
        title="Examination Management"
        subtitle="View, configure, publish, and manage all your institutional examination papers"
        role="TEACHER"
        user={session}
      />
      <main className="p-8 space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              All Examination Papers ({formattedTests.length})
            </h2>
            <p className="text-xs text-slate-500">
              Filter by status or search across course subjects
            </p>
          </div>
        </div>

        <TestManagementTable initialTests={formattedTests} showCreateButton={true} />
      </main>
    </>
  );
}
