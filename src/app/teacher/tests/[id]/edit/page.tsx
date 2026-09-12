import React from "react";
import { notFound, redirect } from "next/navigation";
import { requireServerRole } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { QuestionBuilder } from "@/components/teacher/QuestionBuilder";

export default async function EditTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireServerRole(["TEACHER"]);
  const { id } = await params;

  const test = await db.test.findUnique({
    where: { id },
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

  if (!test) {
    notFound();
  }

  // Teacher ownership authorization check
  if (test.teacherId !== session.userId) {
    redirect("/teacher/dashboard");
  }

  const formattedTest = {
    id: test.id,
    title: test.title,
    subject: test.subject,
    status: test.status,
    durationMinutes: test.durationMinutes,
    totalMarks: test.totalMarks,
    passingPercentage: test.passingPercentage,
    questions: test.questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER",
      marks: q.marks,
      correctAnswer: q.correctAnswer,
      options: q.options.map((o) => ({
        id: o.id,
        optionKey: o.optionKey,
        optionText: o.optionText,
        orderIndex: o.orderIndex,
      })),
    })),
  };

  return <QuestionBuilder initialTest={formattedTest} />;
}
