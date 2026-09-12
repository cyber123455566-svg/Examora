import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();

  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized. Teacher role required." }, { status: 403 });
  }

  const { id: testId } = await context.params;

  try {
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
        attempts: {
          include: {
            student: true,
            answers: true,
          },
        },
      },
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found." }, { status: 404 });
    }

    if (test.teacherId !== session.userId) {
      return NextResponse.json(
        { error: "Forbidden. You do not own this test." },
        { status: 403 }
      );
    }

    const attempts = test.attempts;
    const totalAttempts = attempts.length;
    const uniqueStudents = new Set(attempts.map((a) => a.studentId)).size;
    const completedAttempts = attempts.filter((a) => a.status === "SUBMITTED");
    const inProgressCount = attempts.filter((a) => a.status === "IN_PROGRESS").length;
    const terminatedCount = attempts.filter((a) => a.status === "TERMINATED").length;
    const expiredCount = attempts.filter((a) => a.status === "EXPIRED").length;

    // Scores & percentages of submitted / evaluated attempts
    const validPercentages = attempts
      .filter((a) => a.percentage !== null && a.percentage !== undefined)
      .map((a) => a.percentage as number);

    const averageScore =
      validPercentages.length > 0
        ? Math.round(
            (validPercentages.reduce((sum, p) => sum + p, 0) / validPercentages.length) * 10
          ) / 10
        : 0;

    const highestScore =
      validPercentages.length > 0 ? Math.max(...validPercentages) : 0;

    const lowestScore =
      validPercentages.length > 0 ? Math.min(...validPercentages) : 0;

    const passedCount = validPercentages.filter((p) => p >= test.passingPercentage).length;
    const passRate =
      validPercentages.length > 0
        ? Math.round((passedCount / validPercentages.length) * 1000) / 10
        : 0;

    // Question analytics
    const questionAnalytics = test.questions.map((q, idx) => {
      // Find all answers for this question across all attempts
      const answersForQ = attempts.flatMap((att) =>
        att.answers.filter((ans) => ans.questionId === q.id)
      );

      const answeredCount = answersForQ.filter(
        (a) => a.answer !== null && a.answer !== undefined && a.answer.trim().length > 0
      ).length;

      const correctCount = answersForQ.filter((a) => a.isCorrect === true).length;
      const incorrectCount = answersForQ.filter((a) => a.isCorrect === false).length;
      const unansweredCount = totalAttempts - answeredCount;

      const correctRate =
        answeredCount > 0
          ? Math.round((correctCount / answeredCount) * 1000) / 10
          : 0;

      const totalMarksAwarded = answersForQ.reduce(
        (sum, a) => sum + (a.marksAwarded || 0),
        0
      );
      const averageMarks =
        answeredCount > 0
          ? Math.round((totalMarksAwarded / answeredCount) * 10) / 10
          : 0;

      return {
        questionId: q.id,
        questionNumber: idx + 1,
        questionText: q.questionText,
        questionType: q.questionType,
        marks: q.marks,
        correctAnswer: q.correctAnswer,
        totalAnswered: answeredCount,
        totalCorrect: correctCount,
        totalIncorrect: incorrectCount,
        totalUnanswered: Math.max(0, unansweredCount),
        correctRate,
        averageMarks,
      };
    });

    return NextResponse.json({
      test: {
        id: test.id,
        title: test.title,
        subject: test.subject,
        durationMinutes: test.durationMinutes,
        totalMarks: test.totalMarks,
        passingPercentage: test.passingPercentage,
      },
      summary: {
        totalStudents: uniqueStudents,
        totalAttempts,
        completed: completedAttempts.length,
        inProgress: inProgressCount,
        terminated: terminatedCount,
        expired: expiredCount,
        averageScore,
        highestScore,
        lowestScore,
        passRate,
      },
      questions: questionAnalytics,
    });
  } catch (error) {
    console.error("Test analytics error:", error);
    return NextResponse.json({ error: "Failed to load test analytics." }, { status: 500 });
  }
}
