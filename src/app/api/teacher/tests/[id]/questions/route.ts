import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: testId } = await context.params;

  const questions = await db.question.findMany({
    where: { testId },
    include: {
      options: {
        orderBy: { orderIndex: "asc" },
      },
    },
    orderBy: { orderIndex: "asc" },
  });

  return NextResponse.json({ questions });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session || session.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: testId } = await context.params;

  const test = await db.test.findUnique({
    where: { id: testId },
    select: { id: true, teacherId: true },
  });

  if (!test) {
    return NextResponse.json({ error: "Test not found." }, { status: 404 });
  }

  if (test.teacherId !== session.userId) {
    return NextResponse.json({ error: "Forbidden: You do not own this test." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      questionText = "",
      questionType = "MULTIPLE_CHOICE",
      marks = 1,
      correctAnswer = "",
      options = [],
    } = body;

    // Get current highest orderIndex
    const lastQuestion = await db.question.findFirst({
      where: { testId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });
    const nextOrderIndex = (lastQuestion?.orderIndex ?? -1) + 1;

    const parsedMarks = Math.max(1, parseInt(marks, 10) || 1);

    const newQuestion = await db.question.create({
      data: {
        testId,
        questionText: questionText.trim(),
        questionType,
        marks: parsedMarks,
        correctAnswer: correctAnswer.trim(),
        orderIndex: nextOrderIndex,
        ...(questionType === "MULTIPLE_CHOICE" &&
          Array.isArray(options) && {
            options: {
              create: options.map((opt: any, idx: number) => ({
                optionKey: opt.optionKey || String.fromCharCode(65 + idx),
                optionText: opt.optionText?.trim() || "",
                orderIndex: idx,
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

    // Update total marks on test
    const allQuestions = await db.question.findMany({
      where: { testId },
      select: { marks: true },
    });
    const totalMarks = allQuestions.reduce((sum, q) => sum + q.marks, 0);

    await db.test.update({
      where: { id: testId },
      data: { totalMarks },
    });

    return NextResponse.json({ success: true, question: newQuestion }, { status: 201 });
  } catch (error) {
    console.error("Create question error:", error);
    return NextResponse.json({ error: "Failed to add question." }, { status: 500 });
  }
}
