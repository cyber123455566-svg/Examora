import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { validateTestForPublishing } from "@/lib/test-validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await context.params;

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
    return NextResponse.json({ error: "Test not found." }, { status: 404 });
  }

  if (test.teacherId !== session.userId) {
    return NextResponse.json({ error: "Forbidden: You do not own this test." }, { status: 403 });
  }

  // Run publishing validation rules
  const validation = validateTestForPublishing({
    title: test.title,
    subject: test.subject,
    durationMinutes: test.durationMinutes,
    startAt: test.startAt,
    endAt: test.endAt,
    questions: test.questions.map((q) => ({
      id: q.id,
      orderIndex: q.orderIndex,
      questionText: q.questionText,
      questionType: q.questionType,
      marks: q.marks,
      correctAnswer: q.correctAnswer,
      options: q.options.map((o) => ({
        optionKey: o.optionKey,
        optionText: o.optionText,
      })),
    })),
  });

  if (!validation.isValid) {
    return NextResponse.json(
      {
        error: "Cannot publish test.",
        issues: validation.errors,
      },
      { status: 422 }
    );
  }

  // Calculate sum of marks
  const totalCalculatedMarks = test.questions.reduce((acc, curr) => acc + curr.marks, 0);

  const updatedTest = await db.test.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      totalMarks: totalCalculatedMarks,
    },
  });

  return NextResponse.json({
    success: true,
    message: "Examination successfully published and is now ready for students.",
    test: updatedTest,
  });
}
