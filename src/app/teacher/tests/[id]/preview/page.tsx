import React from "react";
import { notFound, redirect } from "next/navigation";
import { requireServerRole } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { TestPreviewView } from "@/components/teacher/TestPreviewView";

export const metadata = {
  title: "Test Preview",
};

export default async function PreviewTestPage({
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
    description: test.description,
    instructions: test.instructions,
    durationMinutes: test.durationMinutes,
    totalMarks: test.totalMarks,
    status: test.status,
    questions: test.questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      marks: q.marks,
      orderIndex: q.orderIndex,
      correctAnswer: q.correctAnswer,
      options: q.options.map((o) => ({
        id: o.id,
        optionKey: o.optionKey,
        optionText: o.optionText,
      })),
    })),
  };

  return <TestPreviewView test={formattedTest} />;
}
