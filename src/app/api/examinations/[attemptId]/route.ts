import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  context: { params: Promise<{ attemptId: string }> }
) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { attemptId } = await context.params;

  const attempt = await db.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: {
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
      },
      answers: true,
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  // Verify access: Student can only view their own attempt; Teachers can view attempts for their tests
  if (session.role === "STUDENT" && attempt.studentId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (session.role === "TEACHER" && attempt.test.teacherId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000));
  const totalDurationSeconds = attempt.test.durationMinutes * 60;
  const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);

  // Strip correct answers for students
  const sanitizedQuestions = attempt.test.questions.map((q) => ({
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

  const savedAnswers = attempt.answers.map((a) => ({
    questionId: a.questionId,
    answer: a.answer,
  }));

  return NextResponse.json({
    attempt: {
      id: attempt.id,
      testId: attempt.testId,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      terminatedAt: attempt.terminatedAt,
      terminationReason: attempt.terminationReason,
      durationMinutes: attempt.test.durationMinutes,
      totalQuestions: attempt.test.questions.length,
      totalMarks: attempt.test.totalMarks,
      testTitle: attempt.test.title,
      testSubject: attempt.test.subject,
      score: attempt.score,
      percentage: attempt.percentage,
      violationCount: attempt.violationCount,
    },
    questions: sanitizedQuestions,
    savedAnswers,
    serverTime: now.toISOString(),
    remainingSeconds,
  });
}
