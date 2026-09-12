import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { recalculateAttemptScore } from "@/lib/exam-grading";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  const session = await getServerSession();

  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized. Teacher role required." }, { status: 403 });
  }

  const { attemptId } = await context.params;

  try {
    const body = await request.json();
    const { questionId, marksAwarded, feedback } = body;

    if (!questionId) {
      return NextResponse.json({ error: "questionId is required." }, { status: 400 });
    }

    if (marksAwarded === undefined || marksAwarded === null || typeof marksAwarded !== "number" || isNaN(marksAwarded)) {
      return NextResponse.json({ error: "marksAwarded must be a valid number." }, { status: 400 });
    }

    // 1. Fetch attempt and verify ownership
    const attempt = await db.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Examination attempt not found." }, { status: 404 });
    }

    if (attempt.test.teacherId !== session.userId) {
      return NextResponse.json(
        { error: "Forbidden. You are not the author of this examination." },
        { status: 403 }
      );
    }

    // 2. Verify question belongs to this test
    const question = attempt.test.questions.find((q) => q.id === questionId);
    if (!question) {
      return NextResponse.json(
        { error: "Question does not belong to this examination." },
        { status: 400 }
      );
    }

    // 3. Validate marks range: 0 <= marksAwarded <= question.marks
    if (marksAwarded < 0 || marksAwarded > question.marks) {
      return NextResponse.json(
        {
          error: `Marks awarded must be between 0 and ${question.marks} for this question.`,
        },
        { status: 400 }
      );
    }

    // 4. Save evaluation on Answer
    const isCorrect = marksAwarded === question.marks ? true : marksAwarded > 0 ? true : false;

    const updatedAnswer = await db.answer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      update: {
        marksAwarded,
        isCorrect,
        evaluationStatus: "EVALUATED",
        evaluatedAt: new Date(),
        evaluatedBy: session.userId,
        feedback: feedback ? String(feedback).trim() : null,
      },
      create: {
        attemptId,
        questionId,
        marksAwarded,
        isCorrect,
        evaluationStatus: "EVALUATED",
        evaluatedAt: new Date(),
        evaluatedBy: session.userId,
        feedback: feedback ? String(feedback).trim() : null,
      },
    });

    // 5. Recalculate attempt total score & pass/fail
    const recalc = await recalculateAttemptScore(attemptId);

    return NextResponse.json({
      success: true,
      answer: updatedAnswer,
      attempt: recalc?.attempt,
      score: recalc?.totalScore,
      percentage: recalc?.percentage,
      isPassed: recalc?.isPassed,
      evaluationStatus: recalc?.evaluationStatus,
    });
  } catch (error) {
    console.error("Manual evaluation error:", error);
    return NextResponse.json({ error: "Failed to evaluate question." }, { status: 500 });
  }
}
