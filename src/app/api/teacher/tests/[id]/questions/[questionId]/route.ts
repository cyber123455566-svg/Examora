import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function PUT(
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
    const body = await request.json();
    const {
      questionText,
      questionType,
      marks,
      correctAnswer,
      options,
    } = body;

    const parsedMarks = Math.max(1, parseInt(marks, 10) || 1);

    // Update question
    const updated = await db.question.update({
      where: { id: questionId },
      data: {
        ...(questionText !== undefined && { questionText: questionText.trim() }),
        ...(questionType !== undefined && { questionType }),
        ...(marks !== undefined && { marks: parsedMarks }),
        ...(correctAnswer !== undefined && { correctAnswer: correctAnswer.trim() }),
      },
    });

    // If options are provided for MULTIPLE_CHOICE, replace options
    if (questionType === "MULTIPLE_CHOICE" && Array.isArray(options)) {
      await db.questionOption.deleteMany({
        where: { questionId },
      });

      await db.questionOption.createMany({
        data: options.map((opt: any, idx: number) => ({
          questionId,
          optionKey: opt.optionKey || String.fromCharCode(65 + idx),
          optionText: opt.optionText?.trim() || "",
          orderIndex: idx,
        })),
      });
    } else if (questionType !== "MULTIPLE_CHOICE") {
      // Remove any leftover options if type changed
      await db.questionOption.deleteMany({
        where: { questionId },
      });
    }

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

    const fullQuestion = await db.question.findUnique({
      where: { id: questionId },
      include: {
        options: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    return NextResponse.json({ success: true, question: fullQuestion });
  } catch (error) {
    console.error("Update question error:", error);
    return NextResponse.json({ error: "Failed to update question." }, { status: 500 });
  }
}

export async function DELETE(
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
    await db.question.delete({
      where: { id: questionId },
    });

    // Re-index remaining questions
    const remaining = await db.question.findMany({
      where: { testId },
      orderBy: { orderIndex: "asc" },
    });

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].orderIndex !== i) {
        await db.question.update({
          where: { id: remaining[i].id },
          data: { orderIndex: i },
        });
      }
    }

    // Recalculate test total marks
    const totalMarks = remaining.reduce((sum, q) => sum + q.marks, 0);
    await db.test.update({
      where: { id: testId },
      data: { totalMarks },
    });

    return NextResponse.json({ success: true, message: "Question deleted successfully." });
  } catch (error) {
    console.error("Delete question error:", error);
    return NextResponse.json({ error: "Failed to delete question." }, { status: 500 });
  }
}
