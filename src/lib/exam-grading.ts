export interface QuestionForGrading {
  id: string;
  questionType: string; // MULTIPLE_CHOICE | TRUE_FALSE | SHORT_ANSWER
  marks: number;
  correctAnswer: string;
}

export interface StudentAnswerInput {
  questionId: string;
  answer: string | null;
}

export interface GradedAnswerResult {
  questionId: string;
  answer: string | null;
  isCorrect: boolean | null;
  marksAwarded: number;
  isPendingManual: boolean;
}

export interface ExamGradingResult {
  totalScore: number;
  totalPossibleMarks: number;
  percentage: number;
  isPassed: boolean;
  gradedAnswers: GradedAnswerResult[];
  pendingManualCount: number;
  autoGradedCount: number;
}

/**
 * Server-side grading engine for Examora.
 * Safely evaluates student responses without exposing answer keys to client.
 */
export function gradeExamSubmission(
  questions: QuestionForGrading[],
  answers: StudentAnswerInput[],
  passingPercentage: number = 40.0
): ExamGradingResult {
  const answerMap = new Map<string, string>();
  answers.forEach((a) => {
    if (a.answer !== null && a.answer !== undefined) {
      answerMap.set(a.questionId, a.answer.trim());
    }
  });

  let totalScore = 0;
  let totalPossibleMarks = 0;
  let pendingManualCount = 0;
  let autoGradedCount = 0;

  const gradedAnswers: GradedAnswerResult[] = questions.map((q) => {
    totalPossibleMarks += q.marks;
    const submittedAnswer = answerMap.get(q.id) || null;

    if (q.questionType === "MULTIPLE_CHOICE") {
      autoGradedCount += 1;
      const isCorrect = Boolean(
        submittedAnswer !== null &&
          q.correctAnswer &&
          submittedAnswer.toUpperCase() === q.correctAnswer.trim().toUpperCase()
      );

      const marksAwarded = isCorrect ? q.marks : 0;
      totalScore += marksAwarded;

      return {
        questionId: q.id,
        answer: submittedAnswer,
        isCorrect,
        marksAwarded,
        isPendingManual: false,
      };
    } else if (q.questionType === "TRUE_FALSE") {
      autoGradedCount += 1;
      const isCorrect = Boolean(
        submittedAnswer !== null &&
          q.correctAnswer &&
          submittedAnswer.toUpperCase() === q.correctAnswer.trim().toUpperCase()
      );

      const marksAwarded = isCorrect ? q.marks : 0;
      totalScore += marksAwarded;

      return {
        questionId: q.id,
        answer: submittedAnswer,
        isCorrect,
        marksAwarded,
        isPendingManual: false,
      };
    } else {
      // Short Answer or manual evaluation question
      pendingManualCount += 1;
      return {
        questionId: q.id,
        answer: submittedAnswer,
        isCorrect: null, // Pending evaluation
        marksAwarded: 0,
        isPendingManual: true,
      };
    }
  });

  const percentage =
    totalPossibleMarks > 0
      ? Math.round((totalScore / totalPossibleMarks) * 1000) / 10
      : 0;

  const isPassed = percentage >= passingPercentage;

  return {
    totalScore,
    totalPossibleMarks,
    percentage,
    isPassed,
    gradedAnswers,
    pendingManualCount,
    autoGradedCount,
  };
}

/**
 * Server-side recalculation of an attempt's score after manual evaluations.
 */
export async function recalculateAttemptScore(attemptId: string) {
  const { db } = await import("@/lib/db");

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

  if (!attempt) return null;

  const questions = attempt.test.questions;
  const totalPossibleMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  let totalScore = 0;
  let hasPending = false;

  const answerMap = new Map<string, (typeof attempt.answers)[0]>();
  attempt.answers.forEach((a) => answerMap.set(a.questionId, a));

  for (const q of questions) {
    const a = answerMap.get(q.id);
    if (a) {
      totalScore += a.marksAwarded ?? 0;
      if (q.questionType === "SHORT_ANSWER" && a.evaluationStatus === "PENDING") {
        hasPending = true;
      }
    } else if (q.questionType === "SHORT_ANSWER") {
      hasPending = true;
    }
  }

  const percentage =
    totalPossibleMarks > 0
      ? Math.round((totalScore / totalPossibleMarks) * 1000) / 10
      : 0;

  const isPassed = percentage >= attempt.test.passingPercentage;
  const evaluationStatus = hasPending ? "NEEDS_GRADING" : "COMPLETED";

  const updatedAttempt = await db.testAttempt.update({
    where: { id: attemptId },
    data: {
      score: totalScore,
      percentage,
      isPassed,
      evaluationStatus,
    },
  });

  return {
    attempt: updatedAttempt,
    totalScore,
    totalPossibleMarks,
    percentage,
    isPassed,
    evaluationStatus,
  };
}
