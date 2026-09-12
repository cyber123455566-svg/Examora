import React from "react";
import { requireServerRole } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { StudentDashboardView } from "@/components/student/StudentDashboardView";

export const metadata = {
  title: "Student Dashboard",
};

export default async function StudentDashboardPage() {
  const session = await requireServerRole(["STUDENT"]);

  const now = new Date();

  // Fetch only PUBLISHED tests currently within active availability window
  const publishedTests = await db.test.findMany({
    where: {
      status: "PUBLISHED",
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      ],
    },
    include: {
      _count: {
        select: { questions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch student's past attempts
  const attempts = await db.testAttempt.findMany({
    where: { studentId: session.userId },
    include: { test: true },
    orderBy: { startedAt: "desc" },
  });

  const formattedTests = publishedTests.map((t) => ({
    id: t.id,
    title: t.title,
    subject: t.subject,
    description: t.description,
    durationMinutes: t.durationMinutes,
    totalQuestions: t._count.questions,
    status: t.status,
  }));

  const formattedAttempts = attempts.map((a) => ({
    id: a.id,
    testTitle: a.test.title,
    subject: a.test.subject,
    score: a.score,
    completedAt: a.completedAt ? a.completedAt.toISOString() : null,
    violationCount: a.violationCount,
  }));

  return (
    <StudentDashboardView
      user={{
        id: session.userId,
        name: session.name,
        email: session.email,
        studentIdNumber: session.studentIdNumber,
        department: session.department,
      }}
      availableTests={formattedTests}
      recentAttempts={formattedAttempts}
    />
  );
}
