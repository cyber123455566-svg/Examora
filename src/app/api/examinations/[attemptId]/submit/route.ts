import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { gradeExamSubmission } from "@/lib/exam-grading";

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
    include: {
      test: {
        include: {
          questions: true,
        },
      },
      answers: true,
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }

  if (attempt.studentId !== session.userId) {
    return NextResponse.json({ error: "Forbidden: Attempt does not belong to user." }, { status: 403 });
  }

  // Prevent duplicate submission or submitting a terminated attempt
  if (attempt.status !== "IN_PROGRESS") {
    return NextResponse.json(
      {
        error: `Cannot submit examination. Attempt is already ${attempt.status}.`,
        status: attempt.status,
        score: attempt.score,
        percentage: attempt.percentage,
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { finalAnswers } = body;

    // 1. If client sent final answers buffer, upsert any unsaved answers
    if (Array.isArray(finalAnswers) && finalAnswers.length > 0) {
      for (const item of finalAnswers) {
        if (item.questionId && item.answer !== undefined) {
          await db.answer.upsert({
            where: {
              attemptId_questionId: {
                attemptId,
                questionId: item.questionId,
              },
            },
            update: {
              answer: item.answer !== null ? String(item.answer).trim() : null,
              answeredAt: new Date(),
            },
            create: {
              attemptId,
              questionId: item.questionId,
              answer: item.answer !== null ? String(item.answer).trim() : null,
              answeredAt: new Date(),
            },
          });
        }
      }
    }

    // 2. Query all up-to-date saved answers
    const currentAnswers = await db.answer.findMany({
      where: { attemptId },
    });

    // 3. Grade the submission securely on server
    const grading = gradeExamSubmission(
      attempt.test.questions.map((q) => ({
        id: q.id,
        questionType: q.questionType,
        marks: q.marks,
        correctAnswer: q.correctAnswer,
      })),
      currentAnswers.map((a) => ({
        questionId: a.questionId,
        answer: a.answer,
      })),
      attempt.test.passingPercentage
    );

    // 4. Update individual answers with marks awarded and correctness
    for (const graded of grading.gradedAnswers) {
      await db.answer.updateMany({
        where: {
          attemptId,
          questionId: graded.questionId,
        },
        data: {
          isCorrect: graded.isCorrect,
          marksAwarded: graded.marksAwarded,
          evaluationStatus: graded.isPendingManual ? "PENDING" : "AUTOMATIC",
        },
      });
    }

    const now = new Date();

    // 5. Atomically transition attempt to SUBMITTED
    const updatedAttempt = await db.testAttempt.update({
      where: {
        id: attemptId,
      },
      data: {
        status: "SUBMITTED",
        submittedAt: now,
        completedAt: now,
        score: grading.totalScore,
        percentage: grading.percentage,
        isPassed: grading.isPassed,
        evaluationStatus: grading.pendingManualCount > 0 ? "NEEDS_GRADING" : "COMPLETED",
      },
    });

    const answeredCount = currentAnswers.filter((a) => a.answer && a.answer.trim().length > 0).length;
    const totalQuestionsCount = attempt.test.questions.length;

    return NextResponse.json({
      success: true,
      status: "SUBMITTED",
      submittedAt: now.toISOString(),
      score: grading.totalScore,
      totalMarks: grading.totalPossibleMarks,
      percentage: grading.percentage,
      isPassed: grading.isPassed,
      answeredQuestions: answeredCount,
      totalQuestions: totalQuestionsCount,
      pendingManualCount: grading.pendingManualCount,
    });
  } catch (error) {
    console.error("Submit examination error:", error);
    return NextResponse.json({ error: "Failed to submit examination." }, { status: 500 });
  }
}
