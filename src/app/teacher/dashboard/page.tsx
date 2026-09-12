import React from "react";
import { requireServerRole } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { TeacherDashboardView } from "@/components/teacher/TeacherDashboardView";

export const metadata = {
  title: "Teacher Dashboard",
};

export default async function TeacherDashboardPage() {
  const session = await requireServerRole(["TEACHER"]);

  // Fetch tests and recent attempts for teacher from DB
  const [rawTests, rawAttempts] = await Promise.all([
    db.test.findMany({
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
    }),
    db.testAttempt.findMany({
      where: {
        test: {
          teacherId: session.userId,
        },
      },
      include: {
        student: true,
        test: true,
      },
      orderBy: { startedAt: "desc" },
      take: 6,
    }),
  ]);

  // Calculate live database statistics
  const totalTests = rawTests.length;
  const draftTests = rawTests.filter((t) => t.status === "DRAFT").length;
  const publishedTests = rawTests.filter((t) => t.status === "PUBLISHED").length;
  const totalAttempts = rawTests.reduce((acc, t) => acc + t._count.attempts, 0);

  const completedAttempts = rawAttempts.filter((a) => a.status === "SUBMITTED").length;
  const terminatedAttempts = rawAttempts.filter((a) => a.status === "TERMINATED").length;

  const validScores = rawAttempts
    .filter((a) => a.percentage !== null && a.percentage !== undefined)
    .map((a) => a.percentage as number);

  const averageScore =
    validScores.length > 0
      ? Math.round((validScores.reduce((sum, s) => sum + s, 0) / validScores.length) * 10) / 10
      : 0;

  const recentAttempts = rawAttempts.map((a) => ({
    id: a.id,
    studentName: a.student.name,
    testTitle: a.test.title,
    status: a.status,
    score: a.score,
    percentage: a.percentage,
    startedAt: a.startedAt.toISOString(),
  }));

  const formattedTests = rawTests.map((t) => ({
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
    <TeacherDashboardView
      user={{
        id: session.userId,
        name: session.name,
        email: session.email,
        department: session.department,
      }}
      tests={formattedTests}
      stats={{
        totalTests,
        draftTests,
        publishedTests,
        totalAttempts,
        completedAttempts,
        terminatedAttempts,
        averageScore,
      }}
      recentAttempts={recentAttempts}
    />
  );
}
