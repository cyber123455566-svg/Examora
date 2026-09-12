import React from "react";
import { notFound, redirect } from "next/navigation";
import { requireServerRole } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { StudentTestContainer } from "@/components/examination/StudentTestContainer";

export const metadata = {
  title: "Examination",
};

export default async function StudentTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireServerRole(["STUDENT"]);
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
    },
  });

  if (!test || test.status !== "PUBLISHED") {
    notFound();
  }

  // Check for the student's latest attempt for this test
  const latestAttempt = await db.testAttempt.findFirst({
    where: {
      testId,
      studentId: session.userId,
    },
    orderBy: { startedAt: "desc" },
    include: {
      answers: true,
    },
  });

  let initialAttempt = null;
  let initialQuestions: any[] = [];
  let initialAnswers: any[] = [];
  let initialRemainingSeconds = 0;

  if (latestAttempt) {
    const now = new Date();
    const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - new Date(latestAttempt.startedAt).getTime()) / 1000));
    const totalDurationSeconds = test.durationMinutes * 60;
    initialRemainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);

    initialAttempt = {
      id: latestAttempt.id,
      testId: latestAttempt.testId,
      status: latestAttempt.status,
      startedAt: latestAttempt.startedAt.toISOString(),
      durationMinutes: test.durationMinutes,
      totalQuestions: test.questions.length,
      totalMarks: test.totalMarks,
      testTitle: test.title,
      testSubject: test.subject,
      score: latestAttempt.score,
      percentage: latestAttempt.percentage,
      submittedAt: latestAttempt.submittedAt ? latestAttempt.submittedAt.toISOString() : null,
      terminatedAt: latestAttempt.terminatedAt ? latestAttempt.terminatedAt.toISOString() : null,
      terminationReason: latestAttempt.terminationReason,
    };

    // If active in progress, load questions without correctAnswer
    if (latestAttempt.status === "IN_PROGRESS") {
      initialQuestions = test.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        marks: q.marks,
        orderIndex: q.orderIndex,
        options: q.options.map((o) => ({
          id: o.id,
          optionKey: o.optionKey,
          optionText: o.optionText,
          orderIndex: o.orderIndex,
        })),
      }));

      initialAnswers = latestAttempt.answers.map((a) => ({
        questionId: a.questionId,
        answer: a.answer,
      }));
    }
  }

  const formattedTest = {
    id: test.id,
    title: test.title,
    subject: test.subject,
    description: test.description,
    instructions: test.instructions,
    durationMinutes: test.durationMinutes,
    totalMarks: test.totalMarks,
    passingPercentage: test.passingPercentage,
    totalQuestions: test.questions.length,
    startAt: test.startAt ? test.startAt.toISOString() : null,
    endAt: test.endAt ? test.endAt.toISOString() : null,
  };

  return (
    <StudentTestContainer
      test={formattedTest}
      initialAttempt={initialAttempt}
      initialQuestions={initialQuestions}
      initialAnswers={initialAnswers}
      initialRemainingSeconds={initialRemainingSeconds}
    />
  );
}
