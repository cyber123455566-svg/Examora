import React from "react";
import { notFound } from "next/navigation";
import { requireServerRole } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { AttemptReviewView, ReviewAttemptData } from "@/components/teacher/AttemptReviewView";

export default async function TeacherAttemptDetailPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const session = await requireServerRole(["TEACHER"]);
  const { attemptId } = await params;

  const attempt = await db.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      student: true,
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
      violations: {
        orderBy: { timestamp: "asc" },
      },
      answers: true,
    },
  });

  if (!attempt) {
    notFound();
  }

  // Strictly enforce teacher ownership
  if (attempt.test.teacherId !== session.userId) {
    notFound();
  }

  const answerMap = new Map<string, (typeof attempt.answers)[0]>();
  attempt.answers.forEach((a) => answerMap.set(a.questionId, a));

  const questions = attempt.test.questions.map((q, idx) => {
    const a = answerMap.get(q.id);
    return {
      id: q.id,
      questionNumber: idx + 1,
      questionText: q.questionText,
      questionType: q.questionType,
      marks: q.marks,
      correctAnswer: q.correctAnswer,
      options: q.options.map((opt) => ({
        optionKey: opt.optionKey,
        optionText: opt.optionText,
      })),
      studentAnswer: a?.answer || null,
      marksAwarded: a?.marksAwarded ?? 0,
      isCorrect: a?.isCorrect ?? null,
      evaluationStatus:
        a?.evaluationStatus ||
        (q.questionType === "SHORT_ANSWER" ? "PENDING" : "AUTOMATIC"),
      feedback: a?.feedback || null,
    };
  });

  const reviewData: ReviewAttemptData = {
    id: attempt.id,
    status: attempt.status,
    startedAt: attempt.startedAt.toISOString(),
    submittedAt: attempt.submittedAt ? attempt.submittedAt.toISOString() : null,
    terminatedAt: attempt.terminatedAt ? attempt.terminatedAt.toISOString() : null,
    terminationReason: attempt.terminationReason,
    score: attempt.score,
    percentage: attempt.percentage,
    isPassed: attempt.isPassed,
    evaluationStatus: attempt.evaluationStatus,
    student: {
      name: attempt.student.name,
      email: attempt.student.email,
      studentIdNumber: attempt.student.studentIdNumber,
    },
    test: {
      id: attempt.test.id,
      title: attempt.test.title,
      subject: attempt.test.subject,
      durationMinutes: attempt.test.durationMinutes,
      totalMarks: attempt.test.totalMarks,
      passingPercentage: attempt.test.passingPercentage,
      totalQuestions: attempt.test.questions.length,
    },
    violations: attempt.violations.map((v) => ({
      id: v.id,
      violationType: v.violationType,
      timestamp: v.timestamp.toISOString(),
      metadata: v.metadata,
    })),
    questions,
  };

  return (
    <AttemptReviewView
      initialData={reviewData}
      currentUser={{
        id: session.userId,
        name: session.name,
        email: session.email,
      }}
    />
  );
}
