import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> }
) {
  const session = await getServerSession();
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized: Student role required." }, { status: 403 });
  }

  const { attemptId } = await context.params;

  const attempt = await db.testAttempt.findUnique({
    where: { id: attemptId },
    include: { test: true },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }

  if (attempt.studentId !== session.userId) {
    return NextResponse.json({ error: "Forbidden: Attempt does not belong to user." }, { status: 403 });
  }

  // Prevent modifications if attempt is already closed/locked
  if (attempt.status !== "IN_PROGRESS") {
    return NextResponse.json(
      {
        error: `Cannot save answers. Examination attempt is currently ${attempt.status}.`,
        status: attempt.status,
      },
      { status: 400 }
    );
  }

  // Server-side timer expiry check
  const now = new Date();
  const elapsedSeconds = Math.floor((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000);
  const totalDurationSeconds = attempt.test.durationMinutes * 60;

  // Give a 15-second network grace window for in-flight requests
  if (elapsedSeconds > totalDurationSeconds + 15) {
    await db.testAttempt.update({
      where: { id: attempt.id },
      data: { status: "EXPIRED", completedAt: now },
    });

    return NextResponse.json(
      { error: "Examination time has expired. Responses are no longer accepted.", status: "EXPIRED" },
      { status: 400 }
    );
  }

  try {
    const { questionId, answer } = await request.json();

    if (!questionId) {
      return NextResponse.json({ error: "questionId is required." }, { status: 400 });
    }

    const saved = await db.answer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      update: {
        answer: answer !== undefined && answer !== null ? String(answer).trim() : null,
        answeredAt: now,
      },
      create: {
        attemptId,
        questionId,
        answer: answer !== undefined && answer !== null ? String(answer).trim() : null,
        answeredAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      questionId: saved.questionId,
      answeredAt: saved.answeredAt.toISOString(),
    });
  } catch (error) {
    console.error("Save answer error:", error);
    return NextResponse.json({ error: "Failed to save answer." }, { status: 500 });
  }
}
