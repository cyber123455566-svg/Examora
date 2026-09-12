import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; questionId: string }> }
) {
  const session = await getServerSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: testId, questionId } = await context.params;

  const test = await db.test.findUnique({
    where: { id: testId },
    select: { teacherId: true },
  });

  if (!test || test.teacherId !== session.userId) {
    return NextResponse.json({ error: "Forbidden: You do not own this test." }, { status: 403 });
  }

  try {
    const sourceQuestion = await db.question.findUnique({
      where: { id: questionId },
      include: {
        options: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!sourceQuestion || sourceQuestion.testId !== testId) {
      return NextResponse.json({ error: "Source question not found." }, { status: 404 });
    }

    // Shift subsequent questions down
    await db.question.updateMany({
      where: {
        testId,
        orderIndex: { gt: sourceQuestion.orderIndex },
      },
      data: {
        orderIndex: { increment: 1 },
      },
    });

    // Create cloned question
    const clonedQuestion = await db.question.create({
      data: {
        testId,
        questionText: `${sourceQuestion.questionText} (Copy)`,
        questionType: sourceQuestion.questionType,
        marks: sourceQuestion.marks,
        orderIndex: sourceQuestion.orderIndex + 1,
        correctAnswer: sourceQuestion.correctAnswer,
        ...(sourceQuestion.options.length > 0 && {
          options: {
            create: sourceQuestion.options.map((opt) => ({
              optionKey: opt.optionKey,
              optionText: opt.optionText,
              orderIndex: opt.orderIndex,
            })),
          },
        }),
      },
      include: {
        options: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    // Recalculate test total marks
    const allQuestions = await db.question.findMany({
      where: { testId },
      select: { marks: true },
    });
    const totalMarks = allQuestions.reduce((sum, q) => sum + q.marks, 0);

    await db.test.update({
      where: { id: testId },
      data: { totalMarks },
    });

    return NextResponse.json({ success: true, question: clonedQuestion }, { status: 201 });
  } catch (error) {
    console.error("Duplicate question error:", error);
    return NextResponse.json({ error: "Failed to duplicate question." }, { status: 500 });
  }
}
