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
      _count: {
        select: {
          attempts: true,
        },
      },
    },
  });

  if (!test) {
    return NextResponse.json({ error: "Test not found." }, { status: 404 });
  }

  // Teacher ownership authorization check
  if (test.teacherId !== session.userId) {
    return NextResponse.json({ error: "Forbidden: You do not own this test." }, { status: 403 });
  }

  return NextResponse.json({ test });
}

export async function PUT(
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
    select: { teacherId: true },
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
      title,
      subject,
      description,
      instructions,
      durationMinutes,
      passingPercentage,
      maximumAttempts,
      startAt,
      endAt,
      randomizeQuestions,
      randomizeOptions,
    } = body;

    const updated = await db.test.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(subject !== undefined && { subject: subject.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(instructions !== undefined && { instructions: instructions?.trim() || null }),
        ...(durationMinutes !== undefined && { durationMinutes: parseInt(durationMinutes, 10) }),
        ...(passingPercentage !== undefined && { passingPercentage: parseFloat(passingPercentage) }),
        ...(maximumAttempts !== undefined && { maximumAttempts: parseInt(maximumAttempts, 10) }),
        ...(startAt !== undefined && { startAt: startAt ? new Date(startAt) : null }),
        ...(endAt !== undefined && { endAt: endAt ? new Date(endAt) : null }),
        ...(randomizeQuestions !== undefined && { randomizeQuestions: Boolean(randomizeQuestions) }),
        ...(randomizeOptions !== undefined && { randomizeOptions: Boolean(randomizeOptions) }),
      },
    });

    return NextResponse.json({ success: true, test: updated });
  } catch (error) {
    console.error("Update test error:", error);
    return NextResponse.json({ error: "Failed to update test." }, { status: 500 });
  }
}

export async function DELETE(
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
      _count: {
        select: { attempts: true },
      },
    },
  });

  if (!test) {
    return NextResponse.json({ error: "Test not found." }, { status: 404 });
  }

  if (test.teacherId !== session.userId) {
    return NextResponse.json({ error: "Forbidden: You do not own this test." }, { status: 403 });
  }

  // Deletion Protection: Do not allow deletion if there are already student attempts
  if (test._count.attempts > 0) {
    return NextResponse.json(
      {
        error: "Cannot delete test because student attempts have already been recorded. Close the test instead to archive it.",
        attemptCount: test._count.attempts,
      },
      { status: 400 }
    );
  }

  await db.test.delete({
    where: { id },
  });

  return NextResponse.json({ success: true, message: "Test deleted successfully." });
}
