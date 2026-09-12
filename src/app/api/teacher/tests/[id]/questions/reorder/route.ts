import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/server-auth";
import { db } from "@/lib/db";

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
    select: { teacherId: true },
  });

  if (!test || test.teacherId !== session.userId) {
    return NextResponse.json({ error: "Forbidden: You do not own this test." }, { status: 403 });
  }

  try {
    const { questionIds } = await request.json();

    if (!Array.isArray(questionIds)) {
      return NextResponse.json({ error: "questionIds array is required." }, { status: 400 });
    }

    // Update orderIndex in a transaction
    await db.$transaction(
      questionIds.map((id: string, index: number) =>
        db.question.update({
          where: { id, testId },
          data: { orderIndex: index },
        })
      )
    );

    return NextResponse.json({ success: true, message: "Questions reordered successfully." });
  } catch (error) {
    console.error("Reorder questions error:", error);
    return NextResponse.json({ error: "Failed to reorder questions." }, { status: 500 });
  }
}
